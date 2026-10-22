// E1远征面板：所有任务、进度、奖励与可派遣伙伴均来自真实游戏状态。
import {REGIONS,SPECIES} from './data.js';
import {portraitMarkup} from './creature-portrait.js';
import {EXPEDITION_TYPES,EXPEDITION_RESOURCES,expeditionSlots,eligibleExpeditionPartners} from './expeditions.js';
const safe=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function expeditionView(s,tr,icon,name,sprite,now=Date.now()){
 const c=s.camp,e=c.expeditions??{jobs:[],finds:[],seq:0},free=eligibleExpeditionPartners(s);
 const limit=expeditionSlots(c.level),available=e.jobs.length<limit&&free.length>0;
 const selector=id=>free.map(p=>'<option value="'+p.id+'">'+safe(name(p.species))+' Lv.'+p.level+' · '+tr(SPECIES[p.species].type)+'</option>').join('');
 const missions=e.jobs.map(job=>{
   const p=s.collection.find(x=>x.id===job.workerId),seconds=Math.max(0,Math.ceil((job.endsAt-now)/1000));
   const complete=now>=job.endsAt;
   const duration=job.endsAt-job.startedAt,progress=Math.max(0,Math.min(100,(now-job.startedAt)/duration*100));
   return '<article class="expedition-active-card" data-expedition-worker="'+safe(job.workerId)+'">'
    +portraitMarkup(p.species,name(p.species),'expedition-partner-art')
    +'<div class="expedition-job-main"><div class="expedition-job-title"><strong>'+safe(name(p.species))+'</strong>'
    +'<span>'+tr(REGIONS[job.region].name)+' · '+tr('expType'+job.kind)+'</span></div>'
    +'<small>'+tr(job.match?'expMatch':'expNotMatch')+' · '+tr(job.risk?'expRiskEvent':'expSafeEvent')+'</small>'
    +'<div class="expedition-progress" role="progressbar" aria-label="'+tr('expProgress')+'" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+Math.round(progress)+'"><i style="width:'+progress.toFixed(1)+'%"></i></div>'
    +'<small>'+tr(complete?'expReady':'expRemaining',{minutes:Math.ceil(seconds/60)})+'</small></div>'
    +'<div class="expedition-job-buttons"><button class="primary-button" data-expedition-claim="'+safe(job.workerId)+'" '+(complete?'':'disabled')+'>'+tr('expClaim')+'</button>'
    +'<button class="secondary-button" data-expedition-recall="'+safe(job.workerId)+'" '+(complete?'disabled':'')+'>'+tr('expRecall')+'</button></div></article>';
 }).join('');
 const journal=REGIONS.map((r,i)=>{
   const unlocked=i<=s.unlockedRegion,found=e.finds.includes(i);
   return '<div class="expedition-journal-item '+(found?'found':unlocked?'unfound':'locked')+'">'
    +'<span>'+icon(found?'check':unlocked?'map':'lock')+'</span><div><strong>'+tr(r.name)+'</strong>'
    +'<small>'+tr(found?'expJournalFound':unlocked?'expJournalUnknown':'expJournalLocked')+'</small></div></div>';
 }).join('');
 return '<section class="camp-section expedition-section" id="camp-expeditions">'
  +'<div class="section-heading"><h2>'+icon('map')+tr('expTitle')+'</h2><small>'+tr('expSlots',{used:e.jobs.length,max:limit})+'</small></div>'
  +'<p class="expedition-intro">'+tr('expDesc')+'</p>'
  +'<div class="expedition-overview"><div class="expedition-feature"><span>'+icon('compass')+'</span><strong>'+tr('expTypepatrol')+'</strong><small>'+tr('expPatrolHint')+'</small></div>'
  +'<div class="expedition-feature"><span>'+icon('shield')+'</span><strong>'+tr('expTypedelve')+'</strong><small>'+tr('expDelveHint')+'</small></div></div>'
  +'<div class="expedition-dispatch"><label>'+tr('expSelectPartner')+'<select id="expedition-worker" '+(available?'':'disabled')+'>'+selector()+'</select></label>'
  +'<label>'+tr('expSelectRegion')+'<select id="expedition-region" '+(available?'':'disabled')+'>'+REGIONS.filter((r,i)=>i<=s.unlockedRegion).map((r,i)=>'<option value="'+i+'">'+tr(r.name)+'</option>').join('')+'</select></label>'
  +'<label>'+tr('expSelectKind')+'<select id="expedition-kind" '+(available?'':'disabled')+'>'+Object.keys(EXPEDITION_TYPES).map(id=>'<option value="'+id+'">'+tr('expType'+id)+'</option>').join('')+'</select></label>'
  +'<button class="primary-button" data-action="expedition-start" '+(available?'':'disabled')+'>'+icon('compass')+tr('expStart')+'</button></div>'
  +'<p class="expedition-help">'+tr('expRules')+'</p>'
  +'<div class="section-heading expedition-active-heading"><h3>'+tr('expInProgress')+'</h3><small>'+tr('expDispatchCount',{count:e.seq})+'</small></div>'
  +'<div class="expedition-active-list">'+(missions||'<div class="camp-empty">'+tr('expEmpty')+'</div>')+'</div>'
  +'<div class="section-heading expedition-journal-heading"><h3>'+tr('expJournalTitle')+'</h3><small>'+tr('expJournalCount',{count:e.finds.length,total:6})+'</small></div>'
  +'<div class="expedition-journal-grid">'+journal+'</div>'
  +'</section>';
}
