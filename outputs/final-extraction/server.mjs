import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { appendFile, mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
try {
  const envText = readFileSync(path.join(here, '.env'), 'utf8');
  for (const line of envText.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (match && !Object.hasOwn(process.env, match[1])) process.env[match[1]] = match[2].replace(/^(["'])(.*)\1$/, '$2');
  }
} catch { /* Local demo can start before gateway credentials are supplied. */ }
const dataDir = path.join(here, '.local-data');
const queueFile = path.join(dataDir, 'pending-events.json');
const eventLog = path.join(dataDir, 'events.jsonl');
const submissionLog = path.join(dataDir, 'accepted-submissions.jsonl');
const port = Number(process.env.API_PORT || 3001);
const gatewayBaseRaw = (process.env.GATEWAY_BASE_URL || '').trim();
let gatewayBase = '';
let gatewayConfigError = '';
if (gatewayBaseRaw) {
  try {
    const parsed = new URL(gatewayBaseRaw);
    if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('Use an http or https gateway URL.');
    if (parsed.username || parsed.password) throw new Error('Do not put credentials in the gateway URL.');
    gatewayBase = gatewayBaseRaw.replace(/\/$/, '');
  } catch (error) { gatewayConfigError = error.message; }
}
const gameKey = process.env.P2G5_GAME_KEY || '';
const shutdownCodeGameId = process.env.SHUTDOWN_CODE_GAME_ID || '';
const timeoutMs = 3000;
let queue = [];
let flushing = false;
let queueLock = Promise.resolve();

const json = (res, status, body) => {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  res.end(JSON.stringify(body));
};

async function readBody(req) {
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 64_000) throw Object.assign(new Error('Request body is too large.'), { status: 413 });
  }
  try { return raw ? JSON.parse(raw) : {}; }
  catch { throw Object.assign(new Error('Request body must be valid JSON.'), { status: 400 }); }
}

async function persistQueue() {
  await mkdir(dataDir, { recursive: true });
  const tempFile = `${queueFile}.${randomUUID()}.tmp`;
  await writeFile(tempFile, JSON.stringify(queue, null, 2), 'utf8');
  await rename(tempFile, queueFile);
}

async function withQueueLock(action) {
  const previous = queueLock;
  let release;
  queueLock = new Promise((resolve) => { release = resolve; });
  await previous;
  try { return await action(); }
  finally { release(); }
}

async function appendLog(file, entry) {
  await mkdir(dataDir, { recursive: true });
  await appendFile(file, `${JSON.stringify(entry)}\n`, 'utf8');
}

async function gateway(pathname, options = {}) {
  if (gatewayConfigError) throw Object.assign(new Error(`Gateway URL is invalid: ${gatewayConfigError}`), { status: 503 });
  if (!gatewayBase || !gameKey) throw Object.assign(new Error('Gateway URL or p2g5 key is not configured.'), { status: 503 });
  let response;
  try {
    response = await fetch(`${gatewayBase}${pathname}`, {
      ...options,
      headers: { 'X-Game-Key': gameKey, ...(options.body ? { 'content-type': 'application/json' } : {}), ...options.headers },
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    throw Object.assign(new Error(error.name === 'TimeoutError' ? 'Gateway did not respond within 3 seconds.' : 'Gateway could not be reached.'), { status: 504 });
  }
  let body;
  try { body = await response.json(); }
  catch { body = {}; }
  if (!response.ok && response.status !== 409) {
    throw Object.assign(new Error(body.error || body.message || `Gateway returned HTTP ${response.status}.`), { status: response.status, gatewayBody: body });
  }
  return { status: response.status, body };
}

async function flushQueue() {
  if (flushing || queue.length === 0 || !gatewayBase || !gameKey) return;
  flushing = true;
  try {
    while (queue.length) {
      const item = queue[0];
      try {
        await gateway('/api/events', { method: 'POST', body: JSON.stringify(item) });
        await withQueueLock(async () => {
          if (queue[0]?.event_id === item.event_id) queue.shift();
          await persistQueue();
        });
        await appendLog(eventLog, { ...item, delivery: 'accepted', logged_at: new Date().toISOString() });
      } catch (error) {
        if (error.status !== 504 && error.status !== 503 && (error.status < 500 || error.status >= 600)) {
          await withQueueLock(async () => {
            if (queue[0]?.event_id === item.event_id) queue.shift();
            await persistQueue();
          });
          await appendLog(eventLog, { ...item, delivery: 'rejected', error: error.message, logged_at: new Date().toISOString() });
          continue;
        }
        break;
      }
    }
  } finally { flushing = false; }
}

async function init() {
  try { queue = JSON.parse(await readFile(queueFile, 'utf8')); }
  catch { queue = []; }
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://127.0.0.1');
    if (req.method === 'GET' && url.pathname === '/api/health') {
      return json(res, 200, { gateway_configured: Boolean(gatewayBase && gameKey && !gatewayConfigError), gateway_config_error: gatewayConfigError || undefined, shutdown_code_game_id: shutdownCodeGameId, game_id: 'p2g5' });
    }

    const stateMatch = url.pathname.match(/^\/api\/teams\/([^/]+)\/state$/);
    if (req.method === 'GET' && stateMatch) {
      const teamId = decodeURIComponent(stateMatch[1]);
      const result = await gateway(`/api/teams/${encodeURIComponent(teamId)}/state`, { method: 'GET' });
      return json(res, 200, result.body);
    }

    if (req.method === 'POST' && url.pathname === '/api/verify') {
      const input = await readBody(req);
      const fields = ['deletion_key', 'shutdown_code', 'control_token', 'route_code'];
      if (!input.team_id || fields.some((field) => typeof input[field] !== 'string')) {
        return json(res, 400, { error: 'Provide team_id and all four artifact fields.' });
      }
      // /verify logs invalid fields itself. Do not retry automatically after a timeout.
      const result = await gateway('/api/verify', { method: 'POST', body: JSON.stringify(Object.fromEntries(['team_id', ...fields].map((key) => [key, input[key]]))) });
      const validity = Object.fromEntries(fields.map((field) => [field, result.body[field] === 'valid']));
      await appendLog(submissionLog, { team_id: input.team_id, at: new Date().toISOString(), result: validity });
      return json(res, 200, validity);
    }

    if (req.method === 'POST' && url.pathname === '/api/events') {
      const input = await readBody(req);
      const allowedTypes = new Set(['wrong_attempt', 'hint_used', 'solved']);
      if (typeof input.team_id !== 'string' || !input.team_id.trim() || !allowedTypes.has(input.type)) return json(res, 400, { error: 'Unsupported event or missing team_id.' });
      if (input.type === 'solved' && (!Number.isFinite(input.meta?.time_remaining_seconds) || input.meta.time_remaining_seconds < 0)) {
        return json(res, 400, { error: 'A solved event requires a non-negative meta.time_remaining_seconds value.' });
      }
      const event = {
        event_id: randomUUID(), game_id: 'p2g5', team_id: input.team_id.trim(),
        type: input.type, points: 0, money_delta: 0, risk: 0,
        timestamp: new Date().toISOString(), meta: input.meta || {},
      };
      await withQueueLock(async () => { queue.push(event); await persistQueue(); });
      void flushQueue();
      return json(res, 202, { ok: true, queued: true, event_id: event.event_id });
    }

    return json(res, 404, { error: 'Unknown API route.' });
  } catch (error) {
    const status = error.status || 500;
    json(res, status, { error: error.message || 'The request could not be completed.', gateway: error.gatewayBody });
  }
});

await init();
server.listen(port, '127.0.0.1', () => console.log(`Final Extraction adapter listening on http://127.0.0.1:${port}`));
setInterval(() => { void flushQueue(); }, 20_000).unref();
