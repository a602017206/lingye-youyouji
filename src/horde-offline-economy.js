// 群潮离线收益：以队伍实力估算清怪波次，不模拟首领奖励。
import {SPECIES,REGIONS} from './data.js';
export function hordeOfflineRates(s){
 const allies=(s.team??[]).map(id=>s.collection.find(p=>p.id===id)).filter(Boolean);
 if(!allies.length||!REGIONS[s.region])return {coins:0,xp:0,materials:0,blocked:true};
 const attack=allies.reduce((sum,p)=>sum+(SPECIES[p.species]?.attack??0)+p.level*2.4,0);
 const recommended=REGIONS[s.region].level||1;
 const level=allies.reduce((sum,p)=>sum+p.level,0)/allies.length;
 const readiness=Math.max(0,Math.min(1,level/Math.max(1,recommended)));
 const pace=Math.min(1.5,Math.max(0,attack/Math.max(35,recommended*6)));
 // 当前区域战力过低则阻断离线掉落。
 if(readiness<.48||pace<.48)return {coins:0,xp:0,materials:0,blocked:true};
 const waveRate=Math.min(1/42,(readiness*pace)/65);
 return {coins:waveRate*(24+s.region*7)*.5,xp:waveRate*(4+s.region),materials:waveRate*(.45+s.region*.12),blocked:waveRate===0};
}
