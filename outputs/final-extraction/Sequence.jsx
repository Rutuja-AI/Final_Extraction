import React,{useState} from 'react';

const actions=[
 {id:'crew',label:'Signal the getaway crew',detail:'Transmit the extraction signal.'},
 {id:'locks',label:'Release the vault locks',detail:'Withdraw the mechanical interlocks.'},
 {id:'surveillance',label:'Disable surveillance',detail:'Loop the Mint’s camera feeds.'},
 {id:'passage',label:'Open the extraction passage',detail:'Clear the crew’s route out.'},
 {id:'alarm',label:'Disconnect the vault alarm',detail:'Isolate the door-contact circuit.'},
];
export const correctOrder=['surveillance','alarm','locks','passage','crew'];
export function isCorrectOrder(order){return order.length===correctOrder.length&&order.every((id,i)=>id===correctOrder[i]);}

export default function Sequence({onComplete,onPenalty,onHint,attempts,hints}){
 const [order,setOrder]=useState([]),[message,setMessage]=useState('Select the actions in execution order.'),[hint,setHint]=useState(false);
 function submit(){if(isCorrectOrder(order)){onComplete();}else{onPenalty();setMessage('Sequence rejected. 30 seconds deducted. Review the evidence and try again.');}}
 return <><div className="step"><span>02</span><div><p className="eyebrow">THE PROFESSOR’S LAST INSTRUCTION</p><h2>Get the order right.</h2></div></div><p className="intro">The credentials got you this far. Reconstruct the only safe extraction sequence.</p>
 <details className="clues" open><summary>Recovered field notes</summary><ul><li>Door-contact isolation must follow the camera loop, before any lock moves.</li><li>The passage remains sealed until the locks are released.</li><li>The getaway crew moves only after the passage is open.</li></ul></details>
 <p className="eyebrow sequence-label">AVAILABLE ACTIONS</p><div className="action-bank">{actions.filter(a=>!order.includes(a.id)).map(a=><button key={a.id} className="action-card" onClick={()=>setOrder(v=>[...v,a.id])}><strong>{a.label}</strong><span>{a.detail}</span></button>)}{order.length===5&&<p className="intro">All actions queued. Check the order below.</p>}</div>
 <div className="queue" aria-label="Your extraction sequence"><p className="eyebrow">YOUR SEQUENCE · {order.length} / 5</p>{order.length===0?<p className="empty-queue">Select an action above to begin.</p>:<ol>{order.map((id,i)=><li key={id}><span>{actions.find(a=>a.id===id).label}</span><button aria-label={'Remove '+actions.find(a=>a.id===id).label} onClick={()=>setOrder(v=>v.filter(x=>x!==id))}>×</button></li>)}</ol>}</div>
 <p className="feedback" role="status">{message}</p><button className="primary" disabled={order.length!==5} onClick={submit}>Execute extraction</button><div className="sequence-tools"><button className="text-button" onClick={()=>{setOrder([]);setMessage('Sequence cleared. Select the actions in execution order.')}} disabled={!order.length}>Clear sequence</button><button className="text-button" disabled={hint} onClick={()=>{setHint(true);onHint()}}>Reveal hint · −100 points</button></div>{hint&&<p className="hint">Start with surveillance. End with the getaway signal.</p>}<p className="demo-note">Demo rules: wrong sequence −30 seconds and −150 points. Attempts: {attempts} · Hints: {hints}.</p></>;
}
