// E3六域奇遇路线：三节点、固定风险、真实道具消耗、隐藏见闻、一次性领取。
// 未联网；不从刷新或按钮重复点击中重掷随机结果。
import {REGIONS,SPECIES} from './data.js';
import {careerOf} from './partner-careers.js';
import {EXPEDITION_RESOURCES,ensureExpeditions,eligibleExpeditionPartners} from './expeditions.js';
export const ADVENTURE_NODES=Object.freeze(['trail','ruins','sanctuary']);
export const ADVENTURE_CHOICES=Object.freeze(['safe','risk','supply']);
export const ADVENTURE_COST=60;
export const ADVENTURE_COOLDOWN=300000;
const MAX_TIME=8e15;
const isInt=(x,min,max)=>Number.isSafeInteger(x)&&x>=min&&x<=max;
export const ensureAdventureRoutes=c=>(c.adventureRoutes??={active:null,seq:0,secrets:[],cooldowns:[0,0,0,0,0,0],completed:0});
function eligible(s,pid){
 return eligibleExpeditionPartners(s).some(p=>p.id===pid);
}
export function routeOptions(s){
 const a=s.camp?.adventureRoutes?.active;
 if(!a||a.stage>=3)return [];
 const type=a.stage===1?'repelVial':'herbalPotion';
 return ADVENTURE_CHOICES.map(choice=>({
  choice,item:choice==='supply'?type:null,
  available:choice!=='supply'||(s.camp.consumables[type]??0)>0,
 }));
}
export function startAdventureRoute(s,workerId,region,now=Date.now()){
 const c=s.camp,book=ensureAdventureRoutes(c);
 if(book.active||book.seq>=1000000||!isInt(region,0,s.unlockedRegion)
   ||!Number.isSafeInteger(now)||now<0||now>MAX_TIME-ADVENTURE_COOLDOWN
   ||now<(book.cooldowns[region]??0)||s.coins<ADVENTURE_COST
   ||!ensureExpeditions(c).finds.includes(region)||!eligible(s,workerId))return false;
 const p=s.collection.find(x=>x.id===workerId),spec=SPECIES[p.species];
 const match=spec.type===REGIONS[region].element||spec.secondaryType===REGIONS[region].element;
 book.seq++;
 book.active={workerId,region,seq:book.seq,stage:0,choices:[],startedAt:now,match};
 book.cooldowns[region]=now+ADVENTURE_COOLDOWN;
 s.coins-=ADVENTURE_COST;
 return true;
}
function riskSuccess(a,index){
 return a.match||((a.seq+index+a.region)%3!==0);
}
export function chooseAdventurePath(s,choice){
 const a=s.camp?.adventureRoutes?.active;
 if(!a||a.stage>=3||!ADVENTURE_CHOICES.includes(choice))return false;
 const option=routeOptions(s).find(x=>x.choice===choice);
 if(!option?.available)return false;
 if(option.item)s.camp.consumables[option.item]--;
 a.choices.push(choice);a.stage++;
 return true;
}
export function routeReward(s){
 const a=s.camp?.adventureRoutes?.active;
 if(!a||a.stage!==3||a.choices.length!==3)return null;
 let amount=2+(a.match?1:0)+(careerOf(s,a.workerId).type==='scout'?careerOf(s,a.workerId).rank*2:0),coins=25+a.region*9, successes=0;
 for(let i=0;i<3;i++){
  const choice=a.choices[i];
  if(choice==='safe'){amount+=2;coins+=10;}
  else if(choice==='supply'){amount+=4;coins+=20;successes++;}
  else if(riskSuccess(a,i)){amount+=5;coins+=23;successes++;}
  else {amount+=1;coins+=5;}
 }
 const secret=a.choices[1]==='supply'&&(a.match||a.choices[0]==='supply'||a.choices[0]==='risk'&&riskSuccess(a,0));
 const newSecret=secret&&!s.camp.adventureRoutes.secrets.includes(a.region);
 return {item:EXPEDITION_RESOURCES[a.region],amount,coins:coins+(newSecret?40:0),
  material:(successes>=2?1:0)+(newSecret?1:0),secret,newSecret};
}
export function claimAdventureRoute(s){
 const c=s.camp,book=ensureAdventureRoutes(c),a=book.active,reward=routeReward(s);
 if(!a||!reward||c.resources[reward.item]+reward.amount>5000)return false;
 c.resources[reward.item]+=reward.amount;
 s.coins=Math.min(1e12,s.coins+reward.coins);
 s.materials[a.region]=Math.min(1e12,s.materials[a.region]+reward.material);
 if(reward.newSecret)book.secrets.push(a.region);
 book.completed=Math.min(1000000,book.completed+1);
 book.active=null;
 return reward;
}
export function abortAdventureRoute(s){
 const book=ensureAdventureRoutes(s.camp);
 if(!book.active||book.active.stage>=3)return false;
 book.active=null;
 return true; // 已交的入场费和药剂都不返还，未结算的资源也不存在。
}
export function validateAdventureRoutes(s){
 const book=s.camp?.adventureRoutes;
 if(book===undefined)return true; // 兼容旧v3。
 if(!book||!isInt(book.seq,0,1000000)||!isInt(book.completed,0,book.seq)
   ||!Array.isArray(book.secrets)||book.secrets.length>6
   ||new Set(book.secrets).size!==book.secrets.length
   ||book.secrets.some(r=>!isInt(r,0,s.unlockedRegion))
   ||!Array.isArray(book.cooldowns)||book.cooldowns.length!==6
   ||book.cooldowns.some(t=>!isInt(t,0,MAX_TIME)))return false;
 const a=book.active;
 if(a===null)return true;
 if(!a||!isInt(a.seq,1,book.seq)||!isInt(a.region,0,s.unlockedRegion)
   ||!isInt(a.startedAt,0,MAX_TIME-ADVENTURE_COOLDOWN)
   ||book.cooldowns[a.region]!==a.startedAt+ADVENTURE_COOLDOWN
   ||!isInt(a.stage,0,3)||!Array.isArray(a.choices)||a.choices.length!==a.stage
   ||a.choices.some(ch=>!ADVENTURE_CHOICES.includes(ch))
   ||typeof a.match!=='boolean'||!s.camp.expeditions?.finds.includes(a.region)
   ||!s.collection.some(p=>p.id===a.workerId)
   ||s.team.includes(a.workerId)
   ||s.camp.jobs.some(j=>j.workerId===a.workerId)
   ||s.camp.expeditions.jobs.some(j=>j.workerId===a.workerId))return false;
 const p=s.collection.find(x=>x.id===a.workerId),spec=SPECIES[p.species];
 return a.match===(spec.type===REGIONS[a.region].element||spec.secondaryType===REGIONS[a.region].element);
}
