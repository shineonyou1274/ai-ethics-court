// The three cameras see the same market interview, from three different positions.
export function drawFeed(canvas,channel,{pan=0,focus=0,caption=false}={}){
 const ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height;
 ctx.save();ctx.clearRect(0,0,w,h);ctx.fillStyle='#20394c';ctx.fillRect(0,0,w,h);
 ctx.filter='blur('+Math.abs(focus)*4+'px)';
 function rect(x,y,a,b,c){ctx.fillStyle=c;ctx.fillRect(x,y,a,b)}
 function ellipse(x,y,a,b,c){ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(x,y,a,b,0,0,Math.PI*2);ctx.fill()}
 rect(0,0,w,h,'#85aaa7');
 for(let i=0;i<11;i++)rect(i*30,0,31,28,i%2?'#c16e51':'#f1d6a0');
 rect(0,h*.78,w,h*.22,'#ad8057');
 function person(x,y,size,apron){
  ctx.save();ctx.translate(x,y);ctx.scale(size,size);ellipse(0,69,41,58,apron?'#9a5950':'#3b5e72');
  if(apron){rect(-20,45,40,53,'#d4ad73');rect(-15,32,4,20,'#e0bb81');rect(10,32,4,20,'#e0bb81')}
  ellipse(0,3,26,31,'#e3b393');ellipse(-1,-19,26,13,'#493c39');ellipse(-9,1,2,2,'#483b36');ellipse(9,1,2,2,'#483b36');
  ctx.strokeStyle='#995e4c';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,11,7,.2,2.8);ctx.stroke();ctx.restore()
 }
 if(channel===1){person(85,66,.72,false);person(211,64,.75,true)}
 if(channel===2)person(148+pan*115,60+pan*56,1.19,true);
 if(channel===3){ellipse(146,106,106,34,'#8e643f');for(let i=0;i<7;i++)ellipse(74+i*24,96+Math.cos(i)*6,17,11,i%2?'#e6d4ab':'#aaa879');ellipse(67,65,37,14,'#dea786');ellipse(220,61,36,14,'#dea786')}
 ctx.restore();if(caption){rect(14,110,160,27,'#203b4c');ctx.fillStyle='#fff6df';ctx.font='bold 17px sans-serif';ctx.fillText('시장 떡집 · 보람',22,130)}
}
