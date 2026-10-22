// 营地第一阶段：按真实时间批次结算，和群潮Canvas/页面刷新率完全隔离。
import { CAMP_RESOURCES, CAMP_JOBS, CAMP_RECIPES, PROCESS_RECIPES, CAMP_FACILITIES, CAMP_JOB_LIMIT, CAMP_LEVEL_COSTS } from './camp-data.js';
import { SPECIES } from './data.js';
import {talentBonus} from './family-talents.js';
import { EQUIPMENT } from './equipment-data.js';
import { ensureEquipmentState, validateEquipment, nextEquipment } from './equipment.js';
import { validateTraining } from './camp-training.js';
import { ensureExpeditions,validateExpeditions } from './expeditions.js';
import {validateCombatRoles} from './combat-tactics.js';
import {validateSkillLoadouts} from './skill-loadouts.js';
import {careerMultiplier,validateCareers} from './partner-careers.js';
import {ensureAdventureRoutes,validateAdventureRoutes} from './adventure-routes.js';
const CAP=5000,MAX_SECONDS=28800,MAX_TIME=8e15;
const isNum=n=>Number.isInteger(n)&&n>=0&&n<=CAP;
export {CAMP_JOBS,CAMP_RECIPES,CAMP_RESOURCES,PROCESS_RECIPES};
const newMaterials=new Set(['seed','plank','ingot','herbPowder']);
const newConsumables=new Set(['fortifiedDraught','reinforcedDisc']);
const C5_PLAN_LIMIT=3;
const craftBook={...CAMP_RECIPES,...PROCESS_RECIPES,...EQUIPMENT};
const queueLimit=level=>level>=5?6:level>=3?3:1;
const craftTime=(id,c)=>craftBook[id].seconds*1000/(1+((c?.facilities?.workshop??1)-1)*.08);
const defaultFacilities=()=>Object.fromEntries(Object.keys(CAMP_FACILITIES).map(id=>[id,1]));
export function ensureCamp(s,now=Date.now()){
  if(s.camp){
    ensureEquipmentState(s.camp);
    for(const id of newMaterials)s.camp.resources[id]??=id==='seed'?2:0;
    for(const id of newConsumables)s.camp.consumables[id]??=0;
    s.camp.productionPlans??=[];s.camp.productionEnabled??=true;
    ensureExpeditions(s.camp);
    ensureAdventureRoutes(s.camp);
    s.camp.combatRoles??={};
    s.camp.skillLoadouts??={};s.camp.autoActiveSkills??=false;s.camp.careers??={};
    s.camp.facilities??=defaultFacilities();
    s.camp.craftQueue??=[];s.camp.autoTargets??=null;s.camp.garden??=[null,null];s.camp.gardenAuto??=[false,false];s.camp.training??={};
    return s.camp;
  }
  s.camp={level:1,paused:false,lastSettledAt:now,resources:Object.fromEntries(Object.keys(CAMP_RESOURCES).map(k=>[k,k==='dew'||k==='seed'?2:0])),
    consumables:Object.fromEntries(Object.keys(CAMP_RECIPES).map(k=>[k,0])),
    jobs:[],craft:null,wellProgress:0,professionXp:{},
    potionSlot:'herbalPotion',toolSlot:'repelVial',equipment:[],equipmentSeq:0,
    craftQueue:[],autoTargets:null,garden:[null,null],gardenAuto:[false,false],training:{},
    productionPlans:[],productionEnabled:true,facilities:defaultFacilities(),
    expeditions:{jobs:[],seq:0,finds:[]},adventureRoutes:{active:null,seq:0,secrets:[],cooldowns:[0,0,0,0,0,0],completed:0},combatRoles:{},skillLoadouts:{},autoActiveSkills:false,careers:{}};
  return s.camp;
}
export function validateCamp(s){
  const c=s.camp;
  if(c===undefined)return true; // 旧v2存档不包含生产字段
  if(!c||!Number.isInteger(c.level)||c.level<1||c.level>5||typeof c.paused!=='boolean'
    ||!Number.isFinite(c.lastSettledAt)||c.lastSettledAt<0||c.lastSettledAt>MAX_TIME
    ||!Number.isFinite(c.wellProgress)||c.wellProgress<0||c.wellProgress>=180000)return false;
  if(!c.resources||!Object.keys(CAMP_RESOURCES).every(k=>newMaterials.has(k)&&c.resources[k]===undefined||isNum(c.resources[k]))
    ||!c.consumables||!Object.keys(CAMP_RECIPES).every(k=>newConsumables.has(k)&&c.consumables[k]===undefined||isNum(c.consumables[k])))return false;
  if(!Object.keys(CAMP_RECIPES).includes(c.potionSlot)||CAMP_RECIPES[c.potionSlot].category!=='potion'
    ||!Object.keys(CAMP_RECIPES).includes(c.toolSlot)||CAMP_RECIPES[c.toolSlot].category!=='tool')return false;
  if(!Array.isArray(c.jobs)||c.jobs.length>CAMP_JOB_LIMIT[c.level-1]||!c.professionXp||typeof c.professionXp!=='object')return false;
  if(new Set(c.jobs.map(j=>j.workerId)).size!==c.jobs.length)return false;
  for(const j of c.jobs){
    if(!j||!s.collection.some(p=>p.id===j.workerId)||s.team.includes(j.workerId)
      ||!CAMP_JOBS[j.jobId]||CAMP_JOBS[j.jobId].region>s.unlockedRegion
      ||!Number.isFinite(j.progressMs)||j.progressMs<0||j.progressMs>=CAMP_JOBS[j.jobId].seconds*1000)return false;
  }
  if(Object.values(c.professionXp).some(n=>!Number.isInteger(n)||n<0||n>1e8))return false;
  if(!validateEquipment(s)||!validateTraining(s)||!validateExpeditions(s)||!validateCombatRoles(s)||!validateSkillLoadouts(s)||!validateAdventureRoutes(s)||!validateCareers(s))return false;
  if(c.craftQueue!==undefined&&(!Array.isArray(c.craftQueue)||c.craftQueue.length>queueLimit(c.level)-1||c.craftQueue.some(o=>!o||!craftBook[o.id])))return false;
  if(c.autoTargets!==undefined&&c.autoTargets!==null&&(!c.autoTargets||c.level<4||!CAMP_RECIPES[c.autoTargets.id]||!Number.isInteger(c.autoTargets.target)||c.autoTargets.target<1||c.autoTargets.target>20))return false;
  if(c.productionPlans!==undefined&&(!Array.isArray(c.productionPlans)||c.productionPlans.length>C5_PLAN_LIMIT
    ||new Set(c.productionPlans.map(p=>p?.id)).size!==c.productionPlans.length
    ||c.productionPlans.some(p=>!p||!CAMP_RECIPES[p.id]||!Number.isInteger(p.target)||p.target<1||p.target>20)))return false;
  if(c.productionEnabled!==undefined&&typeof c.productionEnabled!=='boolean')return false;
  if(c.facilities!==undefined&&(!c.facilities||Object.keys(c.facilities).some(k=>!CAMP_FACILITIES[k])||
    !Object.keys(CAMP_FACILITIES).every(k=>Number.isInteger(c.facilities[k])&&c.facilities[k]>=1&&c.facilities[k]<=3)))return false;
  if(c.gardenAuto!==undefined&&(!Array.isArray(c.gardenAuto)||c.gardenAuto.length!==2||c.gardenAuto.some((active,i)=>typeof active!=='boolean'||(active&&i>=(c.level>=4?2:0)))))return false;
  if(c.garden!==undefined&&(!Array.isArray(c.garden)||c.garden.length!==2||c.garden.some((plot,i)=>plot!==null&&(!plot||!Number.isFinite(plot.endsAt)||plot.endsAt<0||plot.endsAt>MAX_TIME||i>= (c.level>=4?2:c.level>=2?1:0)))))return false;
  if(c.craft!==null&&(!c.craft||!craftBook[c.craft.id]||!Number.isFinite(c.craft.endsAt)
    ||c.craft.endsAt<0||c.craft.endsAt>MAX_TIME))return false;
  return true;
}
export function workDuration(s,worker,job){
  const p=s.collection.find(x=>x.id===worker);
  const types=[SPECIES[p.species].type,SPECIES[p.species].secondaryType];
  const elementBias={logging:['grove','gale'],herbalism:['grove','spore','tide'],foraging:['gale','umbra'],
    mining:['ember','metal','stone'],beachcombing:['tide','frost'],frostmining:['frost','stone'],
    sporehunt:['spore','grove'],starmining:['aether','radiance','storm']};
  const fit=types.some(t=>elementBias[job]?.includes(t))?.08:0;
  const level=Math.min(20,Math.floor((s.camp.professionXp[worker+'|'+job]??0)/12));
  const tool=s.camp.equipment?.find(e=>e.owner===worker&&EQUIPMENT[e.recipe]?.workJob===job);
  const toolBonus=tool?EQUIPMENT[tool.recipe].workSpeed:0;
  const building=job==='logging'?'lumber':['mining','frostmining','starmining'].includes(job)?'mine':null;
  const buildingBonus=building?((s.camp.facilities?.[building]??1)-1)*.07:0;
  return CAMP_JOBS[job].seconds*1000/(1+Math.min(.75,fit+level*.01+toolBonus+buildingBonus+(careerMultiplier(s,worker,'artisan')-1)+talentBonus(p.species,job)));
}
// 制作订单在下单时预留材料，入库不足时保留订单不吞已付资源。
function reserveCraft(s,id){
  const c=s.camp,r=craftBook[id];
  if(!r||r.region>s.unlockedRegion||s.coins<(r.coins??0))return false;
  if(EQUIPMENT[id]&&(c.equipment.length>=120||c.equipmentSeq>=1e6))return false;
  if(CAMP_RECIPES[id]&&c.consumables[id]>=99)return false;
  if(PROCESS_RECIPES[id]&&c.resources[r.output]+r.amount>CAP)return false;
  if(Object.entries(r.materials).some(([k,n])=>c.resources[k]<n))return false;
  for(const [k,n] of Object.entries(r.materials))c.resources[k]-=n;
  s.coins-=r.coins??0;
  return true;
}
function finishCraft(c,id){
  if(EQUIPMENT[id])return nextEquipment(c,id);
  if(PROCESS_RECIPES[id]){
    const r=PROCESS_RECIPES[id];
    if(c.resources[r.output]+r.amount>CAP)return false;
    c.resources[r.output]+=r.amount;return true;
  }
  if(c.consumables[id]>=99)return false;
  c.consumables[id]++;return true;
}
// 按优先级完成生产目标；原料加工最多追溯两层，缺料时尝试低优先级而不死锁。
// 库存达到目标即停止；所有订单使用既有预扣与固定批次结算。
function planRecipe(s,id,depth=0,seen=new Set()){
  if(!craftBook[id]||depth>3||seen.has(id))return null;
  const r=craftBook[id],c=s.camp;
  if(r.region>s.unlockedRegion)return null;
  const missing=Object.entries(r.materials).filter(([key,n])=>(c.resources[key]??0)<n);
  if(missing.length===0){
    if(s.coins<(r.coins??0))return null;
    if(PROCESS_RECIPES[id]&&c.resources[r.output]+r.amount>CAP)return null;
    if(CAMP_RECIPES[id]&&c.consumables[id]>=99)return null;
    return id;
  }
  const nextSeen=new Set([...seen,id]);
  for(const [resource] of missing){
    const make=Object.keys(PROCESS_RECIPES).find(k=>PROCESS_RECIPES[k].output===resource);
    if(make){
      const pick=planRecipe(s,make,depth+1,nextSeen);
      if(pick)return pick;
    }
  }
  return null;
}
function queueAuto(s,time){
  const c=s.camp;
  if(c.level<4||c.craft||c.craftQueue.length)return false;
  if(c.productionEnabled===false)return false;
  // 升级后的生产计划优先；未设置新计划则兼容C4单目标设置。
  const targets=(c.productionPlans?.length?c.productionPlans:(c.autoTargets?[c.autoTargets]:[]));
  for(const target of targets){
    if(!CAMP_RECIPES[target.id]||c.consumables[target.id]>=target.target)continue;
    const id=planRecipe(s,target.id);
    if(id&&reserveCraft(s,id)){
      c.craft={id,endsAt:time+craftTime(id,c)};
      return true;
    }
  }
  return false;
}
export function craftPlanStatus(s){
 const c=ensureCamp(s);
 return c.productionPlans.map((p,index)=>({
  ...p,priority:index+1,stock:c.consumables[p.id]??0,
  state:c.consumables[p.id]>=p.target?'done':c.craft?.id===p.id?'crafting':
    planRecipe(s,p.id)?'ready':'blocked'
 }));
}
export function addProductionPlan(s,id,target,now=Date.now()){
 settleCamp(s,now);const c=s.camp;
 if(c.level<5||!CAMP_RECIPES[id]||!Number.isInteger(target)||target<1||target>20||
   c.productionPlans.length>=C5_PLAN_LIMIT||c.productionPlans.some(p=>p.id===id))return false;
 c.productionPlans.push({id,target});
 c.autoTargets=null; // 首次配置多目标时关掉旧版单目标，避免移除后意外恢复旧任务。
 queueAuto(s,now);
 return true;
}
export function removeProductionPlan(s,id,now=Date.now()){
 settleCamp(s,now);const c=s.camp,old=c.productionPlans.length;
 c.productionPlans=c.productionPlans.filter(p=>p.id!==id);
 return c.productionPlans.length!==old;
}
export function setProductionEnabled(s,enabled,now=Date.now()){
 settleCamp(s,now);
 if(s.camp.level<5||typeof enabled!=='boolean')return false;
 s.camp.productionEnabled=enabled;
 if(enabled)queueAuto(s,now);
 return true;
}
// D2-B药圃自动化：成熟结算按整数周期批量计算，受8小时离线上限与仓库上限约束。
// 每次成熟返还一枚种子，并立即用于下一轮播种；不能产生无种子收益。
function settleAutomaticGarden(c,from,until,earned){
  if(c.level<4)return;
  const grow=240000,yieldCount=4+(c.facilities?.garden??1)-1;
  for(let i=0;i<2;i++){
    if(!c.gardenAuto?.[i])continue;
    let p=c.garden[i];
    if(!p){
      if(c.resources.seed<=0)continue;
      c.resources.seed--;p={endsAt:from+grow};c.garden[i]=p;
    }
    if(p.endsAt>until)continue;
    const cycles=Math.min(Math.floor((until-p.endsAt)/grow)+1,
      Math.floor((CAP-c.resources.herb)/yieldCount));
    if(cycles<=0)continue;
    const amount=cycles*yieldCount;
    c.resources.herb+=amount;earned.herb=(earned.herb??0)+amount;
    p.endsAt+=cycles*grow;
    // 收获的种子直接用于下一批：仓库持有量不变。
  }
}
export function setGardenAuto(s,plot,enabled,now=Date.now()){
  settleCamp(s,now);const c=s.camp;
  if(c.level<4||!Number.isInteger(plot)||plot<0||plot>1||typeof enabled!=='boolean')return false;
  c.gardenAuto[plot]=enabled;
  if(enabled)settleAutomaticGarden(c,now,now,{});
  return true;
}
export function settleCamp(s,now=Date.now()){
  const c=ensureCamp(s,now);
  if(!Number.isFinite(now))return {elapsed:0,resources:{}};
  const previous=c.lastSettledAt;
  const elapsed=Math.min(MAX_SECONDS*1000,Math.max(0,now-previous));
  const until=previous+elapsed;
  // 即使时钟回拨也不退回水位，离线超过8小时的尾部不追偿。
  c.lastSettledAt=Math.max(now,previous);
  const earned={};
  if(!c.paused&&elapsed>0){
    const waterCount=Math.floor((c.wellProgress+elapsed)/180000);
    c.wellProgress=(c.wellProgress+elapsed)%180000;
    const water=Math.min(waterCount,12-c.resources.dew);
    if(water>0){c.resources.dew+=water;earned.dew=water;}
    for(const j of c.jobs){
      const interval=workDuration(s,j.workerId,j.jobId);
      const progress=j.progressMs+elapsed;
      const batches=Math.floor(progress/interval),amount=CAMP_JOBS[j.jobId].amount;
      const item=CAMP_JOBS[j.jobId].item;
      const capacity=Math.floor((CAP-c.resources[item])/amount);
      const completed=Math.max(0,Math.min(batches,capacity));
      if(completed>0){
        c.resources[item]+=completed*amount;
        earned[item]=(earned[item]??0)+completed*amount;
        const skill=j.workerId+'|'+j.jobId,prior=c.professionXp[skill]??0;
        c.professionXp[skill]=Math.min(1e8,prior+completed);
        if(j.jobId==='herbalism'){
          const seeds=Math.min(CAP-c.resources.seed,Math.floor(c.professionXp[skill]/4)-Math.floor(prior/4));
          if(seeds>0){c.resources.seed+=seeds;earned.seed=(earned.seed??0)+seeds;}
        }
      }
      j.progressMs=capacity<=0?Math.min(interval-1,j.progressMs):progress%interval;
    }
  }
  if(now>previous){
    settleAutomaticGarden(c,previous,until,earned);
    // 超过8小时的尾部不计入产量，也不能通过再次调用settleCamp追领。
    if(now>until)for(let i=0;i<2;i++)if(c.gardenAuto?.[i]&&c.garden[i])c.garden[i].endsAt+=now-until;
  }
  // 自动补货可连续使用结算窗口内剩余的离线时间；每个完成事件只触发一次。
  if(!c.craft&&!c.craftQueue.length)queueAuto(s,previous);
  let loops=0;
  while(c.craft&&c.craft.endsAt<=until&&loops++<1200){
    const id=c.craft.id,finishedAt=c.craft.endsAt;
    if(!finishCraft(c,id))break;
    earned[id]=(earned[id]??0)+1;
    c.craft=null;
    if(c.craftQueue.length){
      const next=c.craftQueue.shift();
      c.craft={id:next.id,endsAt:finishedAt+craftTime(next.id,c)};
    }else queueAuto(s,finishedAt);
  }
  if(!c.craft&&c.craftQueue.length){
    const next=c.craftQueue.shift();
    c.craft={id:next.id,endsAt:Math.max(until,now)+craftTime(next.id,c)};
  }
  // 当前帧完工却无法追加订单时，下一个结算窗口会尝试重新自动补货。
  return {elapsed,resources:earned};
}
export function assignCampJob(s,workerId,jobId,now=Date.now()){
  settleCamp(s,now);const c=s.camp,j=CAMP_JOBS[jobId];
  if(!j||j.region>s.unlockedRegion||c.jobs.length>=CAMP_JOB_LIMIT[c.level-1]
    ||s.team.includes(workerId)||!s.collection.some(p=>p.id===workerId)||c.jobs.some(x=>x.workerId===workerId)
    ||c.expeditions?.jobs.some(x=>x.workerId===workerId)
    ||c.adventureRoutes?.active?.workerId===workerId)return false;
  c.jobs.push({workerId,jobId,progressMs:0});return true;
}
export function removeCampJob(s,workerId,now=Date.now()){
  settleCamp(s,now);const before=s.camp.jobs.length;
  s.camp.jobs=s.camp.jobs.filter(j=>j.workerId!==workerId);
  return before!==s.camp.jobs.length;
}
export function startCraft(s,id,now=Date.now()){
  settleCamp(s,now);const c=s.camp;
  if(c.craft||c.craftQueue.length||!reserveCraft(s,id))return false;
  c.craft={id,endsAt:now+craftTime(id,c)};return true;
}
// 手动批量下单：每一件的原料与星砂都须完整预留后才创建队列。
export function enqueueCraft(s,id,amount=1,now=Date.now()){
  settleCamp(s,now);const c=s.camp,r=craftBook[id];
  if(c.level<3||!r||!Number.isInteger(amount)||amount<1||amount>6)return false;
  const available=queueLimit(c.level)-(c.craft?1:0)-c.craftQueue.length;
  if(amount>available||r.region>s.unlockedRegion||s.coins<(r.coins??0)*amount)return false;
  if(EQUIPMENT[id]&&(c.equipment.length+amount>120||c.equipmentSeq+amount>1e6))return false;
  if(CAMP_RECIPES[id]&&c.consumables[id]+amount>99)return false;
  if(PROCESS_RECIPES[id]&&c.resources[r.output]+r.amount*amount>CAP)return false;
  if(Object.entries(r.materials).some(([key,n])=>c.resources[key]<n*amount))return false;
  for(const [key,n] of Object.entries(r.materials))c.resources[key]-=n*amount;
  s.coins-=(r.coins??0)*amount;
  for(let i=0;i<amount;i++){
    if(!c.craft)c.craft={id,endsAt:now+craftTime(id,c)};
    else c.craftQueue.push({id});
  }
  return true;
}
export function setAutoTarget(s,id,target,now=Date.now()){
  settleCamp(s,now);const c=s.camp;
  if(c.level<4||c.productionPlans?.length||!CAMP_RECIPES[id]||!Number.isInteger(target)||target<0||target>20)return false;
  c.autoTargets=target===0?null:{id,target};
  if(c.autoTargets)queueAuto(s,now);
  return true;
}
export function plantGarden(s,plot,now=Date.now()){
  settleCamp(s,now);const c=s.camp;
  if(!Number.isInteger(plot)||plot<0||plot>=(c.level>=4?2:c.level>=2?1:0)
    ||c.garden[plot]!==null||c.resources.seed<1)return false;
  c.resources.seed--;
  c.garden[plot]={endsAt:now+240000};return true;
}
export function harvestGarden(s,plot,now=Date.now()){
  settleCamp(s,now);const c=s.camp;
  if(!Number.isInteger(plot)||plot<0||plot>=2)return false;
  const planted=c.garden[plot];
  const harvestAmount=4+(c.facilities?.garden??1)-1;
  if(!planted||now<planted.endsAt||c.resources.herb>CAP-harvestAmount||c.resources.seed>=CAP)return false;
  c.resources.herb+=harvestAmount;c.resources.seed+=1;c.garden[plot]=null;
  return true;
}
export function upgradeCamp(s,now=Date.now()){
  settleCamp(s,now);const c=s.camp,cost=CAMP_LEVEL_COSTS[c.level+1];
  if(!cost||s.coins<cost.coins||Object.entries(cost).some(([k,n])=>k!=='coins'&&c.resources[k]<n))return false;
  s.coins-=cost.coins;
  Object.entries(cost).forEach(([k,n])=>{if(k!=='coins')c.resources[k]-=n;});
  c.level++;return true;
}
export function upgradeCampFacility(s,id,now=Date.now()){
  settleCamp(s,now);
  const c=s.camp,r=CAMP_FACILITIES[id];
  if(!r||c.level<r.unlock||s.unlockedRegion<r.region)return false;
  const old=c.facilities[id],cost=r.upgrade[old+1];
  if(!cost||s.coins<(cost.coins??0)||Object.entries(cost).some(([k,n])=>k!=='coins'&&c.resources[k]<n))return false;
  s.coins-=cost.coins??0;
  for(const [k,n]of Object.entries(cost))if(k!=='coins')c.resources[k]-=n;
  c.facilities[id]=old+1;
  return true;
}
export function selectCampLoadout(s,slot,id){
  const c=ensureCamp(s);
  if(!['potion','tool'].includes(slot)||!CAMP_RECIPES[id]||CAMP_RECIPES[id].category!==slot)return false;
  c[slot+'Slot']=id;return true;
}
export function setCampPaused(s,paused,now=Date.now()){
  settleCamp(s,now);s.camp.paused=!!paused;
}
