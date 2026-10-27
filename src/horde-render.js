// 群潮Canvas显示层：角色和敌人均由真实PNG贴图绘制，几何图形仅用于技能和提示。
import { teamMembers } from './engine.js';
import { sprite, SPECIES } from './data.js';
import { HORDE_WIDTH, HORDE_HEIGHT } from './horde.js';
import {skillVisual} from './family-skill-vfx.js';
import {creatureMotion} from './creature-animation.js';
import {drawLayeredCreature,resolveLayerAction,animationPolicy} from './creature-layer-animation.js';
import {creatureAttackPose,creatureAttackStyle} from './creature-combat-vfx.js';
import {creatureActionAt,evolutionActionScale,visibleCreatureHits} from './creature-action-state.js';
import {ACTION_SEQUENCES} from './creature-action-sequences.js';
import {retainCreatureAnimations} from './creature-animation-resources.js';

const cache = new Map();
const elementColors={grove:'#9be7a0',ember:'#f2aa77',tide:'#83cfee',frost:'#caeafa',spore:'#c7a0d9',aether:'#edcd87',
  storm:'#f5e47d',metal:'#bed1d4',radiance:'#fae7ba',gale:'#a4e3cc',umbra:'#b5a4e8',stone:'#d8c09d',venom:'#c9b3ec',dream:'#ddc4eb',dust:'#e6c895'};
function picture(id){
  if(!sprite(id))return null;
  if(!cache.has(id)){
    const img=new Image(); const record={img,loaded:false};
    img.onload=()=>{record.loaded=true;};
    img.onerror=()=>{record.loaded=false;};
    img.src=sprite(id);cache.set(id,record);
  }
  const entry=cache.get(id);return entry.loaded?entry.img:null;
}
function actor(ctx,id,x,y,size,ally=false,flash=false,time=0,seed=0,moving=false,reduced=false,attacking=false,action=null,mobile=false,hurtPhase) {
  ctx.save();
  ctx.globalAlpha=ally?1:.92;
  ctx.fillStyle=ally?'rgba(35,98,63,.25)':'rgba(28,50,49,.16)';
  const groundOffset=ally&&ACTION_SEQUENCES[id]?472/512-.65:.24;
  ctx.beginPath();ctx.ellipse(x,y+size*groundOffset,size*.29,size*.105,0,0,Math.PI*2);ctx.fill();
  const img=picture(id);
  const layered=ally&&drawLayeredCreature(ctx,id,{x,y:y-size*.15,size,time,action:resolveLayerAction({action,moving,hurt:flash&&!action?.skill,hurtPhase}),reduced,mobile});
  if(!layered&&img){
    const motion=creatureMotion(id,time,{moving,hurt:flash,reduced,attacking,seed});
    const phase=action?.state==='windup' ? .15*action.progress : action?.state==='strike' ? .15+.55*action.progress : action?.state==='recover' ? .7+.3*action.progress : 0;
    const strike=action&&action.state!=='idle'?creatureAttackPose(id,phase,reduced):creatureAttackPose(id,0,true);
    const stageScale=action&&action.state!=='idle'?evolutionActionScale(id):1;
    ctx.save();ctx.translate(x+motion.x+strike.x*stageScale,y-size*.15+motion.y+strike.y*stageScale);ctx.rotate(motion.rotation+strike.rotation*stageScale);ctx.scale(motion.sx*(1+(strike.sx-1)*stageScale),motion.sy*(1+(strike.sy-1)*stageScale));
    ctx.drawImage(img,-size/2,-size*.5,size,size);
    ctx.restore();
  }
  else if(!layered&&!sprite(id)){ctx.fillStyle='#f3eedc';ctx.textAlign='center';ctx.font='bold 11px sans-serif';ctx.fillText(SPECIES[id]?.name??'未绘制',x,y-size*.1,Math.max(40,size*1.5));}
  if(flash){ctx.strokeStyle='rgba(255,250,208,.88)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y-5,size*.33,0,Math.PI*2);ctx.stroke();}
  ctx.restore();
}
function drawFamilySkill(ctx,p){
 const style=skillVisual(p.action);if(!style)return;
 const progress=Math.max(0,Math.min(1,1-p.life/p.max)),radius=p.radius*(.25+.75*progress);
 ctx.save();ctx.translate(p.x,p.y);ctx.globalAlpha=(1-progress)*.9;ctx.strokeStyle=style.color;ctx.fillStyle=style.color;
 ctx.lineWidth=3.2;ctx.shadowColor=style.color;ctx.shadowBlur=12;
 for(let i=0;i<style.count;i++){
   const a=(i/style.count)*Math.PI*2,inner=radius*.32,outer=radius*(.72+(i%3)*.11);
   ctx.save();ctx.rotate(a);
   ctx.beginPath();
   if(style.shape==='rays'||style.shape==='bolts'){ctx.moveTo(inner,-6);ctx.lineTo(outer*.7,style.shape==='bolts'?10:0);ctx.lineTo(outer,0);ctx.stroke();}
   else if(style.shape==='slashes'){ctx.moveTo(inner,-14);ctx.quadraticCurveTo(outer*.65,18,outer,0);ctx.stroke();}
   else if(style.shape==='shield'){ctx.arc(outer,0,7,0,Math.PI*2);ctx.stroke();}
   else if(style.shape==='bubbles'){ctx.arc(outer,0,5+(i%3)*2,0,Math.PI*2);ctx.stroke();}
   else if(style.shape==='stars'||style.shape==='snow'){ctx.moveTo(outer-8,0);ctx.lineTo(outer+8,0);ctx.moveTo(outer,-8);ctx.lineTo(outer,8);ctx.stroke();}
   else {ctx.ellipse(outer,0,10,4,0,0,Math.PI*2);ctx.fill();}
   ctx.restore();
 }
 ctx.restore();
}
function drawPulse(ctx,p){
 if(p.kind==='familyActive'){
  if(p.action!=='flame'){drawFamilySkill(ctx,p);return;}
  const fade=Math.max(0,p.life/p.max);
  ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);ctx.globalAlpha=fade*.8;
  ctx.strokeStyle=elementColors[p.color]??'#ff884a';ctx.lineWidth=3+fade*5;
  ctx.beginPath();ctx.moveTo(0,-30);ctx.lineTo(p.radius,-30);ctx.lineTo(p.radius,30);ctx.lineTo(0,30);ctx.stroke();
  ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(p.radius,0);ctx.stroke();ctx.restore();return;
 }
 if(p.kind==='familySignature'){drawFamilySkill(ctx,p);return;}
  const progress=1-p.life/p.max;
  ctx.save();ctx.globalAlpha=(1-progress)*.56;ctx.lineWidth=p.kind==='ultimate'?10:5;
  ctx.strokeStyle=p.kind==='ultimate'?'#f7cf70':elementColors[p.color]??(p.kind==='burst'?'#f6a16b':p.kind==='cone'?'#eda977':'#83dbb1');
  ctx.beginPath();
  if(p.kind==='cone'){
    ctx.moveTo(p.x,p.y);ctx.arc(p.x,p.y,p.radius*progress,p.angle-.90,p.angle+.90);ctx.closePath();
  } else ctx.arc(p.x,p.y,Math.max(10,p.radius*progress),0,Math.PI*2);
  ctx.stroke();ctx.restore();
}
function drawWarning(ctx,mark){
  const progress=Math.max(0,Math.min(1,1-mark.life/mark.max));
  const danger=mark.source==='elite'?(mark.style==='elitecaster'?'#c9b5ec':mark.style==='elitewarder'?'#e8d383':'#f5a67d'):mark.style==='groveRoots'?'#d8e383':
    mark.style==='tidalCrest'?'#91dfff':mark.style==='frostFan'?'#d1ecff':
    mark.style==='sporeWells'?'#e5a4f1':mark.style==='astralRings'?'#ffe398':'#fac590';
  ctx.save();
  ctx.strokeStyle=danger;ctx.fillStyle=mark.style==='frostFan'?'rgba(137,210,250,.20)':
    mark.style==='sporeWells'?'rgba(166,92,185,.18)':mark.style==='astralRings'?'rgba(234,184,96,.15)':'rgba(222,88,77,.18)';
  ctx.lineWidth=2.4+progress*2;
  ctx.setLineDash([12,7]);
  ctx.beginPath();
  if(mark.shape==='lane'){
    ctx.translate(mark.x,mark.y);ctx.rotate(mark.angle||0);
    ctx.rect(-mark.length/2,-mark.width/2,mark.length,mark.width);
  }else if(mark.shape==='cone'){
    ctx.moveTo(mark.x,mark.y);
    ctx.arc(mark.x,mark.y,mark.r,mark.angle-mark.spread,mark.angle+mark.spread);
    ctx.closePath();
  }else if(mark.shape==='ring'){
    ctx.arc(mark.x,mark.y,mark.r,0,Math.PI*2);
    ctx.moveTo(mark.x+mark.inner,mark.y);
    ctx.arc(mark.x,mark.y,mark.inner,0,Math.PI*2,true);
  }else{
    ctx.arc(mark.x,mark.y,mark.r,0,Math.PI*2);
  }
  ctx.fill('evenodd');ctx.stroke();ctx.setLineDash([]);
  if(mark.shape==='circle'){
    ctx.beginPath();ctx.lineWidth=2;
    ctx.arc(mark.x,mark.y,mark.r*Math.max(.03,1-progress),0,Math.PI*2);ctx.stroke();
  }
  if(mark.shape==='ring'){
    ctx.beginPath();ctx.lineWidth=4;
    ctx.arc(mark.x,mark.y,mark.inner+(mark.r-mark.inner)*progress,0,Math.PI*2);ctx.stroke();
  }
  ctx.restore();
}
export function renderHordeCanvas(canvas,h,s) {
  if(!canvas)return;
  const mobile=typeof matchMedia!=='undefined'&&matchMedia('(max-width: 600px)').matches;
  const policy=animationPolicy({mobile,dpr:typeof devicePixelRatio!=='undefined'?devicePixelRatio:1});
  const dpr=policy.dpr;
  const box=canvas.getBoundingClientRect();
  if(box.width<1||box.height<1)return;
  const w=Math.round(box.width*dpr),he=Math.round(box.height*dpr);
  if(canvas.width!==w||canvas.height!==he){canvas.width=w;canvas.height=he;}
  const ctx=canvas.getContext('2d');if(!ctx)return;
  ctx.setTransform(w/HORDE_WIDTH,0,0,he/HORDE_HEIGHT,0,0);
  ctx.clearRect(0,0,HORDE_WIDTH,HORDE_HEIGHT);
  const ambient=ctx.createRadialGradient(480,270,30,480,270,410);
  ambient.addColorStop(0,'rgba(255,251,215,.13)');ambient.addColorStop(1,'rgba(13,43,31,.16)');
  ctx.fillStyle=ambient;ctx.fillRect(0,0,HORDE_WIDTH,HORDE_HEIGHT);
  // 危险的敌群按Y值由远到近排序绘制，不把敌人合成一张虚假贴片。
  const reduced=!!s.settings?.reducedMotion||(typeof matchMedia!=='undefined'&&matchMedia('(prefers-reduced-motion: reduce)').matches);
  retainCreatureAnimations(canvas.id==='training-canvas'?'training':'horde',teamMembers(s).slice(0,3).map(p=>p.species),{reduced});
  const enemies=[...h.enemies].sort((a,b)=>a.y-b.y);
  for(const e of enemies){
    const size=e.kind==='boss'?112:e.kind==='elite'?77:e.kind==='tank'?56:e.kind==='runner'?37:45;
    actor(ctx,e.species,e.x,e.y,size,false,e.flash>0,h.elapsed,(e.x*.013+e.y*.019),true,reduced,e.attackTimer>0);
    if(SPECIES[e.species]?.rareVariantOf){
      ctx.strokeStyle='rgba(255,209,112,.94)';ctx.lineWidth=3;
      ctx.beginPath();ctx.arc(e.x,e.y-8,size*.38,0,Math.PI*2);ctx.stroke();
    }
    if(e.kind==='boss'){
      ctx.fillStyle='rgba(20,38,30,.65)';ctx.fillRect(e.x-55,e.y-size*.8,110,9);
      ctx.fillStyle='#dc826a';ctx.fillRect(e.x-55,e.y-size*.8,110*Math.max(0,e.hp/e.maxHp),9);
      ctx.strokeStyle='#f7d1a1';ctx.lineWidth=2;ctx.strokeRect(e.x-55,e.y-size*.8,110,9);
    }else if(e.kind==='elite'){
      ctx.strokeStyle='#f2bd68';ctx.lineWidth=4;ctx.beginPath();ctx.arc(e.x,e.y-10,size*.38,0,Math.PI*2);ctx.stroke();
      ctx.fillStyle='rgba(33,42,32,.7)';ctx.fillRect(e.x-30,e.y-size*.83,60,6);
      ctx.fillStyle='#eeb763';ctx.fillRect(e.x-30,e.y-size*.83,60*Math.max(0,e.hp/e.maxHp),6);
    }else if(e.kind==='tank'){
      ctx.strokeStyle='rgba(173,118,66,.6)';ctx.lineWidth=3;
      ctx.beginPath();ctx.arc(e.x,e.y-7,size*.32,0,Math.PI*2);ctx.stroke();
    }
  }
  for(const p of h.projectiles){
    ctx.save();ctx.translate(p.x,p.y);ctx.rotate(Math.atan2(p.vy,p.vx));ctx.fillStyle=elementColors[p.source]??'#e5fa88';
    ctx.shadowColor=elementColors[p.source]??'#75bf64';ctx.shadowBlur=15;ctx.beginPath();ctx.ellipse(0,0,13,4,0,0,Math.PI*2);ctx.fill();
    ctx.restore();
  }
  for(const device of h.devices??[]){
    ctx.save();ctx.globalAlpha=Math.min(1,device.life/2)*.85;ctx.translate(device.x,device.y);
    const color=device.kind==='shield'?'#91d7f4':device.kind==='trap'?'#eac77e':'#97e5aa';
    ctx.strokeStyle=color;ctx.fillStyle=color;ctx.lineWidth=3;ctx.shadowBlur=9;ctx.shadowColor=color;
    ctx.beginPath();ctx.arc(0,0,18,0,Math.PI*2);ctx.stroke();
    if(device.kind==='shield'){ctx.strokeRect(-9,-9,18,18);}
    else if(device.kind==='trap'){ctx.beginPath();ctx.moveTo(0,-11);ctx.lineTo(11,9);ctx.lineTo(-11,9);ctx.closePath();ctx.stroke();}
    else{ctx.fillRect(-9,-2,18,4);ctx.fillRect(-2,-9,4,18);}
    ctx.restore();
  }
  for(const p of h.pulses)drawPulse(ctx,p);
  // 技能施放时按伙伴主属性加一层轻量短促印记，画面外不创建粒子对象。
  if(!reduced&&h.pulses?.length){
    const members=teamMembers(s);
    for(let i=0;i<Math.min(members.length,3);i++){
      const p=members[i],style=creatureAttackStyle(p.species),pulse=h.pulses.find(v=>v.life>0&&v.max>0);
      if(!pulse)break;
      const power=Math.max(0,Math.min(1,pulse.life/pulse.max));
      const x=h.hero.x+[-34,34,0][i],y=h.hero.y+[18,18,-28][i]-12;
      ctx.save();ctx.translate(x,y);ctx.globalAlpha=power*.65;
      ctx.strokeStyle=elementColors[style.type]??'#b9edca';ctx.lineWidth=2.5;
      ctx.rotate(h.elapsed*(style.shape==='stars'?2:-1)+i);
      const radius=style.range*(1-power*.35);
      ctx.beginPath();
      if(style.shape==='sparks'||style.shape==='stars'||style.shape==='crystal'){
        for(let n=0;n<4;n++){const a=n*Math.PI/2;ctx.moveTo(Math.cos(a)*radius*.58,Math.sin(a)*radius*.58);ctx.lineTo(Math.cos(a)*radius,Math.sin(a)*radius);}
      }else if(style.shape==='slash'||style.shape==='gust'){
        ctx.arc(0,0,radius,-1.2,.55);
      }else{
        ctx.arc(0,0,radius,0,Math.PI*2);
      }
      ctx.stroke();ctx.restore();
    }
  }
  // 命中特效与伤害结算解耦：每个命中事件只保留0.32秒，按真实伤害归属的伙伴属性及进化阶段显示。
  if(!reduced){
    const ownerSpecies=new Map(teamMembers(s).map(p=>[p.id,p.species]));
    for(const impact of visibleCreatureHits(h)){
      const species=ownerSpecies.get(impact.ownerId);
      if(!species)continue;
      const appearance=creatureAttackStyle(species);
      const stage=evolutionActionScale(species);
      const age=h.elapsed-impact.start,progress=Math.max(0,Math.min(1,age/.32));
      const radius=(7+appearance.range*.55*progress)*stage;
      ctx.save();ctx.translate(impact.x,impact.y);ctx.globalAlpha=(1-progress)*.86;
      ctx.strokeStyle=elementColors[appearance.type]??'#e9ffd7';ctx.lineWidth=2.3;
      ctx.beginPath();
      if(appearance.shape==='sparks'||appearance.shape==='stars'||appearance.shape==='crystal'){
        const rays=appearance.shape==='stars'?6:4;
        for(let n=0;n<rays;n++){const angle=n*Math.PI*2/rays+h.elapsed;ctx.moveTo(Math.cos(angle)*radius*.5,Math.sin(angle)*radius*.5);ctx.lineTo(Math.cos(angle)*radius,Math.sin(angle)*radius);}
      }else if(appearance.shape==='slash'||appearance.shape==='gust'){
        ctx.rotate(-.45);ctx.arc(0,0,radius,-1.45,.85);
      }else{
        ctx.arc(0,0,radius,0,Math.PI*2);
        if(stage>1.3){ctx.moveTo(radius*.48,0);ctx.arc(0,0,radius*.48,0,Math.PI*2);}
      }
      ctx.stroke();ctx.restore();
    }
  }
  for(const item of h.combatTexts??[]){const fraction=Math.max(0,item.life/item.max);ctx.save();ctx.globalAlpha=fraction;ctx.textAlign='center';ctx.font=item.kind==='skill'?'bold 18px sans-serif':'bold 14px sans-serif';ctx.lineWidth=3;ctx.strokeStyle='rgba(20,30,40,.78)';ctx.fillStyle=item.kind==='skill'?'#ffe49b':'#ffffff';const y=item.y-(1-fraction)*25;ctx.strokeText(item.label,item.x,y);ctx.fillText(item.label,item.x,y);ctx.restore();}
  for(const marker of h.dangerMarkers??[])drawWarning(ctx,marker);
  const team=teamMembers(s);
  const poses=[[-34,18],[34,18],[0,-28]];
  team.slice(0,policy.maxActors).forEach((p,i)=>{
    // 真正的步态及受伤/施法姿态使用固定地面，避免又被编队层的正弦起伏抬离地面。
    const grounded=!!ACTION_SEQUENCES[p.species];
    const x=h.hero.x+poses[i][0],y=h.hero.y+poses[i][1]+(reduced||grounded?0:Math.sin(h.elapsed*4+i)*3);
    ctx.save();ctx.shadowColor='#e9ffb5';ctx.shadowBlur=22;
    ctx.strokeStyle=i===0?'#c6f3b0':i===1?'#ffe5ac':'#bdddfb';ctx.lineWidth=4;
    ctx.beginPath();ctx.ellipse(x,y+14,25,10,0,0,Math.PI*2);ctx.stroke();ctx.restore();
    // 1表示模拟本帧实际位移；小于1的衰减段只保留战斗动量，停步后不继续踏步。
    actor(ctx,p.species,x,y,71,true,h.impact>0,h.elapsed,i,h.motionTime===1,reduced,false,creatureActionAt(h,p.id),mobile,1-(h.impact??0)/.25);
  });
  ctx.save();
  ctx.strokeStyle=h.impact>0?'rgba(255,130,110,.86)':'rgba(240,248,205,.42)';
  ctx.lineWidth=h.impact>0?5:2;
  ctx.beginPath();ctx.arc(h.hero.x,h.hero.y,54,0,Math.PI*2);ctx.stroke();ctx.restore();
  if(!s.running||h.finished||h.pending.length){
    ctx.fillStyle='rgba(18,38,30,.35)';ctx.fillRect(0,0,HORDE_WIDTH,HORDE_HEIGHT);
  }
}
