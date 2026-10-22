// E2-B 两槽战术构筑：一项主动技能和一枚辅助铭文，旧v3存档可缺省。
import {SPECIES} from './data.js';
export const ACTIVE_SKILLS=Object.freeze({
 strike:{seconds:9,icon:'bolt'},
 ring:{seconds:13,icon:'spark'},
 ward:{seconds:17,icon:'shield'},
});
export const SUPPORT_GLYPHS=Object.freeze({
 focus:{icon:'bolt'},
 frost:{icon:'compass'},
 spark:{icon:'spark'},
});
export const EMPTY_LOADOUT=Object.freeze({active:null,support:null});
export const skillLoadout=(s,id)=>({...EMPTY_LOADOUT,...s.camp?.skillLoadouts?.[id]});
export function setSkillSlot(s,id,slot,skill){
 if(!s.camp||!s.collection.some(p=>p.id===id)||!['active','support'].includes(slot))return false;
 const choices=slot==='active'?ACTIVE_SKILLS:SUPPORT_GLYPHS;
 if(skill!==null&&!Object.hasOwn(choices,skill))return false;
 s.camp.skillLoadouts??={};
 const next={...skillLoadout(s,id),[slot]:skill};
 if(next.active===null&&next.support===null)delete s.camp.skillLoadouts[id];
 else s.camp.skillLoadouts[id]=next;
 return true;
}
export function validateSkillLoadouts(s){
 const c=s.camp;
 if(c?.skillLoadouts!==undefined){
  if(!c.skillLoadouts||Array.isArray(c.skillLoadouts)||typeof c.skillLoadouts!=='object'
    ||Object.keys(c.skillLoadouts).length>120)return false;
  for(const [id,item] of Object.entries(c.skillLoadouts)){
   if(!s.collection.some(p=>p.id===id)||!item||typeof item!=='object'||Array.isArray(item)
    ||Object.keys(item).some(k=>!['active','support'].includes(k))
    ||Object.keys(item).length!==2
    ||item.active!==null&&!Object.hasOwn(ACTIVE_SKILLS,item.active)
    ||item.support!==null&&!Object.hasOwn(SUPPORT_GLYPHS,item.support))return false;
  }
 }
 return c?.autoActiveSkills===undefined||typeof c.autoActiveSkills==='boolean';
}
// 所有装备主动技能共享同一伙伴的冷却时间，换配方与符文不能跳过冷却。
// 施法由horde调用真实命中接口；该模块不复制战斗结算引擎。
export function performActiveSkill(h,s,partner,hit,attack,maxHp){
 const {active,support}=skillLoadout(s,partner.id),meta=ACTIVE_SKILLS[active];
 if(!meta||h.finished||!s.running||h.pending.length||h.region!==s.region)return false;
 if(h.elapsed+0.0001<(h.activeCooldowns[partner.id]??0))return false;
 const px=h.hero.x,py=h.hero.y,near=e=>Math.hypot(e.x-px,e.y-py),target=h.enemies
  .filter(e=>e.hp>0&&near(e)<340+e.r).sort((a,b)=>near(a)-near(b))[0];
 const multiplier=support==='focus'?1.25:1;
 let targets=[];
 if(active==='strike'){
  if(!target)return false;
  targets=h.enemies.filter(e=>e.hp>0&&Math.hypot(e.x-target.x,e.y-target.y)<=88+e.r);
  for(const e of targets)hit(e,attack*multiplier*(e===target?1.75:.44),e.x-px,e.y-py,e===target?18:0);
 }else if(active==='ring'){
  targets=h.enemies.filter(e=>e.hp>0&&near(e)<=188+e.r);
  if(!targets.length)return false;
  for(const e of targets){hit(e,attack*multiplier*.8,e.x-px,e.y-py,12);
   e.slow=Math.max(e.slow,1.35);
  }
 }else{
  if(s.partyHp>=maxHp&&h.shieldPool>=maxHp*.16-0.01)return false;
  s.partyHp=Math.min(maxHp,s.partyHp+maxHp*.025);
  h.shieldPool=Math.min(maxHp*.16,h.shieldPool+maxHp*.046);
  targets=h.enemies.filter(e=>e.hp>0&&near(e)<125+e.r);
  for(const e of targets)e.slow=Math.max(e.slow,.8);
 }
 if(support==='frost')for(const e of targets)e.slow=Math.max(e.slow,2.25);
 if(support==='spark')s.energy=Math.min(100,s.energy+8);
 const type=SPECIES[partner.species]?.secondaryType??SPECIES[partner.species]?.type??'grove';
 h.pulses.push({x:active==='strike'?target.x:px,y:active==='strike'?target.y:py,
  radius:active==='strike'?90:active==='ring'?188:145,life:.58,max:.58,kind:'active',color:type});
 h.activeCooldowns[partner.id]=+(h.elapsed+meta.seconds).toFixed(3);
 h.activeCasts=(h.activeCasts??0)+1;
 return true;
}
