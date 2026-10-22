// 十个生产家族对应可预期的装置专精。与队伍出场顺序无关。
import {SPECIES} from './data.js';
export const DEVICE_SPECIALTIES=Object.freeze({
 22:{kind:'shield',power:1.10,label:'林木护幕'},23:{kind:'trap',power:1.20,label:'地脉陷阱'},
 24:{kind:'supply',power:1.10,label:'菌灵补给'},25:{kind:'shield',power:1.25,label:'净泉护罩'},
 26:{kind:'trap',power:1.12,label:'沙砾伏击'},27:{kind:'trap',power:1.28,label:'机铜机关'},
 28:{kind:'supply',power:1.17,label:'岚叶供能'},29:{kind:'supply',power:1.20,label:'药雾补给'},
 30:{kind:'shield',power:1.32,label:'熔铸屏障'},31:{kind:'supply',power:1.30,label:'星轨供能'}
});
export function deviceRoster(s){
 const selected=new Map();
 for(const id of s.team??[]){
  const p=s.collection.find(member=>member.id===id),spec=p&&SPECIES[p.species];
  if(!spec||!DEVICE_SPECIALTIES[spec.family])continue;
  const previous=selected.get(spec.family);
  if(!previous||spec.stage>previous.stage)selected.set(spec.family,{family:spec.family,stage:spec.stage,...DEVICE_SPECIALTIES[spec.family]});
 }
 return [...selected.values()].sort((a,b)=>a.family-b.family);
}
