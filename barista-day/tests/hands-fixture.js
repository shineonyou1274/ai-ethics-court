// Local-only reproduction setup. Append to a COPY of game.js, never ship this in dist.
// No interaction is completed here: drag/tap/rub checks use the visible browser.
const qaCase=new URLSearchParams(location.search).get('case');
if(qaCase){
 $('intro').hidden=true;started=true;state.phase='serve';state.order={...orders[0]};
 const {Payment}=await import('./payment-state.mjs');
 if(qaCase==='pay'){state.payment=new Payment(4000,'cash',10000);checkout.open()}
 if(qaCase==='brew'){state.payment=new Payment(4500,'card');state.payment.paid=true;state.payment.receiptGiven=true;state.order={...orders[2]};state.cup='에스프레소';state.cupId='cup-1';state.cleanCups=[];workbench.open()}
 if(qaCase==='wash'||qaCase==='rack'){const {WashCup}=await import('./wash-state.mjs');state.cleanCups=[];state.washCups=[new WashCup(0,'cup-1')];if(qaCase==='rack'){const c=state.washCups[0];c.points.forEach(p=>p.clean=true);c.rinsing=1.5;c.dry=true}washbench.open()}
 if(qaCase==='people'){
  const stage=new T.Scene();stage.background=new T.Color('#dce4db');stage.add(new T.HemisphereLight(0xfff4dc,0x758b79,3));
  const light=new T.DirectionalLight(0xffffff,2);light.position.set(-3,6,4);stage.add(light);
  for(let i=0;i<3;i++){const n=person(i);stage.add(n.g);n.g.position.set((i-1)*1.1,0,0);n.g.rotation.y=.2;sign(orders[i].name,.8,.25,(i-1)*1.1,-.15,0,'#2f6b55','#fffdf8',stage)}
  const cam=new T.PerspectiveCamera(35,innerWidth/(innerHeight*.56),.1,30);cam.position.set(0,2.5,7.5);cam.lookAt(0,.85,0);window.qaGallery={scene:stage,camera:cam};
 }
 const note=document.createElement('div');note.textContent='재현용 시작 장면 · '+qaCase;note.style.cssText='position:fixed;bottom:0;left:0;background:#fffdf8;color:#263c52;font:12px sans-serif;padding:3px;z-index:100;pointer-events:none';document.body.append(note);
}
