// E4单机职业成长：每名灵伴只能选择一条路径，材料在真实仓库扣除。
import {SPECIES} from './data.js';
export const CAREERS=Object.freeze({vanguard:{icon:'bolt'},artisan:{icon:'bag'},scout:{icon:'compass'}});
export const careerOf=(s,id)=>({...{type:null,rank:0},...(s.camp?.careers?.[id]??{})});
export const careerMultiplier=(s,id,career)=>{
 const {type,rank}=careerOf(s,id);
 return type===career?1+(career==='vanguard'?.045:career==='artisan'?.07:.085)*rank:1;
};
export function careerCost(s,id,type){
 const p=s.collection.find(p=>p.id===id),chosen=careerOf(s,id);
 if(!p||!Object.hasOwn(CAREERS,type)||chosen.rank>=3||(chosen.type&&chosen.type!==type))return null;
 const rank=chosen.rank+1;
 return {rank,region:SPECIES[p.species].region,coins:rank===1?0:100*(rank-1),materials:rank===1?0:2*(rank-1)};
}
export function trainCareer(s,id,type){
 const cost=careerCost(s,id,type);
 if(!cost||!s.camp||s.coins<cost.coins||s.materials[cost.region]<cost.materials)return false;
 // 正在工作的灵伴不可中途改变生产周期或远征存档的派遣时长。
 if(s.camp.jobs.some(j=>j.workerId===id)||s.camp.expeditions?.jobs.some(j=>j.workerId===id)
   ||s.camp.adventureRoutes?.active?.workerId===id)return false;
 s.coins-=cost.coins;s.materials[cost.region]-=cost.materials;
 s.camp.careers??={};s.camp.careers[id]={type,rank:cost.rank};
 return true;
}
export function validateCareers(s){
 const data=s.camp?.careers;
 if(data===undefined)return true;
 if(!data||typeof data!=='object'||Array.isArray(data))return false;
 return Object.entries(data).every(([id,p])=>s.collection.some(x=>x.id===id)&&p&&typeof p==='object'
  &&!Array.isArray(p)&&Object.keys(p).length===2&&Object.hasOwn(CAREERS,p.type)
  &&Number.isInteger(p.rank)&&p.rank>=1&&p.rank<=3);
}
