import fs from 'node:fs';
import path from 'node:path';
import * as esbuild from 'esbuild';
const root=process.cwd();
const packages={react:'react/index.js','react-dom/client':'react-dom/client.js','react-dom':'react-dom/index.js',scheduler:'scheduler/index.js',three:'three/build/three.module.js'};
const result=await esbuild.build({stdin:{contents:fs.readFileSync('src.jsx','utf8'),loader:'jsx',resolveDir:root,sourcefile:'src.jsx'},bundle:true,write:false,minify:true,format:'iife',define:{'process.env.NODE_ENV':'"production"'},plugins:[{name:'workspace-reader',setup(b){b.onResolve({filter:/.*/},a=>{if(a.path.endsWith('.css'))return {path:a.path,namespace:'css-skip'};const file=packages[a.path]?path.join(root,'node_modules',packages[a.path]):path.resolve(a.importer?path.dirname(a.importer):root,a.path);return {path:file,namespace:'workspace'}});b.onLoad({filter:/.*/,namespace:'css-skip'},()=>({contents:''}));b.onLoad({filter:/.*/,namespace:'workspace'},a=>({contents:fs.readFileSync(a.path,'utf8'),loader:a.path.endsWith('.jsx')?'jsx':'js'}));}}]});
fs.mkdirSync('dist',{recursive:true});fs.writeFileSync('dist/app.js',result.outputFiles[0].text);fs.copyFileSync('style.css','dist/style.css');fs.writeFileSync('dist/index.html',fs.readFileSync('index.html','utf8').replace('<script type="module" src="/src.jsx"></script>','<link rel="stylesheet" href="./style.css"/><script src="./app.js"></script>'));console.log('Built playable offline preview.');

