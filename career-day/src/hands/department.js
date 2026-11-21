import { box, cyl, ball } from '../world/kit.js';
import { workbench, print, unit, table, tray, seal } from './bench-input.js';
import { rxcheck as flatRx } from './rxcheck.js';
import { paperwork as flatPaper } from './paperwork.js';

function prescription(g,ui,sc){
  table(g);tray(g,0,0,5.5,3.65,'#bac6bc');
  const x=[-1.32,1.32], keys=['name','times','days'], z=[-.72,-.04,.64];
  const fields=[[],[]], marked=new Set();let row=0;
  for(let s=0;s<2;s++){
    box(g,x[s],.72,0,2.42,.12,2.76,s?'#f3d7a2':'#faf9f2');
    print(g,x[s],.8,-1.15,2.25,.35,[s?'준비된 봉투':'가온 님 처방전'],s?'#efd099':'#d1e0d8');
    keys.forEach((k,i)=>fields[s].push(print(g,x[s],.81,z[i],2.23,.54,[''])));
  }
  // 처방전은 집게판에 끼우고 봉투 아래에는 봉합선과 포장된 약포지를 둔다.
  box(g,-1.32,.85,-1.42,.68,.12,.17,'#748687');
  for(let i=0;i<5;i++)box(g,.38+i*.45,.8,1.17,.34,.045,.085,'#c29c67');
  const strip=unit(g,1.52,.82,1.52);box(strip,0,0,0,1.50,.06,.46,'#b6c2c2');
  for(const x of [-.51,0,.51])ball(strip,x,.08,0,.16,'#efd8b7',[1,.53,.84]);
  const diffs=sc.rx.flatMap((r,i)=>keys.filter(k=>r[k]!==sc.bag[i][k]).map(k=>i+'.'+k));
  function show(){for(const [s,data] of [sc.rx,sc.bag].entries())keys.forEach((k,i)=>fields[s][i]([data[row][k]],s&&marked.has(row+'.'+k)?'#f5b485':'#fff9ea'));ui.say((row+1)+' / '+sc.rx.length+' · 같은 줄을 비교하고 다른 칸에 검토 도장을 놓아요.');}
  keys.forEach((k,i)=>ui.area(k,x[1],.81,z[i],2.3,.62));
  const stamp=unit(g,-1.75,.82,1.44);stamp.name='검토 도장';seal(stamp,0,0,0);cyl(stamp,0,.16,0,.10,.26,'#486f73');
  ui.drag(stamp,.95,.7,key=>{
    if(!keys.includes(key))return;
    const id=row+'.'+key;
    if(!diffs.includes(id))return ui.wrong('처방전과 봉투에 모두 '+sc.rx[row][key]+'라고 적혀 있어요. 이 칸은 일치해요.');
    marked.add(id);show();ui.say('다른 칸에 도장을 남겼어요. 확인 '+marked.size+' / '+diffs.length);
  });
  ui.button('이전 줄',()=>{row=(row+sc.rx.length-1)%sc.rx.length;show();});
  ui.button('다음 줄',()=>{row=(row+1)%sc.rx.length;show();});
  ui.button('봉투 인계',()=>marked.size===diffs.length?ui.finish():ui.wrong('대조가 끝나지 않았어요. 남은 줄의 횟수와 기간을 확인해요.'));
  show();
}
function filing(g,ui,sc){
  table(g);let current=0;
  const xs=[-1.8,0,1.8],counts=[0,0,0];
  const tags=sc.trays.map((t,i)=>{
    tray(g,xs[i],-.82,1.56,1.47,'#ac896e');box(g,xs[i],.77,-.08,1.53,.32,.13,'#bb9778');
    box(g,xs[i],.81,.015,.48,.09,.09,'#575b59');
    ui.area(t.id,xs[i],.81,-.82,1.68,1.65);
    return print(g,xs[i],.86,-.84,1.48,.77,[t.label,'0장']);
  });
  const doc=unit(g,-1.18,.78,1.12);doc.name='맨 위 서류';box(doc,0,0,0,2.58,.12,1.03,'#fffae8');
  const stack=sc.cards.slice(1).map((_,i)=>box(g,-1.18-i*.035,.66+i*.016,1.16+i*.035,2.58,.018,1.03,i%2?'#e2d6bd':'#faf3da'));
  const face=print(doc,0,.07,0,2.53,.96,['']);
  function refresh(){if(current===sc.cards.length){doc.visible=false;ui.say('서류 여섯 장을 보관했어요. 화면에 무엇이 남았나요?');return;}
    const c=sc.cards[current];face([c.label,c.sub]);ui.say((current+1)+' / 6 · '+c.label+'을 집어 보관할 서랍에 넣어요.');}
  ui.drag(doc,2.58,1.13,id=>{
    if(current>=sc.cards.length)return;
    const c=sc.cards[current];if(c.to!==id)return ui.wrong(c.why);
    const i=sc.trays.findIndex(t=>t.id===id);counts[i]++;tags[i]([sc.trays[i].label,counts[i]+'장']);
    box(g,xs[i],.91+counts[i]*.05,-1.25,1.05,.04,.29,'#fff8e8');if(stack.length)stack.pop().visible=false;current++;refresh();
  });
  box(g,1.55,.78,1.12,2.15,.4,1.23,'#374c58');
  const screen=print(g,1.55,1.0,1.02,1.95,.78,['접수 목록','이든 · 010-****','새봄 · 010-****'],'#d8e9df');
  print(g,1.55,1.01,1.62,1.25,.34,['화면 잠금'],'#b5c9d1');
  const lock=()=>{if(current<6)return ui.wrong('창구에 아직 서류가 펼쳐져 있어요. 서랍에 보관한 뒤 화면을 잠가요.');screen(['잠김','● ● ●'],'#8cabb8');ui.say('접수 화면이 잠겼어요. 방문자 이름과 연락처가 가려졌어요.');ui.finish();};
  ui.area('잠금 키',1.55,1,1.62,1.45,.63,lock);ui.button('창구 비우기',()=>ui.wrong(current<6?'방문자의 서류가 창구에 남아 있어요.':'방문자 목록이 화면에 남아 있어요. 잠금 키를 눌러요.'));refresh();
}
function pathway(g,ui){
  table(g);box(g,0,.62,-.62,5.5,.13,1.8,'#b8cda3');box(g,0,.71,-.62,5.5,.07,.59,'#e4c7a7');
  for(let i=0;i<4;i++)box(g,-.65+i*.32,.74+i*.07,-.65,.32,.12+i*.14,.82,'#aa937f');
  box(g,2.12,1.04,-.9,.88,.7,.84,'#e5b686');box(g,2.12,1.46,-.9,1.06,.17,1.01,'#a85844');
  print(g,2.12,1.57,-.9,1,.52,['빵집']);ball(g,-2.45,1.21,-1.38,.33,'#79a37d');
  const locations=[-1.72,0,1.15];locations.forEach((x,i)=>ui.area(String(i),x,.82,-.64,1.03,1.3));
  let count=0;
  const bench=unit(g,-1.3,.76,1.14),rail=unit(g,1.25,.76,1.14);
  box(bench,0,.25,0,1.05,.14,.45,'#ae7650');box(bench,0,.48,-.18,1.05,.35,.09,'#bb855d');
  for(const x of [-.4,.4]){box(bench,x,.11,0,.1,.22,.38,'#526267');cyl(rail,x,.31,0,.06,.62,'#889397');}box(rail,0,.63,0,1,.10,.12,'#9a764c');
  for(const [obj,name,goal] of [[bench,'벤치','0'],[rail,'난간','1']]){
    obj.name=name;let placed=false;
    ui.drag(obj,1.32,1,id=>{
      if(placed)return;
      if(id!==goal)return ui.wrong(obj===bench?(id==='2'?'계단을 지난 뒤예요. 서우 님은 오르기 전에 쉬고 싶다고 했어요.':'계단 한가운데는 앉을 자리를 두기 어려워요.'):'이 길에는 단차가 없어요. 손으로 짚을 곳이 필요한 구간을 찾아요.');
      obj.position.set(locations[+id],.82,-.67);placed=true;obj.userData.fixed=true;count++;
      ui.say(name+' 설치를 마쳤어요.');if(count===2)ui.finish();
    });
  }
  ui.say('서우 님이 계단을 오르기 전에 쉬고 싶대요. 두 시설을 모형 길에 직접 놓아요.');
}
function directions(g,ui){
  table(g);const xs=[-1.55,1.55];let placed=0;
  xs.forEach((x,i)=>{box(g,x,.94,-.92,1.85,.75,1,'#adc4d1');box(g,x,.99,-.40,.70,.66,.08,'#657d8a');print(g,x,1.34,-.91,1.82,.7,[i?'3층 진료실':'2층 승강기']);ui.area(String(i),x,.70,-.08,1.9,1);});
  ['↑ 3층으로','도착 · 진료실'].forEach((text,i)=>{
    const obj=unit(g,xs[i]*-.78,.68,1.35);obj.name=text;
    box(obj,0,.06,0,.75,.12,.46,'#737e83');cyl(obj,0,.32,0,.07,.56,'#66757a');box(obj,0,.62,0,1.26,.22,.57,'#e9c879');print(obj,0,.75,0,1.24,.54,[text]);
    ui.drag(obj,1.38,.95,id=>{if(id!==String(i))return ui.wrong(i?'여기는 옛 위치예요. 도착 표지를 보면 이든 님이 여기서 기다리게 돼요.':'이든 님이 이미 진료실에 도착한 자리예요. 더 올라가라는 표지가 필요할까요?');
      obj.position.set(xs[i],.62,0);obj.userData.fixed=true;
      if(++placed===2)ui.finish();else ui.say('안내대를 세웠어요. 남은 표지도 방문자의 길을 따라 놓아요.');
    });
  });ui.say('이든 님이 옛 진료실로 돌아가지 않게 두 안내대를 세워요.');
}
function counsel(g,ui){
  table(g);const folder=unit(g,-1.3,.66,1.15);folder.name='질문 수첩';
  box(folder,0,.07,0,1.4,.17,.98,'#627e89');print(folder,0,.17,0,1.30,.9,['가온 님','질문 수첩']);
  tray(g,-1.25,-.85,1.9,1.25,'#9ebcaf');tray(g,1.25,-.85,1.85,1.25,'#ae987f');
  print(g,-1.25,.71,-.85,1.7,.7,['상담 자리']);print(g,1.25,.71,-.85,1.7,.7,['의료진 문의함']);
  const envelope=unit(g,1.3,.68,1.16);envelope.name='문의 봉투';box(envelope,0,.04,0,1.45,.08,.95,'#e7cf98');print(envelope,0,.09,0,1.35,.8,['미회신 문의','✉']);
  ui.area('상담',-1.25,.72,-.85,1.9,1.45);ui.area('문의',1.25,.72,-.85,1.9,1.45);
  ui.drag(folder,1.6,1.1,id=>{if(id!=='상담')return ui.wrong('수첩은 가온 님이 함께 펼쳐 볼 개인 메모예요. 문의함에 보관하면 읽을 수 없어요.');
    folder.position.set(-1.25,.73,-.85);folder.userData.fixed=true;ui.say('수첩을 펼쳐 질문을 들었어요. 답을 기다리는 문의를 이어 주세요.');});
  ui.drag(envelope,1.6,1.1,id=>{if(!folder.userData.fixed)return ui.wrong('어떤 질문인지 아직 함께 확인하지 않았어요. 가온 님 수첩부터 펼쳐요.');
    if(id!=='문의')return ui.wrong('확인되지 않은 답을 상담에서 건네지 않아요. 의료진에게 확인을 요청해요.');
    envelope.position.set(1.25,.73,-.85);envelope.userData.fixed=true;ui.finish();});
  ui.say('약속 시각에 가온 님이 오셨어요. 수첩을 들고 상담을 시작해요.');
}
const models={rxcheck:prescription,paperwork:filing,physiopath:pathway,adminroute:directions,rxhandoff:counsel};
export const departmentHands=Object.fromEntries(Object.entries(models).map(([name,model])=>[name,(el,sc,ctx)=>{
  if(!ctx.world&&name==='rxcheck')return flatRx(el,sc,ctx);
  if(!ctx.world&&name==='paperwork')return flatPaper(el,sc,ctx);
  return workbench(el,sc,ctx,model);
}]));
