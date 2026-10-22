// E2可实际操作的伙伴战技成长：出战伙伴选择1条路线，材料不足无法升级，其他路线锁定。
import {SPECIES,REGIONS} from './data.js';
import {portraitMarkup} from './creature-portrait.js';
import {COMBAT_ROLES,combatRole,combatRoleCost,resonanceKey,RESONANCES} from './combat-tactics.js';
const safe=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function combatTacticsView(s,tr,icon,name,sprite){
 const team=s.team.map(id=>s.collection.find(p=>p.id===id)).filter(Boolean);
 const roster=team.map(p=>{
  const current=combatRole(s,p.id);
  const spec=SPECIES[p.species];
  const roles=Object.entries(COMBAT_ROLES).map(([key,info])=>{
   const cost=combatRoleCost(s,p.id,key);
   const locked=!cost||cost.coins>s.coins||cost.materials>s.materials[cost.region];
   const chosen=current.role===key;
   const costLabel=!cost?tr('combatLocked'):cost.rank===1?tr('combatFirstFree'):
     tr('combatCost',{coins:cost.coins,amount:cost.materials,material:tr('material'+cost.region)});
   return '<div class="combat-role-option '+(chosen?'selected':'')+'"><button class="secondary-button" data-combat-role="'+safe(p.id)+'|'+key+'" '+(locked?'disabled':'')+' aria-pressed="'+chosen+'">'
    +icon(info.icon)+'<strong>'+tr('combatRole'+key)+'</strong><span>'+(chosen?current.rank+'/3':tr('combatChoose'))+'</span></button>'
    +'<p>'+tr('combatRoleDesc'+key)+'</p><small>'+costLabel+'</small></div>';
  }).join('');
  return '<article class="combat-tactics-partner"><div class="combat-tactics-lead">'+portraitMarkup(p.species,name(p.species))
   +'<div><strong>'+safe(name(p.species))+'</strong><span>'+tr(spec.type)+' · Lv.'+p.level+'</span>'
   +'<small>'+tr(current.role?'combatRank':'combatUnassigned',{role:current.role?tr('combatRole'+current.role):'',rank:current.rank})+'</small></div></div>'
   +'<div class="combat-role-grid">'+roles+'</div></article>';
 }).join('');
 const active=resonanceKey(s);
 const resonanceCards=Object.entries(RESONANCES).map(([key,types])=>{
  const ready=active===key;
  return '<article class="combat-resonance-card '+(ready?'active':'')+'">'
   +'<span>'+icon(ready?'check':'spark')+'</span><div><strong>'+tr('combatResonance'+key)+'</strong>'
   +'<small>'+types.map(type=>tr(type)).join(' × ')+' · '+tr('combatResonanceDesc'+key)+'</small></div>'
   +'<em>'+tr(ready?'combatResonanceOn':'combatResonanceOff')+'</em></article>';
 }).join('');
 return '<section class="camp-section combat-tactics-section" id="camp-combat-tactics">'
  +'<div class="section-heading"><h2>'+icon('bolt')+tr('combatTacticsTitle')+'</h2><small>'+tr('combatTacticsHint')+'</small></div>'
  +'<p class="combat-tactics-intro">'+tr('combatTacticsIntro')+'</p>'
  +'<div class="combat-tactics-roster">'+roster+'</div>'
  +'<div class="section-heading combat-resonance-heading"><h3>'+tr('combatResonanceTitle')+'</h3><small>'+tr('combatResonanceTiming')+'</small></div>'
  +'<div class="combat-resonance-grid">'+resonanceCards+'</div>'
  +'<p class="combat-tactics-note">'+tr('combatWarning')+'</p></section>';
}
