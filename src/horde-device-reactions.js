// 装置与队伍元素协同；只在部署瞬间结算，伤害和能量有硬上限。
import {SPECIES} from './data.js';
export function deviceReaction(h,s,device){
 const types=new Set((s.team??[]).map(id=>s.collection.find(p=>p.id===id)).filter(Boolean).flatMap(p=>[SPECIES[p.species]?.type,SPECIES[p.species]?.secondaryType].filter(Boolean)));
 if(device.kind==='trap'&&types.has('storm')){
  let hits=0;
  for(const e of h.enemies??[]){if(e.hp<=0||Math.hypot(e.x-device.x,e.y-device.y)>160)continue;
   const damage=Math.min(e.hp,12);e.hp-=damage;h.combatDamage=(h.combatDamage??0)+damage;hits++;
  }
  return {kind:'stormNet',hits};
 }
 if(device.kind==='shield'&&types.has('radiance')){
  const cap=h.deviceMaxHp??0,healed=Math.min(Math.max(0,cap-s.partyHp),cap*.012);
  if(healed>0)s.partyHp+=healed;
  return {kind:'healingWard',healed};
 }
 if(device.kind==='supply'&&types.has('ember')){
  s.energy=Math.min(100,s.energy+3);return {kind:'emberCharge'};
 }
 return null;
}
