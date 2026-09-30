import React,{useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import * as THREE from 'three';
import App from './App.jsx';
import './style.css';

function Vault({unlocked,opening,playback=0,onBeat,onFinish,skip=false}){
 const host=useRef();const state=useRef({unlocked,opening,playback,onBeat,onFinish,skip});state.current={unlocked,opening,playback,onBeat,onFinish,skip};
 useEffect(()=>{
  const el=host.current,scene=new THREE.Scene();scene.background=new THREE.Color('#111014');scene.fog=new THREE.Fog('#111014',24,65);
  const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.toneMapping=THREE.ACESFilmicToneMapping;el.appendChild(renderer.domElement);
  const camera=new THREE.PerspectiveCamera(40,1,.1,50);camera.position.set(0.4,1.0,10.8);camera.lookAt(0,0,0);
  const metal=new THREE.MeshStandardMaterial({color:0x53565e,metalness:.85,roughness:.32});const dark=new THREE.MeshStandardMaterial({color:0x25262b,metalness:.7,roughness:.48});const edge=new THREE.MeshStandardMaterial({color:0x868991,metalness:.95,roughness:.23});
  function box(w,h,d,mat,x=0,y=0,z=0,parent=scene){let mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh}
  function ring(r,t,mat,z,parent=scene){const mesh=new THREE.Mesh(new THREE.TorusGeometry(r,t,20,100),mat);mesh.position.z=z;parent.add(mesh);return mesh}
  // Cut a circular opening into the wall; the interior is real depth behind it.
  const wallShape=new THREE.Shape();wallShape.moveTo(-7,-5);wallShape.lineTo(7,-5);wallShape.lineTo(7,5);wallShape.lineTo(-7,5);wallShape.closePath();
  const aperture=new THREE.Path();aperture.absarc(0,0,2.42,0,Math.PI*2,true);wallShape.holes.push(aperture);
  const wall=new THREE.Mesh(new THREE.ExtrudeGeometry(wallShape,{depth:.45,bevelEnabled:false,curveSegments:80}),dark);wall.position.z=-.65;scene.add(wall);
  const tunnelMaterial=new THREE.MeshStandardMaterial({color:0x272d31,roughness:.65,metalness:.5,side:THREE.BackSide});
  const tunnel=new THREE.Mesh(new THREE.CylinderGeometry(2.42,2.42,14,80,1,true),tunnelMaterial);tunnel.rotation.x=Math.PI/2;tunnel.position.z=-7.5;scene.add(tunnel);
  const lightMaterial=new THREE.MeshStandardMaterial({color:0xffdb9c,emissive:0xffbc63,emissiveIntensity:3});
  const gold=new THREE.MeshStandardMaterial({color:0xd7a54d,roughness:.23,metalness:.82});
  box(4.4,.14,14,dark,0,-1.75,-7.5);
  for(let z=-1.1;z>-14;z-=2.1){ring(2.34,.065,metal,z);for(let x of [-1.66,1.66]){box(.075,.025,1.2,lightMaterial,x,-1.66,z);box(.045,.54,.08,lightMaterial,x,.7,z);}box(3.5,.013,.035,metal,0,-1.672,z);}
  for(let z of [-3,-7,-11]){const lamp=new THREE.PointLight(0xffc884,9,5);lamp.position.set(0,1.6,z);scene.add(lamp);}
  for(let side of [-1,1]){for(let row=0;row<2;row++){let x=side*1.12,z=-4.2-row*2.5;box(.9,.65,1.25,metal,x,-1.36,z);for(let stack=0;stack<2;stack++)for(let k=0;k<3;k++){const bar=box(.2,.12,.58,gold,x+(k-1)*.24,-.96+stack*.13,z);bar.rotation.y=.04*(k-1);}}}
  const exitDoors=[box(2.4,4.8,.18,metal,-1.2,0,-14.5),box(2.4,4.8,.18,metal,1.2,0,-14.5)];
  box(.055,3.7,.04,lightMaterial,0,0,-14.38);
  const exitSeam=scene.children[scene.children.length-1];
  // A loading bay and waiting transport sit beyond the tunnel doors.
  const concrete=new THREE.MeshStandardMaterial({color:0x252c32,roughness:.92});
  box(14,.15,38,concrete,0,-1.8,-33);box(.2,9,35,concrete,-7,2,-32);box(.2,9,35,concrete,7,2,-32);box(14,.15,35,concrete,0,6,-32);
  for(let z=-18;z>-47;z-=6){for(let x of [-5.6,5.6]){box(.3,7,.4,metal,x,1.7,z);box(.06,1.8,.08,lightMaterial,x,.6,z);}box(6,.04,.4,lightMaterial,0,5.4,z);const lamp=new THREE.PointLight(0x9ac8d8,25,11);lamp.position.set(0,4,z);scene.add(lamp);}
  for(let x of [-2.4,2.4])box(.065,.015,32,gold,x,-1.712,-32);
  const van=new THREE.Group();van.position.set(0,-.25,-22);scene.add(van);
  const vanPaint=new THREE.MeshStandardMaterial({color:0x182c31,roughness:.31,metalness:.75});
  box(2.55,.14,5.4,vanPaint,0,-.65,0,van);box(2.55,.14,5.4,vanPaint,0,1.68,0,van);box(.12,2.4,5.4,vanPaint,-1.23,.48,0,van);box(.12,2.4,5.4,vanPaint,1.23,.48,0,van);box(2.55,2.4,.12,vanPaint,0,.48,-2.6,van);box(2.65,.18,.22,edge,0,-.42,2.8,van);
  for(let side of [-1,1]){const rearDoor=box(1.18,2,.1,metal,side*1.65,.6,2.45,van);rearDoor.rotation.y=side*1.1;box(.15,.46,.12,new THREE.MeshStandardMaterial({color:0xff2c31,emissive:0xff1726,emissiveIntensity:4}),side*1.14,-.05,2.84,van);for(let z of [-1.7,1.7]){let tire=new THREE.Mesh(new THREE.CylinderGeometry(.57,.57,.25,24),dark);tire.rotation.z=Math.PI/2;tire.position.set(side*1.29,-.87,z);van.add(tire);}}
  // Two stylized heist crew celebrate in the open cargo bay.
  const redSuit=new THREE.MeshStandardMaterial({color:0xc92138,roughness:.75});
  const skin=new THREE.MeshStandardMaterial({color:0xe2a27f,roughness:.8});
  const black=new THREE.MeshStandardMaterial({color:0x101016,roughness:.8});
  const white=new THREE.MeshStandardMaterial({color:0xf5eadb,roughness:.6});
  function ball(parent,r,mat,x,y,z,sx=1,sy=1,sz=1){const m=new THREE.Mesh(new THREE.SphereGeometry(r,24,16),mat);m.position.set(x,y,z);m.scale.set(sx,sy,sz);parent.add(m);return m}
  const crew=[];
  for(let side of [-1,1]){
   const person=new THREE.Group();person.position.set(side*.56,0,2.22);van.add(person);
   ball(person,.32,redSuit,0,.32,0,.85,1.35,.7);box(.025,.65,.025,black,0,.33,.235,person);
   for(let x of [-.15,.15]){box(.19,.42,.22,redSuit,x,-.24,0,person);ball(person,.14,black,x,-.48,.09,1,.6,1.4)}
   ball(person,.265,redSuit,0,.98,-.035,1.12,1.2,1);ball(person,.23,skin,0,.98,.09,1,1.07,.82);
   ball(person,.018,black,-.078,1.025,.267);ball(person,.018,black,.078,1.025,.267);
   const smile=new THREE.Mesh(new THREE.TorusGeometry(.088,.022,10,24,Math.PI),white);smile.rotation.z=Math.PI;smile.position.set(0,.951,.276);person.add(smile);
   for(let handSide of [-1,1]){const shoulder=new THREE.Group();shoulder.position.set(handSide*.23,.57,0);person.add(shoulder);box(.16,.44,.17,redSuit,0,.2,0,shoulder);ball(shoulder,.09,skin,0,.46,.015);shoulder.rotation.z=-handSide*.7;crew.push({shoulder,handSide,side,person})}
   // White theatrical mask hangs at the belt, leaving the smiling face visible.
   const mask=ball(person,.11,white,side*.28,.03,.24,.72,1.25,.35);ball(person,.015,black,side*.28-.035,.055,.281);ball(person,.015,black,side*.28+.035,.055,.281);
  }
  for(let side of [-1,1]){ball(van,.28,dark,side*.85,-.39,2.45,1,.7,.8);for(let k=0;k<3;k++){const ingot=box(.19,.075,.27,gold,side*.85+(k-1)*.065,-.16+k*.055,2.44,van);ingot.rotation.y=k*.22}}
  const cargoLamp=new THREE.PointLight(0xffd6a0,9,5);cargoLamp.position.set(0,1.4,3.4);van.add(cargoLamp);
  const rearGlow=new THREE.PointLight(0xff2037,6,6);rearGlow.position.set(0,.3,3.1);van.add(rearGlow);
  const exitLight=new THREE.PointLight(0xd2e7f2,55,22);exitLight.position.set(0,2,-44);scene.add(exitLight);
  const signCanvas=document.createElement('canvas');signCanvas.width=768;signCanvas.height=160;const ctx=signCanvas.getContext('2d');ctx.fillStyle='#101b20';ctx.fillRect(0,0,768,160);ctx.fillStyle='#d5f5e8';ctx.font='bold 54px Arial';ctx.textAlign='center';ctx.fillText('EXTRACTION  /  NORTH 07',384,98);const signTex=new THREE.CanvasTexture(signCanvas);box(4.8,1,.04,new THREE.MeshBasicMaterial({map:signTex}),0,3.4,-18);
  ring(2.64,.26,metal,-.1);ring(2.42,.08,edge,.03);
  const hinge=new THREE.Group();hinge.position.set(-2.35,0,0);scene.add(hinge);const door=new THREE.Group();door.position.x=2.35;hinge.add(door);
  let disk=new THREE.Mesh(new THREE.CylinderGeometry(2.37,2.37,.48,96),metal);disk.rotation.x=Math.PI/2;door.add(disk);ring(2.15,.04,edge,.26,door);ring(1.96,.035,dark,.27,door);
  for(let i=0;i<24;i++){let a=i*Math.PI/12;box(.085,.085,.07,edge,Math.cos(a)*2.23,Math.sin(a)*2.23,.28,door)}
  const wheel=new THREE.Group();wheel.position.z=.59;door.add(wheel);ring(.8,.075,edge,0,wheel);let hub=new THREE.Mesh(new THREE.CylinderGeometry(.2,.2,.25,24),edge);hub.rotation.x=Math.PI/2;wheel.add(hub);
  for(let i=0;i<6;i++){const arm=box(.07,.78,.07,metal,0,.39,0,wheel);const pivot=new THREE.Group();wheel.remove(arm);pivot.add(arm);pivot.rotation.z=i*Math.PI/3;wheel.add(pivot)}
  const bolts=[];for(let i=0;i<4;i++){let g=new THREE.Group();g.rotation.z=i*Math.PI/2;door.add(g);let b=box(.24,.8,.22,edge,0,2.03,.35,g);bolts.push(b);box(.42,.3,.31,dark,0,1.75,.31,g)}
  for(let x of [-4.1,4.1]){box(.06,7,.04,new THREE.MeshStandardMaterial({color:0xf12742,emissive:0xe72039,emissiveIntensity:4}),x,0,-.7);for(let y of [-3,0,3])box(1.3,.025,.02,metal,x,y,-.76)}
  const floor=box(16,.1,16,dark,0,-2.85,1);scene.add(new THREE.HemisphereLight(0xb6c6e5,0x15121a,2));const key=new THREE.DirectionalLight(0xd9e3ff,4);key.position.set(1,5,6);scene.add(key);const red=new THREE.PointLight(0xff1230,32,14);red.position.set(-4,0,3);scene.add(red);const warm=new THREE.PointLight(0xffc368,0,9);warm.position.set(0,0,1);scene.add(warm);
  let frame,t=0,openStarted=null,lastPlayback=-1,lastBeat='',finished=false;const clock=new THREE.Clock();function resize(){const w=el.clientWidth,h=el.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix()}let observer=new ResizeObserver(resize);observer.observe(el);resize();
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const smooth=(v)=>{v=THREE.MathUtils.clamp(v,0,1);return v*v*(3-2*v)};
  function animate(){frame=requestAnimationFrame(animate);t=clock.getElapsedTime();const s=state.current;const startZ=camera.aspect<1?12.4:10.8;bolts.forEach((b,i)=>{const target=i<s.unlocked?1.58:2.03;b.position.y+=(target-b.position.y)*.06});
   if(s.opening){if(openStarted===null||lastPlayback!==s.playback){openStarted=t;lastPlayback=s.playback;lastBeat='';finished=false;}const elapsed=(reduced||s.skip)?24:t-openStarted;const doorP=smooth((elapsed-1.3)/5.5),travel=smooth((elapsed-7)/9),exitP=smooth((elapsed-12)/2.5),depart=smooth((elapsed-18)/6);
    wheel.rotation.z=Math.min(elapsed/1.3,1)*Math.PI*1.1;hinge.rotation.y=-1.8*doorP;warm.intensity=3*doorP;
    camera.position.set(.4*(1-travel),1-.95*travel,startZ+(-15.6-startZ)*travel);camera.lookAt(0,.05*travel,-26*travel);camera.fov=40+12*travel;camera.updateProjectionMatrix();
    exitDoors[0].position.x=-1.2-exitP*2.4;exitDoors[1].position.x=1.2+exitP*2.4;exitSeam.visible=exitP<.03;van.position.z=-22-25*depart;
    const follow=smooth((elapsed-17)/3);camera.position.z=THREE.MathUtils.lerp(camera.position.z,van.position.z+6.5,follow);camera.position.y=THREE.MathUtils.lerp(camera.position.y,.65,follow);camera.lookAt(0,.3,THREE.MathUtils.lerp(-26*travel,van.position.z+2,follow));
    crew.forEach(({shoulder,handSide,side,person})=>{shoulder.rotation.z=-handSide*(.6+(reduced?0:Math.sin(t*5+side)*.25));person.position.y=reduced?0:Math.sin(t*5+side)*.045});
    const beat=elapsed<7?'vault':elapsed<13?'tunnel':elapsed<18?'boarding':elapsed<23?'escape':'clear';if(beat!==lastBeat){lastBeat=beat;s.onBeat?.(beat)}if(elapsed>=24&&!finished){finished=true;s.onFinish?.()}
   }else{openStarted=null;finished=false;lastBeat='';wheel.rotation.z=0;hinge.rotation.y=0;warm.intensity=0;camera.position.set(.4,1,startZ);camera.lookAt(0,0,0);camera.fov=40;camera.updateProjectionMatrix();exitDoors[0].position.x=-1.2;exitDoors[1].position.x=1.2;exitSeam.visible=true;van.position.z=-22}
   red.intensity=reduced?25:25+Math.sin(t*1.4)*6;renderer.render(scene,camera)}animate();
  return()=>{cancelAnimationFrame(frame);observer.disconnect();renderer.dispose();const materials=new Set();scene.traverse(o=>{o.geometry?.dispose();if(o.material)materials.add(o.material)});materials.forEach(m=>m.dispose());signTex.dispose();el.replaceChildren()};
 },[]);return <div className="vault-canvas" ref={host} aria-label="Interactive three-dimensional steel vault"/>;
}
createRoot(document.getElementById('root')).render(<App Vault={Vault}/>);
