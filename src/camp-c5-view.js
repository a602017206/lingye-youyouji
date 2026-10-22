// C5生产设施和高级自动化面板，复用真实林地背景，不使用不存在的建筑贴图。
import { REGIONS } from './data.js';
import { CAMP_RECIPES,CAMP_FACILITIES } from './camp-data.js';
import { craftPlanStatus } from './camp-engine.js';
import { itemIcon } from './art-registry.js';
const isAffordable=(s,cost)=>s.coins>=(cost.coins??0)&&Object.entries(cost).every(([k,n])=>k==='coins'||s.camp.resources[k]>=n);
const showCost=(tr,cost)=>Object.entries(cost).map(([k,n])=>(k==='coins'?tr('coins'):tr('campRes'+k))+' ×'+n).join(' · ');
export function campC5View(s,tr,icon){
 const c=s.camp,facilities=c.facilities,plans=craftPlanStatus(s);
 const setup=Object.entries(CAMP_FACILITIES).map(([id,f])=>{
   const level=facilities[id],cost=f.upgrade[level+1],locked=c.level<f.unlock||s.unlockedRegion<f.region;
   return '<article class="c5-facility '+(locked?'camp-locked':'')+'"><div class="c5-facility-sign">'+itemIcon('facilities',id,icon,f.icon)+'</div>'
   +'<div class="c5-facility-copy"><h3>'+tr('c5Facility'+id)+'</h3><div class="c5-stars">'+Array.from({length:3},(_,i)=>i<level?'★':'☆').join('')+'</div>'
   +'<small>'+tr('c5Bonus'+id,{level})+'</small><p>'+(locked?tr('c5FacilityLocked'):cost?showCost(tr,cost):tr('c5FacilityMax'))+'</p></div>'
   +'<button class="secondary-button" data-c5-facility="'+id+'" '+(locked||!cost||!isAffordable(s,cost)?'disabled':'')+'>'+(cost?tr('c5UpgradeBuilding'):tr('c5Max'))+'</button></article>';
 }).join('');
 const planned=plans.map(p=>'<article class="c5-plan-item"><span class="c5-priority">'+p.priority+'</span>'
  +'<div><strong>'+tr('campRecipe'+p.id)+'</strong><small>'+tr('c5PlanQuantity',{count:p.stock,target:p.target})+' · '+tr('c5Status'+p.state)+'</small></div>'
  +'<button class="secondary-button" data-c5-remove="'+p.id+'">'+tr('c5RemovePlan')+'</button></article>').join('');
 return '<section class="camp-scene" aria-label="'+tr('c5SceneTitle')+'" style="--camp-landscape:url(\''+REGIONS[0].background+'\')">'
  +'<div class="camp-scene-head"><div><span class="camp-scene-overline">'+tr('c5Chapter')+'</span><h2>'+tr('c5SceneTitle')+'</h2><p>'+tr('c5SceneDesc')+'</p></div>'
  +'<div class="camp-scene-stats"><span>'+tr('campLevel',{level:c.level})+'</span><strong>'+Object.values(facilities).reduce((a,b)=>a+b,0)+' / 12</strong><small>'+tr('c5Construction')+'</small></div></div>'
  +'<div class="camp-scene-map">'+Object.entries(CAMP_FACILITIES).map(([id,f],i)=>'<a class="camp-scene-marker camp-marker-'+id+'" href="#camp-c5-facilities">'+icon(f.icon)+'<span>'+tr('c5Facility'+id)+' · '+facilities[id]+'</span></a>').join('')+'</div>'
  +'</section>'
  +'<section class="camp-section camp-c5" id="camp-c5-facilities"><div class="section-heading"><h2>'+icon('shield')+tr('c5FacilitiesTitle')+'</h2><small>'+tr('c5FacilitiesHint')+'</small></div>'
  +'<div class="c5-facilities-grid">'+setup+'</div></section>'
  +'<section class="camp-section camp-c5" id="camp-c5-plans"><div class="section-heading"><h2>'+icon('clock')+tr('c5PlanTitle')+'</h2><small>'+tr('c5PlanHint')+'</small></div>'
  +'<div class="c5-plan-status"><div><strong>'+tr('c5PlanActive',{count:plans.length})+'</strong><small>'+tr(c.productionEnabled?'c5Running':'c5Stopped')+'</small></div>'
  +'<button class="secondary-button" data-action="c5-toggle-plans" '+(c.level<5?'disabled':'')+'>'+tr(c.productionEnabled?'c5Pause':'c5Resume')+'</button></div>'
  +'<div class="c5-plan-list">'+(planned||'<div class="camp-empty">'+tr('c5PlanEmpty')+'</div>')+'</div>'
  +'<div class="c5-plan-form"><label>'+tr('c5PlanProduct')+'<select id="c5-plan-recipe">'+Object.keys(CAMP_RECIPES).map(id=>'<option value="'+id+'">'+tr('campRecipe'+id)+'</option>').join('')+'</select></label>'
  +'<label>'+tr('c5PlanTarget')+'<select id="c5-plan-goal">'+[1,2,3,5,8,10,15,20].map(n=>'<option value="'+n+'" '+(n===3?'selected':'')+'>'+n+'</option>').join('')+'</select></label>'
  +'<button class="primary-button" data-action="c5-add-plan" '+(c.level<5||plans.length>=3?'disabled':'')+'>'+tr('c5AddPlan')+'</button></div>'
  +'<p class="c5-explain">'+(c.level<5?tr('c5PlanLocked'):tr('c5ChainHint'))+'</p></section>';
}
