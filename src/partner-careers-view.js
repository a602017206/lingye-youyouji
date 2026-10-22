// E4伙伴职业成长面板：选择任意已有伙伴，真实成本及职业加成同步显示。
import {SPECIES,sprite} from './data.js';
import {portraitMarkup} from './creature-portrait.js';
import {CAREERS,careerOf,careerCost} from './partner-careers.js';
const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function partnerCareersView(s,tr,icon,name,selected){
 const all=s.collection,chosen=all.find(p=>p.id===selected)??all[0];
 if(!chosen)return '';
 const career=careerOf(s,chosen.id);
 const busy=s.camp.jobs.some(j=>j.workerId===chosen.id)||s.camp.expeditions.jobs.some(j=>j.workerId===chosen.id)||s.camp.adventureRoutes.active?.workerId===chosen.id;
 const options=Object.entries(CAREERS).map(([key,data])=>{
  const cost=careerCost(s,chosen.id,key),active=career.type===key;
  const enabled=!!cost&&!busy&&s.coins>=cost.coins&&s.materials[cost.region]>=cost.materials;
  return '<article class="career-path '+(active?'career-selected':'')+'"><div class="career-path-head">'+icon(data.icon)+'<strong>'+tr('career'+key)+'</strong><span>'+ (active?career.rank+'/3':'')+'</span></div>'
   +'<p>'+tr('careerDesc'+key)+'</p>'
   +'<small>'+(cost?tr('careerCost',{coins:cost.coins,amount:cost.materials,material:tr('material'+cost.region)}):tr('careerPathLocked'))+'</small>'
   +'<button class="secondary-button" data-career-upgrade="'+chosen.id+'|'+key+'" '+(enabled?'':'disabled')+'>'+tr(active?'careerUpgrade':'careerChoose')+'</button></article>';
 }).join('');
 return '<section class="camp-section career-section" id="camp-careers"><div class="section-heading"><h2>'+icon('leaf')+tr('careerTitle')+'</h2><small>'+tr('careerSubtitle')+'</small></div>'
 +'<p>'+tr('careerIntro')+'</p>'
 +'<div class="career-picker"><label>'+tr('careerPartner')+'<select id="career-partner">'+all.map(p=>'<option value="'+esc(p.id)+'" '+(chosen.id===p.id?'selected':'')+'>'+esc(name(p.species))+' Lv.'+p.level+'</option>').join('')+'</select></label>'
 +'<div class="career-partner">'+portraitMarkup(chosen.species,name(chosen.species))
 +'<div><strong>'+esc(name(chosen.species))+'</strong><small>'+tr(SPECIES[chosen.species].type)+' · '+tr(career.type?'career'+career.type:'careerNone')+'</small>'
 +(busy?'<small>'+tr('careerBusy')+'</small>':'')+'</div></div></div>'
 +'<div class="career-paths">'+options+'</div></section>';
}
