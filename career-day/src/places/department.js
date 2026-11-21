import { box, cyl, ball, chair, monitor, label } from '../world/kit.js';
import { hospFloor, BACK, FRONT, LOUNGE, LOCKER, SPOT_BACK, SPOT_FRONT } from './_hosp-floor.js';

const departments = {
  pharmacist: ['병원 약제실', '#c1d8bc', ['pharmacy','조제실'], ['store','약품 창고'], ['counter','투약 창구'], ['meeting','상담실']],
  admin: ['병원 원무과', '#c6d8ed', ['reception','접수 창구'], ['counter','수납 창구'], ['store','서류실'], ['meeting','번호 대기실']],
  physio: ['재활치료실', '#e5c4ac', ['rehab','치료실'], ['counter','운동 매트'], ['meeting','평행봉'], ['store','기구 정리대']],
};
const desk = g => box(g,0,.46,-1.25,2.9,.92,1,'#d7bfa6');
function furnish(g, room) {
  const z = -1.25;
  switch(room.id) {
    case 'pharmacy': case 'medicine':
      desk(g);
      for (const x of [-1,-.4,.2,.8]) {cyl(g,x,1.07,z,.13,.3,'#efd8ad'); cyl(g,x,1.25,z,.14,.07,'#598775');}
      break;
    case 'shelves':
      for(const y of [.45,1.15]) {box(g,0,y,z,3,.12,.8,'#ceb897'); for(const x of [-1,-.5,0,.5,1]) box(g,x,y+.24,z,.34,.38,.4,'#e7edc9');} break;
    case 'dispense': desk(g); for(const x of [-1.25,1.25])box(g,x,1.6,z,.12,1.35,.14,'#819d92');box(g,0,2.25,z,2.6,.15,.15,'#819d92');break;
    case 'reception': case 'pay': desk(g);monitor(g,-.65,z);box(g,.8,1.01,z,.5,.16,.44,'#34465a');label(g,room.id==='pay'?'02':'01',0,1.85,z,1,.6);break;
    case 'files': for(const x of [-.85,.85]) {box(g,x,.9,z,1.35,1.8,.7,'#8aafbf');for(const y of [.45,.92,1.4])box(g,x,y,z+.38,.45,.09,.1,'#445f68');}break;
    case 'queue':chair(g,-1,z);chair(g,0,z);box(g,1,.75,z,.55,1.5,.55,'#adb7c1');label(g,'대기 03',1,1.6,z,.9,.4);break;
    case 'rehab': for(let i=0;i<4;i++)box(g,-1+i*.55,(i+1)*.1,z,.58,(i+1)*.2,1.05,'#c4a077');break;
    case 'mat':box(g,0,.1,z,2.9,.2,1.2,'#8bbfae');break;
    case 'bars':for(const dz of [-.48,.48]) {for(const x of [-1,1])cyl(g,x,.5,z+dz,.06,1,'#aaaeb1');box(g,0,1,z+dz,2.5,.1,.12,'#bb9173');}break;
    case 'gear':box(g,0,.32,z,2.9,.62,.8,'#d7c5ae');for(const x of [-1,-.3])ball(g,x,.96,z,.3,'#c98f78');chair(g,.9,z);for(const x of [.55,1.25])cyl(g,x,.35,z,.34,.09,'#4b5a68').rotation.z=Math.PI/2;break;
    case 'office':desk(g);monitor(g,.4,z);box(g,-.65,1,z,.43,.14,.35,'#425969');break;
    case 'counsel':case 'waiting':chair(g,-.85,z);chair(g,.85,z);break;
  }
}
export function department(id) {
  const [sign,corridor,...spec]=departments[id];
  const fixtures={pharmacist:['medicine','shelves','dispense','counsel'],admin:['reception','pay','files','queue'],physio:['rehab','mat','bars','gear']}[id];
  const rooms=[...spec,['office','인계 사무실'],['waiting',{pharmacist:'가온 님 대기석',admin:'이든 님 안내석',physio:'서우 님 휴식석'}[id]]].map(([key,name],i)=>({
    id:key,name,sign:name,...(i<4?BACK[i]:FRONT[i-4]),color:[corridor,'#dec4ab','#bcd1da','#c8c4d9'][i%4],
    ...(i===4||i===5?{npc:[-1.3,.28],staff:{coat:i===4?'#b5cdca':'#dcafa2',outfit:i===4?'white':'casual',hair:i===4?0:2}}:{}),
  }));
  rooms.push(LOUNGE,LOCKER);
  return hospFloor({floor:id,sign,corridor,rooms,quiet:['office','locker','lounge','store'],
    spots:Object.fromEntries(rooms.map((r,i)=>[r.id,{...(i<4?SPOT_BACK[i]:SPOT_FRONT[i-4]),name:r.name}])),
    blocks:rooms.slice(0,6).map(r=>[r.x-1.5,r.x+1.5,r.z-1.9,r.z-.6]),
    furnish(g,r){const index=rooms.indexOf(r);furnish(g,{id:fixtures[index]||r.id});},
  });
}
