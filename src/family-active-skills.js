// 三家族专属主动技：复用现有天赋、专精、命中和支援统计，不额外增加技能槽。
import {SPECIES} from './data.js';
import {familyTalent} from './family-talents.js';
import {combatRole} from './combat-tactics.js';
import {recordCreatureCast} from './creature-action-state.js';
import {creditSupport} from './horde-support-metrics.js';

export const FAMILY_ACTIVE_SKILLS=Object.freeze({
 flameRush:Object.freeze({family:12,seconds:12,windup:.48,icon:'bolt',action:'flame',radius:320}),
 frostSnare:Object.freeze({family:14,seconds:15,windup:.54,icon:'compass',action:'freeze',radius:230}),
 radiantAegis:Object.freeze({family:17,seconds:18,windup:.60,icon:'shield',action:'sunHeal',radius:145}),
});
export function familySkillProfile(s,p,key){
 const meta=Object.hasOwn(FAMILY_ACTIVE_SKILLS,key)?FAMILY_ACTIVE_SKILLS[key]:null,talent=familyTalent(p?.species);
 if(!meta||talent?.family!==meta.family)return null;
 const strength=1+talent.amount,specialty=combatRole(s,p.id);
 return {...meta,strength,damage:(key==='flameRush'?2.2:.55)*strength,
  duration:Math.min(3.6,2.6*strength+(specialty.role==='control'?.2*specialty.rank:0)),
  healing:.045*strength,shield:.065*strength+(specialty.role==='guardian'?.003*specialty.rank:0)};
}
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function beginFamilyActive(h,s,p,key,support,maxHp){
 const profile=familySkillProfile(s,p,key);if(!profile)return false;
 const target=h.enemies.filter(e=>e.hp>0&&distance(e,h.hero)<=profile.radius+(e.r??0))
  .sort((a,b)=>distance(a,h.hero)-distance(b,h.hero))[0];
 if(key==='radiantAegis'){
  if(s.partyHp>=maxHp&&h.shieldPool>=maxHp*.16-.001)return false;
 }else if(!target)return false;
 h.familyCasts??=[];
 h.familyCasts=h.familyCasts.filter(c=>s.team.includes(c.ownerId));
 if(h.familyCasts.length>=3||h.familyCasts.some(c=>c.ownerId===p.id))return false;
 const start=+h.elapsed.toFixed(3);
 h.familyCasts.push({ownerId:p.id,species:p.species,skill:key,support,start,
  releaseAt:+(start+profile.windup).toFixed(3),origin:{...h.hero},aim:target?{x:target.x,y:target.y}:{...h.hero}});
 h.activeCooldowns[p.id]=+(start+profile.seconds).toFixed(3);h.activeCasts=(h.activeCasts??0)+1;
 h.familyCastRevision=(h.familyCastRevision??0)+1;
 recordCreatureCast(h,p,s.team.indexOf(p.id),{start,windup:profile.windup,skill:key});
 return true;
}

export function restoreFamilyCasts(h,s,records){
 h.familyCasts=validateFamilyCasts(s,{...h,familyCasts:records})?(records??[]).map(c=>({...c,origin:{...c.origin},aim:{...c.aim}})):[];
 for(const c of h.familyCasts){
  const p=s.collection.find(p=>p.id===c.ownerId);if(!s.team.includes(c.ownerId)||p.species!==c.species)continue;
  recordCreatureCast(h,p,s.team.indexOf(p.id),{windup:FAMILY_ACTIVE_SKILLS[c.skill].windup,skill:c.skill});
  h.creatureActions[p.id].start=c.start;
 }
}

export function resolveFamilyActives(h,s,hit,attackOf,maxHp){
 const ready=[],before=(h.familyCasts??[]).length;
 h.familyCasts=(h.familyCasts??[]).filter(c=>{
  const p=s.collection.find(p=>p.id===c.ownerId);
  if(!p||!s.team.includes(c.ownerId)||p.species!==c.species)return false;
  if(h.elapsed+1e-6<c.releaseAt)return true;
  ready.push(c);return false;
 });
 if(before!==h.familyCasts.length)h.familyCastRevision=(h.familyCastRevision??0)+1;
 // 先移除待执行项，再结算效果，避免刷新或重复调用再次释放同一招式。
 for(const c of ready){
  const p=s.collection.find(p=>p.id===c.ownerId),profile=familySkillProfile(s,p,c.skill);
  if(!profile)continue;
  let targets=[],healing=0,shield=0;
  const foes=h.enemies.filter(e=>e.hp>0),attack=attackOf(p)*(c.support==='focus'?1.25:1);
  if(c.skill==='flameRush'){
   const dx=c.aim.x-c.origin.x,dy=c.aim.y-c.origin.y,length=Math.hypot(dx,dy),ux=length>1e-6?dx/length:1,uy=length>1e-6?dy/length:0;
   targets=foes.filter(e=>{
    const x=e.x-c.origin.x,y=e.y-c.origin.y,along=x*ux+y*uy;
    return along>=-(e.r??0)&&along<=profile.radius+(e.r??0)&&Math.abs(x*uy-y*ux)<=30+(e.r??0);
   }).sort((a,b)=>distance(a,c.origin)-distance(b,c.origin)).slice(0,5);
  }else targets=foes.filter(e=>distance(e,c.origin)<=profile.radius+(e.r??0));
  if(c.skill!=='radiantAegis')for(const e of targets)hit(c.ownerId,e,attack*profile.damage);
  if(c.skill==='frostSnare')for(const e of targets){
   if(e.hp<=0)continue;
   const before=e.snare??0;e.snare=Math.max(before,profile.duration);
   if(e.snare>before)creditSupport(h,p.id,'control',1);
  }
  if(c.skill==='radiantAegis'){
   const oldHp=s.partyHp,oldShield=h.shieldPool;
   s.partyHp=Math.min(maxHp,s.partyHp+maxHp*profile.healing);
   h.shieldPool=Math.min(maxHp*.16,h.shieldPool+maxHp*profile.shield);
   healing=s.partyHp-oldHp;shield=h.shieldPool-oldShield;
   creditSupport(h,p.id,'healing',healing);creditSupport(h,p.id,'shield',shield);
  }
  if(c.support==='frost')for(const e of targets){
   if(e.hp<=0)continue;
   if(e.slow<2.25)creditSupport(h,p.id,'control',1);e.slow=Math.max(e.slow,2.25);
  }
  const success=c.skill==='radiantAegis'?healing>0||shield>0:targets.length>0;
  if(success&&c.support==='spark')s.energy=Math.min(100,s.energy+8);
  if(success)h.pulses.push({x:c.origin.x,y:c.origin.y,radius:profile.radius,angle:Math.atan2(c.aim.y-c.origin.y,c.aim.x-c.origin.x),
   life:.58,max:.58,kind:'familyActive',action:profile.action,color:SPECIES[p.species].type,ownerId:p.id});
  h.familySkillEvents??=[];
  h.familySkillEvents.push({ownerId:p.id,skill:c.skill,start:c.start,at:h.elapsed,targets:targets.length,healing,shield,success});
  if(h.familySkillEvents.length>24)h.familySkillEvents.splice(0,h.familySkillEvents.length-24);
 }
}

export function validateFamilyCasts(s,h){
 if(!h||typeof h!=='object')return false;
 const records=h.familyCasts;if(records===undefined)return true;
 if(!Array.isArray(records)||records.length>3)return false;
 const owners=new Set(),point=value=>value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).length===2
  &&Number.isFinite(value.x)&&value.x>=-80&&value.x<=1040&&Number.isFinite(value.y)&&value.y>=-80&&value.y<=620;
 return records.every(c=>{
  if(!c||typeof c!=='object'||Array.isArray(c)||Object.keys(c).length!==8)return false;
  const p=s.collection.find(p=>p.id===c.ownerId),meta=FAMILY_ACTIVE_SKILLS[c.skill],cooldown=h.activeCooldowns?.[c.ownerId];
  if(!p||!meta||!Number.isInteger(c.species)||owners.has(c.ownerId)||SPECIES[c.species]?.family!==meta.family||SPECIES[p.species]?.family!==meta.family)return false;
  owners.add(c.ownerId);
  return (c.support===null||['focus','frost','spark'].includes(c.support))&&point(c.origin)&&point(c.aim)
   &&Number.isFinite(c.start)&&c.start>=0&&c.start<=h.elapsed+.001&&Number.isFinite(c.releaseAt)
   &&Math.abs(c.releaseAt-c.start-meta.windup)<.002&&h.elapsed<=c.releaseAt+.001
   &&Number.isFinite(cooldown)&&Math.abs(cooldown-c.start-meta.seconds)<.002;
 });
}
