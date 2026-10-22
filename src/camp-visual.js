// D2营地可视化：复用已有原创角色PNG，所有进度取自真实生产引擎。
import {SPECIES} from './data.js';
import {creatureName} from './i18n.js';
import {CAMP_JOBS,CAMP_RECIPES,PROCESS_RECIPES,CAMP_RESOURCES} from './camp-data.js';
import {EQUIPMENT} from './equipment-data.js';
import {workDuration} from './camp-engine.js';
import {itemIcon} from './art-registry.js';
import {portraitMarkup} from './creature-portrait.js';
export const RESOURCE_GROUPS={
 basic:['wood','herb','fiber','dew'],
 ecology:['ore','shell','ice','spore','stardust'],
 processed:['plank','ingot','herbPowder'],
 growing:['seed'],
};
export const WAREHOUSE_FILTERS=['all',...Object.keys(RESOURCE_GROUPS)];
const fraction=(num,denom)=>Math.max(0,Math.min(100,denom>0?num/denom*100:0));
const safeName=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function workProgress(s,job){
 const duration=workDuration(s,job.workerId,job.jobId);
 const progress=Math.max(0,job.progressMs);
 return {percent:fraction(progress,duration),
  remainingSeconds:Math.max(0,Math.ceil((duration-progress)/1000)),
  seconds:duration/1000};
}
export function craftProgress(s){
 const item=s.camp.craft;
 if(!item)return null;
 const recipe=CAMP_RECIPES[item.id]??PROCESS_RECIPES[item.id]??EQUIPMENT[item.id];
 if(!recipe)return null;
 const duration=recipe.seconds*1000/(1+(s.camp.facilities?.workshop-1||0)*.08);
 const remaining=Math.max(0,item.endsAt-s.camp.lastSettledAt);
 return {id:item.id,percent:fraction(duration-remaining,duration),
  remainingSeconds:Math.ceil(remaining/1000),seconds:duration/1000};
}
export function warehouseView(s,tr,selected='all',icon=null){
 if(!WAREHOUSE_FILTERS.includes(selected))selected='all';
 const ids=selected==='all'?Object.keys(CAMP_RESOURCES):RESOURCE_GROUPS[selected];
 return '<div class="camp-inventory-tools" role="group" aria-label="'+tr('d2WarehouseFilters')+'">'
  +WAREHOUSE_FILTERS.map(id=>'<button class="camp-inventory-filter '+(selected===id?'active':'')+'" data-camp-filter="'+id+'" aria-pressed="'+(id===selected)+'">'+tr('d2Filter'+id)+'</button>').join('')+'</div>'
  +'<div class="camp-inventory">'+ids.map(id=>'<div class="camp-resource camp-resource-'+id+'">'+(icon?'<span class="camp-resource-icon">'+itemIcon('resources',id,icon,'bag')+'</span>':'')+'<span>'+tr('campRes'+id)+'</span><strong>'+s.camp.resources[id]+'</strong></div>').join('')+'</div>';
}
export function campSceneWorkers(s,tr,sprite,lang='zh-CN'){
 const c=s.camp,active=c.jobs;
 const units=active.slice(0,6).map((j,i)=>{
  const p=s.collection.find(x=>x.id===j.workerId);
  if(!p)return '';
  const progress=workProgress(s,j);
  const picture=sprite(p.species);
  const jobName=tr('campJob'+j.jobId);
  return '<article class="camp-worker-actor" style="--worker-order:'+i+'" data-worker-id="'+j.workerId+'">'
    +'<div class="camp-actor-art">'+portraitMarkup(p.species,creatureName(p.species,lang))+'</div>'
    +'<div class="camp-actor-info"><strong>'+safeName(creatureName(p.species,lang))+'</strong><span>'+jobName+'</span>'
    +'<div class="camp-actor-progress" role="progressbar" aria-label="'+jobName+'" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+Math.round(progress.percent)+'"><i style="width:'+progress.percent.toFixed(2)+'%"></i></div>'
    +'<small>'+tr('d2Remaining',{seconds:progress.remainingSeconds})+'</small></div></article>';
 }).join('');
 const producing=craftProgress(s);
 const recipe=producing?CAMP_RECIPES[producing.id]??PROCESS_RECIPES[producing.id]??EQUIPMENT[producing.id]:null;
 const craftName=producing?tr((CAMP_RECIPES[producing.id]?'campRecipe':PROCESS_RECIPES[producing.id]?'c4Process':'gear')+producing.id):'';
 return '<section class="camp-work-stage" aria-label="'+tr('d2WorkingStage')+'">'
  +'<div class="camp-stage-heading"><div><span class="camp-stage-eyebrow">'+tr('d2WorkshopLive')+'</span><h2>'+tr('d2WorkingStage')+'</h2></div>'
  +'<span class="camp-stage-count">'+tr('campWorkers',{used:active.length,max:([1,2,3,4,6][c.level-1])})+'</span></div>'
  +'<div class="camp-worker-actors">'+(units||'<p class="camp-worker-stage-empty">'+tr('d2StageEmpty')+'</p>')+'</div>'
  +'<div class="camp-craft-status">'+(producing?'<div class="camp-craft-chip"><strong>'+tr('d2Making')+' · '+craftName+'</strong><span>'+tr('d2Remaining',{seconds:producing.remainingSeconds})+'</span>'
   +'<div class="camp-actor-progress"><i style="width:'+producing.percent.toFixed(2)+'%"></i></div></div>':'<div class="camp-craft-idle">'+tr('d2WorkshopIdle')+'</div>')
  +'<a href="#camp-c5-plans" class="camp-stage-link">'+tr('d2SeeProduction')+' →</a></div></section>';
}
