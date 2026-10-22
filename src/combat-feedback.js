// 仅保存本局短暂战斗反馈，不进入存档；避免密集怪群产生无限文本对象。
const LIMIT=36;
export function pushCombatText(h,{x,y,value,label,kind='damage'}){
 if(!Number.isFinite(x)||!Number.isFinite(y))return false;
 if(kind==='damage'&&(!Number.isFinite(value)||value<=0))return false;
 if(kind==='skill'&&(!label||h.combatTexts?.some(t=>t.kind==='skill'&&t.label===label&&t.life>.5)))return false;
 const text=kind==='damage'?String(Math.round(value)):String(label).slice(0,14);
 const list=h.combatTexts??(h.combatTexts=[]);
 list.push({x,y,kind,label:text,life:kind==='skill'?.85:.54,max:kind==='skill'?.85:.54});
 if(list.length>LIMIT)list.splice(0,list.length-LIMIT);
 return true;
}
export function advanceCombatText(h,dt){
 if(!h.combatTexts?.length)return;
 for(const item of h.combatTexts)item.life-=dt;
 h.combatTexts=h.combatTexts.filter(item=>item.life>0);
}
