// C4材料研习：仅允许有限的三个等级，不覆盖原伙伴等级和元素类型。
const TRACKS={
 attack:{materials:{plank:2,ingot:1},coins:60},
 health:{materials:{herbPowder:2,dew:2},coins:55},
 element:{materials:{herbPowder:2,plank:1,stardust:1},coins:70},
};
export const TRAINING_TRACKS=TRACKS;
export function trainingRanks(s,id){
 const ranks=s.camp?.training?.[id];
 return {attack:ranks?.attack??0,health:ranks?.health??0,element:ranks?.element??0};
}
export function trainingMultiplier(s,id,kind){
 const k=kind==='hp'?'health':kind;
 const rank=trainingRanks(s,id)[k]??0;
 return 1+(k==='element'?.01:.012)*rank;
}
export function trainCompanion(s,id,kind){
 const recipe=TRACKS[kind],c=s.camp;
 if(!recipe||!c||!s.collection.some(p=>p.id===id))return false;
 c.training??={};
 const old=trainingRanks(s,id),level=old[kind];
 if(level>=3)return false;
 const cost=Object.fromEntries(Object.entries(recipe.materials).map(([k,n])=>[k,n*(level+1)]));
 if(s.coins<recipe.coins*(level+1)||Object.entries(cost).some(([k,n])=>(c.resources[k]??0)<n))return false;
 for(const [key,n] of Object.entries(cost))c.resources[key]-=n;
 s.coins-=recipe.coins*(level+1);
 c.training[id]={...old,[kind]:level+1};
 return true;
}
export function validateTraining(s){
 const record=s.camp?.training;
 if(record===undefined)return true;
 if(!record||typeof record!=='object'||Array.isArray(record))return false;
 return Object.entries(record).every(([id,r])=>s.collection.some(p=>p.id===id)&&r&&typeof r==='object'
  &&Object.keys(r).every(k=>Object.hasOwn(TRACKS,k))&&Object.values(TRACKS).every((_,i)=>{
    const value=r[Object.keys(TRACKS)[i]];
    return value===undefined||(Number.isInteger(value)&&value>=0&&value<=3);
  }));
}
