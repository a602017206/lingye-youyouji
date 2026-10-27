// 遗物只影响携带它的本局；触发消耗与时钟进入快照，效果不递归触发自身。
import {healParty} from './horde-support-metrics.js';
import {journeyCollection,validateRunRelic} from './journey-collections.js';
export function initializeRunRelic(h,s,saved){
 h.runRelic=saved?(saved.runRelic??null):journeyCollection(s).selected;
 h.relicState={lastDamageAt:0,healTick:Math.floor((h.elapsed+1e-6)/12),nextProcAt:0,fieldXp:0,ultimateSpent:false};
 if(saved?.relicState&&validateRunRelic(s,saved))h.relicState={...saved.relicState};
}
function changed(h,kind,amount=1){
 h.relicRevision=(h.relicRevision??0)+1;h.relicStats??={};h.relicStats[kind]=(h.relicStats[kind]??0)+amount;
}
export function noteRelicDamage(h,amount){if(h.runRelic==='dewCasket'&&amount>0)h.relicState.lastDamageAt=h.elapsed;}
export const relicWarningLead=h=>h.runRelic==='duskPipe'?.25:0;
export function relicShieldSpent(h,s,before){
 if(h.runRelic!=='tideBottle'||before<=0||h.shieldPool>0||h.elapsed+1e-6<h.relicState.nextProcAt)return;
 const old=s.energy;s.energy=Math.min(100,s.energy+6);h.relicState.nextProcAt=+(h.elapsed+8).toFixed(3);
 changed(h,'energy',s.energy-old);
}
export function relicHitBonus(h,e,damage){
 if(h.runRelic!=='snowBadge'||!(e.slow>0||e.snare>0)||h.elapsed+1e-6<h.relicState.nextProcAt)return 0;
 const extra=Math.min(40,damage*.12,Math.max(0,e.hp-damage));if(extra<=0)return 0;
 h.relicState.nextProcAt=+(h.elapsed+4).toFixed(3);changed(h,'damage',extra);return extra;
}
export function relicFieldKill(h,e){
 if(h.runRelic!=='sporeCasket'||e.deathKind!=='field'||h.relicState.fieldXp>=8)return 0;
 h.relicState.fieldXp++;changed(h,'fieldXp');return 1;
}
export function relicSafetyPulse(h,s,maxHp){
 if(h.runRelic!=='dewCasket')return;
 const tick=Math.floor((h.elapsed+1e-6)/12);if(tick<=h.relicState.healTick)return;
 h.relicState.healTick=tick;
 const before=s.partyHp;
 if(h.elapsed-h.relicState.lastDamageAt>=6)healParty(h,s,maxHp*.02,maxHp);
 changed(h,'healing',s.partyHp-before);
}
export function relicUltimate(h,power){
 if(h.runRelic!=='aetherCore'||h.relicState.ultimateSpent)return;
 h.relicState.ultimateSpent=true;changed(h,'ultimate');
 const target=h.enemies.filter(e=>e.hp>0&&Math.hypot(e.x-h.hero.x,e.y-h.hero.y)<=500)
  .sort((a,b)=>Math.hypot(a.x-h.hero.x,a.y-h.hero.y)-Math.hypot(b.x-h.hero.x,b.y-h.hero.y))[0];
 if(!target)return;
 const angle=Math.atan2(target.y-h.hero.y,target.x-h.hero.x);
 h.projectiles.push({x:h.hero.x,y:h.hero.y,vx:Math.cos(angle)*500,vy:Math.sin(angle)*500,life:1.2,r:6,
  damage:power*.35,pierce:1,bounce:0,hit:[],ownerId:null,source:'aether',relic:true,targetId:target.id});
}
