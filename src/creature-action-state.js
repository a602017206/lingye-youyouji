// 普通战斗表现为瞬时状态；专属施法的起手与时长从待施法记录恢复，命中事件仍不入档。
import {SPECIES} from './data.js';
export function recordCreatureCast(h,p,index,timing={}){
 h.creatureActions??={};
 h.creatureActions[p.id]={start:h.elapsed,index,species:p.species,...timing};
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
 const windup=action.windup??.13,extra=action.skill?{skill:action.skill}:{};
 if(age<0||age>=windup+.47)return {state:'idle',progress:0};
 if(age+(action.skill?1e-6:0)<windup)return {state:'windup',progress:age/windup,...extra};
 if(age<windup+.18)return {state:'strike',progress:Math.max(0,(age-windup)/.18),...extra};
 return {state:'recover',progress:Math.min(1,(age-windup-.18)/.29),...extra};
}
export function evolutionActionScale(id){
 const stage=SPECIES[id]?.stage??0;
 return [1,1.22,1.48][Math.min(2,stage)];
}
export function visibleCreatureHits(h){
 return (h.creatureHits??[]).filter(v=>h.elapsed>=v.start&&h.elapsed-v.start<.32);
}
