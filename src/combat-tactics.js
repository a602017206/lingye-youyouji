// E2永久战技与群潮元素共鸣，增益使用有限等级，不引入额外付费或独立假贴图。
import {healParty,grantShield} from './horde-support-metrics.js';
import {SPECIES} from './data.js';
export const COMBAT_ROLES=Object.freeze({
  assault:{icon:'bolt',maxRank:3},control:{icon:'compass',maxRank:3},guardian:{icon:'shield',maxRank:3},
});
export function combatRole(s,id){
 const record=s.camp?.combatRoles?.[id];
 return record?{role:record.role,rank:record.rank}:{role:null,rank:0};
}
export function combatRoleCost(s,id,role){
 if(!s.collection.some(p=>p.id===id)||!COMBAT_ROLES[role])return null;
 const current=combatRole(s,id);
 if(current.role&&current.role!==role||current.rank>=3)return null;
 const rank=current.rank+1;
 return rank===1?{rank,coins:0,materials:0,region:SPECIES[s.collection.find(p=>p.id===id).species].region}
   :{rank,coins:100*(rank-1),materials:2*(rank-1),region:SPECIES[s.collection.find(p=>p.id===id).species].region};
}
export function chooseCombatRole(s,id,role){
 const cost=combatRoleCost(s,id,role);
 if(!cost||s.coins<cost.coins||s.materials[cost.region]<cost.materials)return false;
 s.coins-=cost.coins;s.materials[cost.region]-=cost.materials;
 s.camp.combatRoles??={};
 s.camp.combatRoles[id]={role,rank:cost.rank};
 return true;
}
export function validateCombatRoles(s){
 const roles=s.camp?.combatRoles;
 if(roles===undefined)return true;
 if(!roles||typeof roles!=='object'||Array.isArray(roles))return false;
 return Object.entries(roles).every(([id,v])=>s.collection.some(p=>p.id===id)
  &&v&&typeof v==='object'&&!Array.isArray(v)
  &&Object.keys(v).length===2&&Object.hasOwn(COMBAT_ROLES,v.role)
  &&Number.isInteger(v.rank)&&v.rank>=1&&v.rank<=3);
}
export const roleAttackMultiplier=(s,id)=>1+(combatRole(s,id).role==='assault'?.08*combatRole(s,id).rank:0);
export const RESONANCES=Object.freeze({
  renewal:['grove','tide'],
  blizzard:['frost','gale'],
  forge:['ember','metal'],
  thunder:['storm','aether'],
});
export function resonanceKey(s){
 const teamTypes=s.team.map(id=>{
  const p=s.collection.find(partner=>partner.id===id),spec=p&&SPECIES[p.species];
  return spec?[spec.type,...(spec.secondaryType?[spec.secondaryType]:[])]:[];
 });
 // 必须有两名不同伙伴形成共鸣，单只双属性灵伴不能独自凑齐两个槽位。
 for(const [key,[first,second]]of Object.entries(RESONANCES)){
  if(teamTypes.some((types,i)=>types.includes(first)&&teamTypes.some((other,j)=>j!==i&&other.includes(second))))return key;
 }
 return null;
}
// 每9秒发动一次，战场暂停或升级选择时不计时；仅按固定整数计时避免反复刷新刷收益。
export function applyResonance(h,s,maxHp=0){
 const key=resonanceKey(s);
 if(!key)return null;
 if(key==='renewal'){
  // 固定上限和固定治疗，不依赖随机抽奖或页面刷新。
  if(maxHp>0){healParty(h,s,maxHp*.035,maxHp);
    grantShield(h,maxHp*.015,maxHp*.16);}
 }else if(key==='blizzard'){
  for(const e of h.enemies)if(e.hp>0&&Math.hypot(e.x-h.hero.x,e.y-h.hero.y)<230)e.slow=Math.max(e.slow,3.4);
 }else if(key==='forge'){
  for(const e of h.enemies)if(e.hp>0&&Math.hypot(e.x-h.hero.x,e.y-h.hero.y)<190){
   const dealt=Math.min(e.hp,22+8*s.team.length);e.hp-=dealt;h.combatDamage+=dealt;e.flash=.25;
  }
 }else if(key==='thunder'){
  s.energy=Math.min(100,s.energy+12);
  for(const e of h.enemies)if(e.hp>0&&Math.hypot(e.x-h.hero.x,e.y-h.hero.y)<220)e.slow=Math.max(e.slow,1.2);
 }
 h.pulses.push({x:h.hero.x,y:h.hero.y,radius:key==='renewal'?145:230,life:.55,max:.55,kind:'resonance',color:key==='blizzard'?'frost':key==='forge'?'ember':key==='thunder'?'storm':'grove'});
 h.resonanceTriggers=(h.resonanceTriggers??0)+1;
 return key;
}
