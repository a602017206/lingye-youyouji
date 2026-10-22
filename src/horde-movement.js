// 群潮小队自动游走与手动方向引导：纯逻辑模块，不依赖浏览器或帧率。
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
export function advanceHero(h,dt) {
  if (!h.hero) return;
  dt=clamp(dt,0,1/15);
  const manual=h.manual??{x:0,y:0};
  const length=Math.hypot(manual.x,manual.y);
  let dx=0,dy=0;
  if(length>.08) {
    dx=manual.x/length;dy=manual.y/length;
  }else if(h.moveMode==='hold')return;
  else {
    // 近处威胁占比更大，不能单纯按怪物数量平均，避免小队主动走入密集区域。
    let weight=0;
    for(const enemy of h.enemies??[]){
      if(enemy.hp===0)continue;
      const vx=h.hero.x-enemy.x,vy=h.hero.y-enemy.y;
      const d2=vx*vx+vy*vy;
      if(d2<230*230&&d2>1){
        const strength=(1-Math.sqrt(d2)/230)**2*(enemy.kind==='boss'?3:enemy.kind==='elite'?1.7:1);
        dx+=vx/Math.sqrt(d2)*strength;dy+=vy/Math.sqrt(d2)*strength;
        weight+=strength;
      }
    }
    // 安全时缓慢靠近战场中央，使敌群四面围攻而非固定在一个角落。
    dx+=((480-h.hero.x)/480)*(.14+weight*.014);
    dy+=((270-h.hero.y)/270)*(.14+weight*.014);
    // 位置连续平滑。若所有方向刚好抵消，停留而非引入不确定性。
    const norm=Math.hypot(dx,dy);
    if(norm<.025)return;
    dx/=norm;dy/=norm;
  }
  const speed=(86+Math.min(4,h.upgrades?.swift??0)*14)*(h.heroSlow>0?.7:1)*(h.heroHaste>0?1.2:1);
  h.hero.x=clamp(h.hero.x+dx*speed*dt,42,918);
  h.hero.y=clamp(h.hero.y+dy*speed*dt,42,498);
}
export function setHordeDirection(h,x,y) {
  if(!h.manual)h.manual={x:0,y:0};
  const mag=Math.hypot(x,y);
  h.manual.x=mag>1?x/mag:x;
  h.manual.y=mag>1?y/mag:y;
}
