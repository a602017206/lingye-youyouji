// E3奇遇路线视图：展示真实玩家数据。
import {REGIONS} from './data.js';
import {portraitMarkup} from './creature-portrait.js';
import {eligibleExpeditionPartners} from './expeditions.js';
import {ensureAdventureRoutes,routeOptions,routeReward,ADVENTURE_NODES,ADVENTURE_COST} from './adventure-routes.js';
export function adventureRoutesView(s,tr,icon,name,sprite){
 const b=ensureAdventureRoutes(s.camp),a=b.active,free=eligibleExpeditionPartners(s);
 const available=REGIONS.map((r,i)=>i).filter(i=>i<=s.unlockedRegion&&s.camp.expeditions.finds.includes(i));
 const open=available.filter(i=>b.cooldowns[i]<=Date.now());
 let controls='';
 if(!a){
  controls='<div class="route-controls"><label>'+tr('routePartner')+'<select id="route-worker">'+free.map(p=>'<option value="'+p.id+'">'+name(p.species)+'</option>').join('')+'</select></label>'
   +'<label>'+tr('routeRegion')+'<select id="route-region">'+available.map(i=>'<option value="'+i+'" '+(open.includes(i)?'':'disabled')+'>'+tr(REGIONS[i].name)+'</option>').join('')+'</select></label>'
   +'<button class="primary-button" data-action="route-start" '+(!open.length||!free.length||s.coins<ADVENTURE_COST?'disabled':'')+'>'+tr('routeDepart')+'</button></div>';
 }
 else{
  const p=s.collection.find(x=>x.id===a.workerId),reward=routeReward(s);
  controls='<div class="route-active">'+portraitMarkup(p.species,name(p.species))+'<strong>'+name(p.species)+' · '+tr(REGIONS[a.region].name)+'</strong></div>'
   +'<div class="route-steps">'+ADVENTURE_NODES.map((key,i)=>'<span class="'+(i<a.stage?'complete':i===a.stage?'current':'')+'">'+(i+1)+' · '+tr('routeNode'+key)+'</span>').join('')+'</div>'
   +(reward?'<p>'+tr('routeRewardPreview',{amount:reward.amount,item:tr('campRes'+reward.item),coins:reward.coins,material:reward.material})+'</p><button class="primary-button" data-action="route-claim">'+tr('routeClaim')+'</button>'
     :'<h3>'+tr('routeNode'+ADVENTURE_NODES[a.stage])+' · '+tr(REGIONS[a.region].name)+'</h3><p>'+tr('routeEventDesc'+ADVENTURE_NODES[a.stage])+'</p>'+'<div class="route-choices">'+routeOptions(s).map(o=>'<button data-route-choice="'+o.choice+'" '+(o.available?'':'disabled')+'><strong>'+tr('routeChoice'+o.choice)+'</strong><small>'+tr('routeChoiceDesc'+o.choice)+(o.item?' · '+tr('campRecipe'+o.item)+' ×1':'')+'</small></button>').join('')+'</div>'+'<button class="secondary-button" data-action="route-abort">'+tr('routeAbort')+'</button>');
 }
 return '<section class="camp-section route-section" id="camp-adventure-routes">'
  +'<div class="section-heading"><h2>'+icon('map')+tr('routeTitle')+'</h2><small>'+tr('routeRecord',{count:b.completed})+'</small></div>'
  +'<p>'+tr('routeIntro')+'</p>'+controls
  +'<div class="section-heading"><h3>'+tr('routeJournalTitle')+'</h3><small>'+tr('routeDiscoveryCount',{count:b.secrets.length})+'</small></div>'
  +'<div class="route-collection">'+REGIONS.map((r,i)=>'<div class="'+(b.secrets.includes(i)?'found':'')+'">'+icon(b.secrets.includes(i)?'check':'lock')
  +'<strong>'+tr(r.name)+'</strong><small>'+tr(b.secrets.includes(i)?'routeFound':available.includes(i)?'routeNotFound':'routeUnknown')+'</small></div>').join('')
  +'</div></section>';
}
