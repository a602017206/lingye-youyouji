// 营地UI只显示真实材料、已拥有伙伴及可执行配方；暂不伪造建筑与物品图片。
import { REGIONS, sprite } from './data.js';
import { campSceneWorkers, warehouseView, workProgress } from './camp-visual.js';
import { itemIcon } from './art-registry.js';
import { equipmentView } from './equipment-view.js';
import { campC4View } from './camp-c4-view.js';
import { campC5View } from './camp-c5-view.js';
import { expeditionView } from './expedition-view.js';
import {adventureRoutesView} from './adventure-routes-view.js';
import {combatTacticsView} from './combat-tactics-view.js';
import {skillLoadoutsView} from './skill-loadouts-view.js';
import {partnerCareersView} from './partner-careers-view.js';
import { EQUIPMENT } from './equipment-data.js';
import { CAMP_JOBS,CAMP_RECIPES,PROCESS_RECIPES,CAMP_RESOURCES,CAMP_JOB_LIMIT,CAMP_LEVEL_COSTS } from './camp-data.js';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function campView(s,tr,icon,img,name,selectedTraining,warehouseFilter='all',selectedCareer=null){
  const c=s.camp;
  const idle=s.collection.filter(p=>!s.team.includes(p.id)&&!c.jobs.some(j=>j.workerId===p.id)
     &&!c.expeditions?.jobs.some(j=>j.workerId===p.id)
     &&c.adventureRoutes?.active?.workerId!==p.id);
  const cost=CAMP_LEVEL_COSTS[c.level+1];
  const options=(id)=>Object.entries(CAMP_RECIPES).filter(([,r])=>r.category===id).map(([key])=>
    '<option value="'+key+'" '+(c[id+'Slot']===key?'selected':'')+'>'+tr('campRecipe'+key)+' · '+c.consumables[key]+'</option>').join('');
  return '<div class="camp-dashboard">'+campC5View(s,tr,icon)+expeditionView(s,tr,icon,name,sprite)+adventureRoutesView(s,tr,icon,name,sprite)+combatTacticsView(s,tr,icon,name,sprite)+skillLoadoutsView(s,tr,icon,name,sprite)+partnerCareersView(s,tr,icon,name,selectedCareer)+campSceneWorkers(s,tr,sprite,s.settings.locale)
    +'<div class="camp-overview"><div class="camp-overview-title">'+icon('leaf')+'<div><strong>'+tr('campTitle')+'</strong><small>'+tr('campHint')+'</small></div></div>'
    +'<div><strong>'+tr('campLevel',{level:c.level})+'</strong><small>'+tr('campWorkers',{used:c.jobs.length,max:CAMP_JOB_LIMIT[c.level-1]})+'</small></div>'
    +'<button class="secondary-button" data-action="camp-pause">'+tr(c.paused?'campResume':'campPause')+'</button></div>'
    +'<p class="camp-tip">'+icon('clock')+tr('campTimeTip')+'</p>'
    +'<section class="camp-section"><div class="section-heading"><h2>'+icon('leaf')+tr('campJobs')+'</h2><small>'+tr('campAvailable',{count:idle.length})+'</small></div>'
    +'<div class="camp-assign-controls"><label>'+tr('campWorkerLabel')+'<select id="camp-worker">'+idle.map(p=>'<option value="'+p.id+'">'+esc(name(p.species))+' Lv.'+p.level+'</option>').join('')+'</select></label>'
    +'<label>'+tr('campJobLabel')+'<select id="camp-job">'+Object.entries(CAMP_JOBS).filter(([,j])=>j.region<=s.unlockedRegion).map(([id,j])=>'<option value="'+id+'">'+tr('campJob'+id)+' · '+tr(REGIONS[j.region].name)+'</option>').join('')+'</select></label>'
    +'<button class="primary-button" data-action="camp-assign" '+(idle.length===0||c.jobs.length>=CAMP_JOB_LIMIT[c.level-1]?'disabled':'')+'>'+tr('campAssign')+'</button></div>'
    +'<div class="camp-job-grid">'+(c.jobs.map(j=>{const p=s.collection.find(p=>p.id===j.workerId),job=CAMP_JOBS[j.jobId];
      return '<article class="camp-job-card">'+img(p.species)+'<div class="camp-job-detail"><h3>'+esc(name(p.species))+'</h3><p>'+tr('campJob'+j.jobId)+' · '+tr(REGIONS[job.region].name)+'</p>'
      +'<div class="camp-progress" role="progressbar" aria-valuenow="'+Math.round(workProgress(s,j).percent)+'" aria-valuemin="0" aria-valuemax="100"><i style="width:'+workProgress(s,j).percent.toFixed(2)+'%"></i></div>'
      +'<small>'+tr('campJobYield',{item:tr('campRes'+job.item),amount:job.amount,seconds:job.seconds})+' · '+tr('campMastery',{count:c.professionXp[j.workerId+'|'+j.jobId]??0})+'</small></div>'
      +'<button class="secondary-button" data-camp-remove="'+j.workerId+'">'+tr('campRecall')+'</button></article>';
    }).join('')||'<div class="camp-empty">'+tr('campEmptyJobs')+'</div>')+'</div></section>'
    +'<section class="camp-section"><div class="section-heading"><h2>'+icon('bag')+tr('campWarehouse')+'</h2><small>'+tr('campWell')+'</small></div>'
     +warehouseView(s,tr,warehouseFilter,icon)+'</section>'
    +'<section class="camp-section"><div class="section-heading"><h2>'+icon('spark')+tr('campWorkshop')+'</h2><small>'+tr('campCraftHint')+'</small></div>'
    +(c.craft?'<div class="camp-craft-active">'+icon('clock')+tr('campCrafting',{name:tr((EQUIPMENT[c.craft.id]?'gear':PROCESS_RECIPES[c.craft.id]?'c4Process':'campRecipe')+c.craft.id),seconds:Math.max(0,Math.ceil((c.craft.endsAt-c.lastSettledAt)/1000))})+'</div>':'')
    +'<div class="camp-recipe-grid">'+Object.entries(CAMP_RECIPES).map(([id,r])=>{
      const locked=r.region>s.unlockedRegion;
      const costs=Object.entries(r.materials).map(([k,n])=>tr('campRes'+k)+' '+c.resources[k]+'/'+n).join(' · ')+(r.coins?' · '+tr('coins')+' '+r.coins:'');
      const affordable=!locked&&!c.craft&&Object.entries(r.materials).every(([k,n])=>c.resources[k]>=n)&&s.coins>=(r.coins??0)&&c.consumables[id]<99;
      const batchOk=!locked&&c.level>=3&&c.consumables[id]<=96&&s.coins>=3*(r.coins??0)&&Object.entries(r.materials).every(([k,n])=>c.resources[k]>=n*3);
      return '<article class="camp-recipe '+(locked?'camp-locked':'')+'"><header><span class="camp-supply-icon">'+itemIcon('consumables',id,icon,r.category==='potion'?'heart':'shield')+'</span><strong>'+tr('campRecipe'+id)+'</strong><span>'+tr(r.category==='potion'?'campPotion':'campTool')+'</span></header><p>'+tr('campRecipeDesc'+id)+'</p><small>'+costs+'</small>'
        +'<div class="camp-recipe-actions"><b>'+tr('campStock',{count:c.consumables[id]})+'</b><button class="secondary-button" data-camp-craft="'+id+'" '+(affordable?'':'disabled')+'>'+(locked?tr('locked'):tr('campMake'))+'</button>'
         +'<button class="secondary-button" data-c4-batch="'+id+'" data-c4-quantity="3" '+(batchOk?'':'disabled')+'>'+tr('c4BatchThree')+'</button></div></article>';
    }).join('')+'</div></section>'
    +'<section class="camp-section"><div class="section-heading"><h2>'+icon('shield')+tr('campLoadout')+'</h2><small>'+tr('campLoadoutHint')+'</small></div>'
    +'<div class="camp-loadout-fields"><label><span class="camp-loadout-preview">'+itemIcon('consumables',c.potionSlot,icon,'potion')+tr('campPotion')+'</span><select id="camp-loadout-potion">'+options('potion')+'</select></label><label><span class="camp-loadout-preview">'+itemIcon('consumables',c.toolSlot,icon,'spark')+tr('campTool')+'</span><select id="camp-loadout-tool">'+options('tool')+'</select></label>'
    +'<button class="primary-button" data-action="camp-prepare-run">'+tr('campRestartBattle')+'</button></div></section>'
    +campC4View(s,tr,icon,name,selectedTraining)
    +equipmentView(s,tr,icon,name)
    +'<section class="camp-section"><div class="section-heading"><h2>'+icon('shield')+tr('campUpgrade')+'</h2></div>'
    +'<p>'+(cost?tr('campUpgradeCost',{materials:Object.entries(cost).map(([k,n])=>(k==='coins'?tr('coins'):tr('campRes'+k))+' ×'+n).join(' · ')}):tr('campMaxLevel'))+'</p>'
    +'<button class="secondary-button" data-action="camp-upgrade" '+(!cost||s.coins<cost.coins||Object.entries(cost).some(([k,n])=>k!=='coins'&&c.resources[k]<n)?'disabled':'')+'>'+tr('campUpgrade')+'</button></section></div>';
}
