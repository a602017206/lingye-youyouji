// 分区分级战力缓冲：只照顾初期低等级队伍，不削弱高等级挑战。
export function earlyGamePressure(state){
 const members=(state.team??[]).map(id=>state.collection.find(p=>p.id===id)).filter(Boolean);
 if(!members.length)return 1;
 const average=members.reduce((sum,p)=>sum+p.level,0)/members.length;
 const gap=Math.max(0,Math.min(1,(15-average)/12));
 return 1-gap*.22;
}
export function enemyVitalityMultiplier(h,state){
 const tier=h.challengeTier==='nightmare'?1.65:h.challengeTier==='hard'?1.28:1;
 return tier*earlyGamePressure(state);
}
