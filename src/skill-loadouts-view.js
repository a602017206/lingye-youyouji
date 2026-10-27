// E2-B双槽实装：伙伴主动技与辅助铭文配置页面，用项目真实伙伴PNG。
import {availableActiveSkills,SUPPORT_GLYPHS,skillLoadout} from './skill-loadouts.js';
import {familySkillProfile} from './family-active-skills.js';
import {portraitMarkup} from './creature-portrait.js';
const safe=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function skillLoadoutsView(s,tr,icon,name,sprite){
 const cards=s.team.map(id=>{
  const p=s.collection.find(x=>x.id===id);if(!p)return '';
  const load=skillLoadout(s,id);
  const group=(slot,choices)=>{
   const current=load[slot];
   const buttons=[null,...Object.keys(choices)].map(key=>{
    const selected=current===key;
    const profile=familySkillProfile(s,p,key);
    const params=profile?{seconds:profile.seconds,windup:profile.windup,damage:Math.round(profile.damage*100),duration:profile.duration.toFixed(2),healing:(profile.healing*100).toFixed(2),shield:(profile.shield*100).toFixed(2)}:{};
    return '<button class="skill-slot-choice '+(selected?'selected':'')+'" data-skill-equip="'+safe(id)+'|'+slot+'|'+(key??'none')+'" aria-pressed="'+selected+'">'
     +(key?icon(choices[key].icon):icon('close'))
     +'<strong>'+tr(key?'skill'+key:'skillNone')+'</strong>'
     +'<small>'+tr(key?'skillDesc'+key:'skillNoneDesc',params)+'</small>'
     +'</button>';
   }).join('');
   return '<div class="skill-slot-group"><strong>'+tr(slot==='active'?'skillPrimarySlot':'skillSupportSlot')+'</strong><div class="skill-slot-options">'+buttons+'</div></div>';
  };
  return '<article class="skill-loadout-card" data-skill-owner="'+safe(id)+'">'
   +'<header>'+portraitMarkup(p.species,name(p.species))+'<div><strong>'+safe(name(p.species))+'</strong><small>Lv.'+p.level+'</small></div>'
   +'<span class="skill-setup-status">'+tr(load.active?'skillEquipped':'skillUnconfigured')+'</span></header>'
   +(Object.values(availableActiveSkills(p.species)).some(meta=>meta.family!==undefined)?'<p class="family-active-guide">'+tr('familyActiveGuide')+'</p>':'')
   +group('active',availableActiveSkills(p.species))+group('support',SUPPORT_GLYPHS)+'</article>';
 }).join('');
 return '<section class="camp-section skill-loadouts-section" id="camp-skill-loadouts">'
  +'<div class="section-heading"><h2>'+icon('spark')+tr('skillSlotsTitle')+'</h2>'
  +'<small>'+tr('skillSlotsHint')+'</small></div>'
  +'<p class="skill-slots-intro">'+tr('skillSlotsGuide')+'</p>'
  +'<div class="skill-auto-row"><div><strong>'+tr('skillAutoTitle')+'</strong><small>'+tr('skillAutoHint')+'</small></div>'
  +'<button class="secondary-button" data-action="skill-toggle-auto" aria-pressed="'+!!s.camp?.autoActiveSkills+'">'+tr(s.camp?.autoActiveSkills?'skillAutoOn':'skillAutoOff')+'</button></div>'
  +'<div class="skill-loadouts-grid">'+cards+'</div></section>';
}
