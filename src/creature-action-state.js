// 战斗表现瞬时状态：每名伙伴独立施法，命中事件有严格数量与时间上限，不参与存档。
import {SPECIES} from './data.js';
export function recordCreatureCast(h,p,index){
 h.creatureActions??={};
 h.creatureActions[p.id]={start:h.elapsed,index,species:p.species};
}
export function recordCreatureHit(h,e,ownerId){
 if(!ownerId)return;
 h.creatureHits??=[];
 h.creatureHits.push({x:e.x,y:e.y,start:h.elapsed,ownerId});
 if(h.creatureHits.length>32)h.creatureHits.splice(0,h.creatureHits.length-32);
}
export function creatureActionAt(h,id){
 const action=h.creatureActions?.[id];if(!action)return {state:'idle',progress:0};
 const age=h.elapsed-action.start;
 if(age<0||age>=.6)return {state:'idle',progress:0};
 if(age<.13)return {state:'windup',progress:age/.13};
 if(age<.31)return {state:'strike',progress:(age-.13)/.18};
 return {state:'recover',progress:Math.min(1,(age-.31)/.29)};
}
export function evolutionActionScale(id){
 const stage=SPECIES[id]?.stage??0;
 return [1,1.22,1.48][Math.min(2,stage)];
}
export function visibleCreatureHits(h){
 return (h.creatureHits??[]).filter(v=>h.elapsed>=v.start&&h.elapsed-v.start<.32);
}
