// 六生态守护者专属危险范围：所有命中判定是纯几何计算，可重复测试。
import { maxPartyHp } from './engine.js';
const PI=Math.PI;
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
export const BOSS_STYLES=[
  {kind:'groveRoots',name:'藤根围猎',hint:'追踪根阵 · 避开绿金法阵',color:'#a8de85'},
  {kind:'sandRush',name:'赤砂冲锋',hint:'横向沙墙 · 逃离冲锋路线',color:'#eac17c'},
  {kind:'tidalCrest',name:'潮线拍岸',hint:'交错潮带 · 观察安全间隙',color:'#80d5ea'},
  {kind:'frostFan',name:'极霜吐息',hint:'前方扇形 · 绕到侧翼',color:'#a9dfff'},
  {kind:'sporeWells',name:'暮孢陷阱',hint:'持续孢阵 · 不要驻留中心',color:'#d6a0eb'},
  {kind:'astralRings',name:'星环震荡',hint:'环形冲击 · 寻找内外安全带',color:'#f8d685'},
];
const at=(h,x,y)=>({x:clamp(x,40,920),y:clamp(y,40,500)});
export function insideWarning(mark,position){
  const dx=position.x-mark.x,dy=position.y-mark.y,d=Math.hypot(dx,dy);
  if(mark.shape==='circle')return d<=mark.r;
  if(mark.shape==='ring')return d<=mark.r&&d>=mark.inner;
  if(mark.shape==='lane'){
    const a=mark.angle??0,forward=dx*Math.cos(a)+dy*Math.sin(a);
    const cross=-dx*Math.sin(a)+dy*Math.cos(a);
    return Math.abs(forward)<=mark.length/2&&Math.abs(cross)<=mark.width/2;
  }
  if(mark.shape==='cone'){
    const a=Math.atan2(dy,dx),diff=Math.atan2(Math.sin(a-(mark.angle??0)),Math.cos(a-(mark.angle??0)));
    return d<=mark.r&&Math.abs(diff)<=mark.spread;
  }
  return false;
}
// E2精英战术：不同精英会制造不同几何危险范围，使用现有Canvas警示而非假贴图。
export function createEliteWarning(h,s,elite){
 const role=elite.eliteRole??'charger',hero=h.hero;
 const common={style:'elite'+role,source:'elite',life:1.35,max:1.35,
   damage:maxPartyHp(s)*.024};
 let mark;
 if(role==='charger'){
   const angle=Math.atan2(hero.y-elite.y,hero.x-elite.x);
   mark={...common,shape:'lane',x:(hero.x+elite.x)/2,y:(hero.y+elite.y)/2,angle,length:Math.max(170,Math.hypot(hero.x-elite.x,hero.y-elite.y)+100),width:72};
 }else if(role==='caster'){
   mark={...common,shape:'ring',x:hero.x,y:hero.y,r:160,inner:53};
 }else{
   mark={...common,shape:'circle',x:hero.x,y:hero.y,r:83};
 }
 h.dangerMarkers.push(mark);
 if(h.dangerMarkers.length>18)h.dangerMarkers.splice(0,h.dangerMarkers.length-18);
 return [mark];
}
export function createBossWarnings(h,s,boss,random=()=>.5){
  const region=h.region,style=BOSS_STYLES[region],phase=boss.phase??1,hero=h.hero;
  const damage=maxPartyHp(s)*(region===4?.021:.027)*(phase===2?1.3:1);
  const common={style:style.kind,life:phase===2?1.15:1.45,max:phase===2?1.15:1.45,
    damage,phase,source:'boss'};
  const marks=[];
  const add=(shape,pos,props={})=>marks.push({...common,shape,...at(h,pos.x,pos.y),...props});
  switch(region){
  case 0: // 苔光：根圈锁住小队走位，阶段二追击第二次目标。
    add('circle',hero,{r:76});
    if(phase===2)add('circle',{x:hero.x+115*(random()<.5?-1:1),y:hero.y-65},{r:70});
    break;
  case 1: // 沙谷：水平扫过整个战场，阶段二形成两道有缝的冲锋线。
    add('lane',{x:480,y:hero.y},{length:1050,width:74,angle:0});
    if(phase===2)add('lane',{x:480,y:hero.y+122*(random()<.5?-1:1)},{length:1050,width:60,angle:0});
    break;
  case 2: // 浅湾：纵向潮墙，需要向侧边穿插。
    add('lane',{x:hero.x,y:270},{length:640,width:95,angle:PI/2});
    if(phase===2)add('lane',{x:hero.x+142*(random()<.5?-1:1),y:270},{length:640,width:77,angle:PI/2});
    break;
  case 3: { // 雪原：锥形吐息，躲到背侧。
    const angle=Math.atan2(hero.y-boss.y,hero.x-boss.x);
    add('cone',boss,{r:370,angle,spread:PI/5});
    if(phase===2)add('cone',boss,{r:330,angle:angle+.67,spread:PI/7});
    break;
  }
  case 4: // 菌境：孢雾圆池，可控制玩家必须挪动脚步。
    add('circle',hero,{r:79,status:'spore'});
    if(phase===2)add('circle',{x:hero.x-114,y:hero.y+50},{r:70,status:'spore'});
    break;
  case 5: // 浮岛：中环危险，内圈短暂可作为躲避区。
    add('ring',hero,{r:150,inner:55});
    if(phase===2)add('ring',hero,{r:226,inner:167});
    break;
  }
  h.bossAttacks=(h.bossAttacks??0)+1;
  h.dangerMarkers.push(...marks);
  if(h.dangerMarkers.length>18)h.dangerMarkers.splice(0,h.dangerMarkers.length-18);
  return marks;
}
