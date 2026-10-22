// E1生态探索委托。每个任务独立计时，一次委托最多领取一次，离线不会无限派遣。
import {REGIONS,SPECIES} from './data.js';
import {careerMultiplier} from './partner-careers.js';
import {expeditionTalentReward} from './family-talents.js';
export const EXPEDITION_TYPES=Object.freeze({
  patrol:{seconds:420,resources:3,coins:35,material:0},
  delve:{seconds:1080,resources:7,coins:90,material:1},
});
export const EXPEDITION_RESOURCES=['wood','ore','shell','ice','spore','stardust'];
const LIMIT=8e15,CAP=5000;
const int=(n,min,max)=>Number.isInteger(n)&&n>=min&&n<=max;
export const expeditionSlots=level=>level>=5?3:level>=3?2:1;
export const ensureExpeditions=c=>(c.expeditions??={jobs:[],seq:0,finds:[]});
export const eligibleExpeditionPartners=s=>s.collection.filter(p=>!s.team.includes(p.id)
  &&!s.camp.jobs.some(j=>j.workerId===p.id)
  &&!ensureExpeditions(s.camp).jobs.some(j=>j.workerId===p.id)
  &&s.camp.adventureRoutes?.active?.workerId!==p.id);
function matchElement(p,region){
 const spec=SPECIES[p.species],element=REGIONS[region]?.element;
 return spec?.type===element||spec?.secondaryType===element;
}
function duration(kind,match,career=1){return Math.round(EXPEDITION_TYPES[kind].seconds*1000*(match?.8:1)/career);}
export function validateExpeditions(s){
 const c=s.camp,e=c?.expeditions;
 if(e===undefined)return true; // 原有v3存档字段可选，首次进入补齐。
 if(!e||!Array.isArray(e.jobs)||e.jobs.length>expeditionSlots(c.level)
   ||!int(e.seq,0,10000000)||!Array.isArray(e.finds)||e.finds.length>REGIONS.length
   ||new Set(e.finds).size!==e.finds.length
   ||e.finds.some(r=>!int(r,0,s.unlockedRegion)))return false;
 if(new Set(e.jobs.map(j=>j?.workerId)).size!==e.jobs.length)return false;
 for(const j of e.jobs){
  if(!j||typeof j.workerId!=='string'||!s.collection.some(p=>p.id===j.workerId)
   ||s.team.includes(j.workerId)||c.jobs.some(x=>x.workerId===j.workerId)
   ||!int(j.region,0,s.unlockedRegion)||!EXPEDITION_TYPES[j.kind]
   ||!int(j.seq,1,e.seq)||typeof j.match!=='boolean'||typeof j.risk!=='boolean'
   ||j.risk!==(j.kind==='delve'&&j.seq%4===0)
   ||!Number.isSafeInteger(j.startedAt)||j.startedAt<0||j.startedAt>LIMIT
   ||!Number.isSafeInteger(j.endsAt)||j.endsAt<j.startedAt
   ||j.endsAt-j.startedAt!==duration(j.kind,j.match,careerMultiplier(s,j.workerId,'scout')))return false;
 }
 return true;
}
export function startExpedition(s,workerId,region,kind,now=Date.now()){
 const c=s.camp,e=ensureExpeditions(c),spec=EXPEDITION_TYPES[kind];
 if(!Number.isSafeInteger(now)||now<0||now>LIMIT||!spec
  ||!int(region,0,s.unlockedRegion)||e.seq>=10000000
  ||e.jobs.length>=expeditionSlots(c.level))return false;
 const p=eligibleExpeditionPartners(s).find(x=>x.id===workerId);
 if(!p)return false;
 const match=matchElement(p,region),seq=e.seq+1,endsAt=now+duration(kind,match,careerMultiplier(s,workerId,'scout'));
 if(endsAt>LIMIT)return false;
 e.seq=seq;
 e.jobs.push({workerId,region,kind,seq,startedAt:now,endsAt,match,risk:kind==='delve'&&seq%4===0});
 return true;
}
export function claimExpedition(s,workerId,now=Date.now()){
 const c=s.camp,e=ensureExpeditions(c),job=e.jobs.find(j=>j.workerId===workerId);
 if(!job||!Number.isFinite(now)||now<job.endsAt)return false;
 const type=EXPEDITION_TYPES[job.kind];
 const base=job.risk?Math.ceil(type.resources*.6):type.resources;
 const partner=s.collection.find(p=>p.id===workerId);
 const talent=expeditionTalentReward(partner?.species,job.kind,job.region);
 const amount=base+(job.match?2:0)+talent.resources,item=EXPEDITION_RESOURCES[job.region];
 if(c.resources[item]+amount>CAP)return false; // 满仓待领取，不丢失已经完成的任务。
 const discovered=!e.finds.includes(job.region);
 const coins=type.coins+job.region*15+(discovered?60:0)+talent.coins;
 c.resources[item]+=amount;
 s.coins=Math.min(1e12,s.coins+coins);
 if(type.material+talent.material)s.materials[job.region]=Math.min(1e12,s.materials[job.region]+type.material+talent.material);
 if(discovered)e.finds.push(job.region);
 c.professionXp[workerId+'|expedition']=Math.min(1e8,(c.professionXp[workerId+'|expedition']??0)+1);
 e.jobs=e.jobs.filter(j=>j.workerId!==workerId);
 return {item,resources:amount,coins,material:type.material+talent.material,discovered,risk:job.risk};
}
export function recallExpedition(s,workerId,now=Date.now()){
 const e=ensureExpeditions(s.camp),job=e.jobs.find(j=>j.workerId===workerId);
 if(!job||!Number.isFinite(now)||now>=job.endsAt)return false;
 e.jobs=e.jobs.filter(j=>j.workerId!==workerId);
 return true; // 中途撤回不会获得委托报酬。
}
