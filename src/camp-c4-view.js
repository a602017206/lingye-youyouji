// C4营地：种植、加工、批量队列、自动补货与元素研习。
import { CAMP_RECIPES,PROCESS_RECIPES } from './camp-data.js';
import { TRAINING_TRACKS,trainingRanks } from './camp-training.js';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const costText=(tr,c,ingredients)=>Object.entries(ingredients).map(([k,n])=>tr('campRes'+k)+' '+(c.resources[k]??0)+'/'+n).join(' · ');
export function campC4View(s,tr,icon,name,selected){
 const c=s.camp,plots=c.level>=4?2:c.level>=2?1:0;
 const allJobs=[...(c.craft?[c.craft.id]:[]),...c.craftQueue.map(x=>x.id)];
 const member=s.collection.find(p=>p.id===selected)??s.collection[0],ranks=trainingRanks(s,member.id);
 const plotHtml=[0,1].map(i=>{
  const p=c.garden[i],locked=i>=plots,ready=p&&c.lastSettledAt>=p.endsAt;
  return '<article class="c4-garden-bed '+(locked?'camp-locked':'')+'"><div class="c4-garden-mark">'+icon('leaf')+'</div>'
   +'<div><strong>'+tr('c4GardenBed',{index:i+1})+'</strong><small>'+(locked?tr('c4GardenLocked',{level:i===0?2:4}):
     p?tr(ready?'c4GardenReady':'c4GardenGrowing',{seconds:Math.max(0,Math.ceil((p.endsAt-c.lastSettledAt)/1000))}):tr('c4GardenEmpty'))+'</small></div>'
   +'<div class="c4-garden-actions"><button class="secondary-button" data-c4-plot="'+i+'" '+(locked||c.gardenAuto?.[i]||(!p&&c.resources.seed<1)?'disabled':'')+'>'+tr(p?'c4Harvest':'c4Sow')+'</button>'
   +'<button class="secondary-button c4-auto-plot '+(c.gardenAuto?.[i]?'is-on':'')+'" data-c4-auto-plot="'+i+'" aria-pressed="'+!!c.gardenAuto?.[i]+'" '+(c.level<4?'disabled':'')+'>'+tr(c.gardenAuto?.[i]?'d2AutoGardenOn':'d2AutoGardenOff')+'</button></div></article>';
 }).join('');
 const processHtml=Object.entries(PROCESS_RECIPES).map(([id,r])=>{
  const locked=r.region>s.unlockedRegion;
  const affordable=!locked&&s.coins>=(r.coins??0)&&Object.entries(r.materials).every(([k,n])=>c.resources[k]>=n);
  return '<article class="c4-process-card"><div class="c4-process-head"><strong>'+tr('c4Process'+id)+'</strong><span>+'+r.amount+' '+tr('campRes'+r.output)+'</span></div>'
   +'<p>'+costText(tr,c,r.materials)+'</p><div class="c4-process-actions"><span>'+r.seconds+'s</span>'
   +'<button class="secondary-button" data-c4-make="'+id+'" '+(!affordable||c.craft?'disabled':'')+'>'+tr('campMake')+'</button>'
   +'<button class="secondary-button" data-c4-batch="'+id+'" data-c4-quantity="3" '+(!affordable||c.level<3?'disabled':'')+'>'+tr('c4BatchThree')+'</button></div></article>';
 }).join('');
 const trainHtml=Object.entries(TRAINING_TRACKS).map(([id,r])=>{
  const level=ranks[id],cost=Object.fromEntries(Object.entries(r.materials).map(([k,n])=>[k,n*(level+1)]));
  const disabled=level>=3||s.coins<r.coins*(level+1)||Object.entries(cost).some(([k,n])=>(c.resources[k]??0)<n);
  return '<article class="c4-training-card"><strong>'+tr('c4Train'+id)+'</strong><b>'+level+' / 3</b><p>'+tr('c4TrainDesc'+id)+'</p>'
   +'<small>'+(level>=3?tr('c4Maxed'):costText(tr,c,cost)+' · '+tr('coins')+' '+r.coins*(level+1))+'</small>'
   +'<button class="secondary-button" data-c4-train="'+id+'" '+(disabled?'disabled':'')+'>'+tr('c4TrainApply')+'</button></article>';
 }).join('');
 return '<section class="camp-section camp-c4" id="camp-c4-garden"><div class="section-heading"><h2>'+icon('leaf')+tr('c4GardenTitle')+'</h2><small>'+tr('c4GardenHint')+'</small></div>'
  +'<div class="c4-garden-list">'+plotHtml+'</div><p class="c4-note">'+tr('c4GardenRule')+' '+tr('d2AutoGardenHint')+'</p></section>'
  +'<section class="camp-section camp-c4" id="camp-c4-process"><div class="section-heading"><h2>'+icon('spark')+tr('c4ProcessTitle')+'</h2><small>'+tr('c4ProcessHint')+'</small></div>'
  +'<div class="c4-process-grid">'+processHtml+'</div>'
  +'<div class="c4-queue-status">'+tr('c4QueueStatus',{count:allJobs.length,limit:c.level>=5?6:c.level>=3?3:1})
  +'<small>'+ (allJobs.map(id=>tr(PROCESS_RECIPES[id]?'c4Process'+id:CAMP_RECIPES[id]?'campRecipe'+id:'gear'+id)).join(' → ')||tr('c4QueueIdle'))+'</small></div></section>'
  +'<section class="camp-section camp-c4" id="camp-c4-auto"><div class="section-heading"><h2>'+icon('clock')+tr('c4AutoTitle')+'</h2><small>'+tr('c4AutoHint')+'</small></div>'
  +'<div class="c4-inline-form"><label>'+tr('c4AutoProduct')+'<select id="c4-auto-product">'+Object.keys(CAMP_RECIPES).map(id=>'<option value="'+id+'" '+(c.autoTargets?.id===id?'selected':'')+'>'+tr('campRecipe'+id)+'</option>').join('')+'</select></label>'
  +'<label>'+tr('c4AutoTarget')+'<select id="c4-auto-goal">'+[0,1,2,3,5,10,20].map(n=>'<option value="'+n+'" '+(n===(c.autoTargets?.target??0)?'selected':'')+'>'+n+'</option>').join('')+'</select></label>'
  +'<button class="primary-button" data-action="c4-set-auto" '+(c.level<4||c.productionPlans?.length?'disabled':'')+'>'+tr('c4AutoSave')+'</button></div>'
  +'<p class="c4-note">'+(c.level<4?tr('c4AutoLocked'):c.autoTargets?tr('c4AutoActive',{name:tr('campRecipe'+c.autoTargets.id),count:c.autoTargets.target}):tr('c4AutoStopped'))+'</p></section>'
  +'<section class="camp-section camp-c4" id="camp-c4-training"><div class="section-heading"><h2>'+icon('shield')+tr('c4TrainingTitle')+'</h2><small>'+tr('c4TrainingHint')+'</small></div>'
  +'<div class="c4-inline-form"><label>'+tr('c4TrainingPartner')+'<select id="c4-training-partner">'+s.collection.map(p=>'<option value="'+p.id+'" '+(p.id===member.id?'selected':'')+'>'+esc(name(p.species))+' · Lv.'+p.level+'</option>').join('')+'</select></label></div>'
  +'<div class="c4-training-grid">'+trainHtml+'</div></section>';
}
