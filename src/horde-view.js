// 群潮战场UI：保留项目原有收藏、地图与设置系统。
import { SPECIES, REGIONS } from './data.js';
import {portraitMarkup} from './creature-portrait.js';
import { teamMembers, maxPartyHp } from './engine.js';
import { UPGRADE_INFO, buildSynergies } from './horde-build.js';
import {combatRole,resonanceKey} from './combat-tactics.js';
import {skillLoadout,ACTIVE_SKILLS} from './skill-loadouts.js';
import {hordeReport,scoutWarningLead} from './horde-report.js';
import {hordeArchetypeProgress} from './horde-build-archetypes.js';
import {hordeMilestones,hordeGrade} from './horde-milestones.js';
import {challengeTier,CHALLENGE_TIERS} from './horde-challenge.js';
import {hordeTutorial} from './horde-tutorial.js';
import {lessonProgress} from './horde-training-lesson.js';
export const HORDE_LABELS={
  rapid:['hordeRapid','hordeRapidDesc'],
  orbit:['hordeOrbit','hordeOrbitDesc'],
  knock:['hordeKnock','hordeKnockDesc'],
  guard:['hordeGuard','hordeGuardDesc'],
  fortune:['hordeFortune','hordeFortuneDesc'],
  regen:['hordeRegen','hordeRegenDesc'],
  swift:['hordeSwift','hordeSwiftDesc'],
  pierce:['hordePierce','hordePierceDesc'],
  harvest:['hordeHarvest','hordeHarvestDesc'],
  echo:['hordeEcho','hordeEchoDesc'],
  multishot:['hordeMultishot','hordeMultishotDesc'],
  ricochet:['hordeRicochet','hordeRicochetDesc'],
  ember:['hordeEmber','hordeEmberDesc'],
  frostbite:['hordeFrostbite','hordeFrostbiteDesc'],
  spores:['hordeSpores','hordeSporesDesc'],
  gravity:['hordeGravity','hordeGravityDesc'],
  chain:['hordeChain','hordeChainDesc'],
  burst:['hordeBurst','hordeBurstDesc'],
  vampire:['hordeVampire','hordeVampireDesc'],
  focus:['hordeFocus','hordeFocusDesc'],
  bulwark:['hordeBulwark','hordeBulwarkDesc'],
  momentum:['hordeMomentum','hordeMomentumDesc'],
  awakeningVortex:['hordeAwakeningVortex','hordeAwakeningVortexDesc'],
  awakeningNova:['hordeAwakeningNova','hordeAwakeningNovaDesc'],
};
export function hordePageMarkup(s,tr,icon){
  const skills=teamMembers(s).map((p,i)=>{
    const type=SPECIES[p.species].family%3;
    const key=['hordeSkillNeedle','hordeSkillOrbit','hordeSkillBlast'][type];
    const tactic=combatRole(s,p.id);
    return "<div>"+portraitMarkup(p.species,SPECIES[p.species].name)+"<strong>"+tr(key)+"</strong><small>"+(tactic.role?tr('combatRole'+tactic.role)+' · '+tactic.rank+'/3':tr('combatUnassigned'))+"</small></div>";
  }).join('');
  const activeButtons=teamMembers(s).map(p=>{
    const skill=skillLoadout(s,p.id).active;
    return "<button class='secondary-button' data-skill-cast='"+p.id+"' id='active-"+p.id+"' "+(skill?'':'disabled')+">"
      +"<strong>"+(skill?tr('skill'+skill):tr('skillNone'))+"</strong><small id='active-status-"+p.id+"'>"+tr('skillReady')+"</small></button>";
  }).join('');
  return "<div class='battle-card horde-card'><div class='battle-stage horde-stage' id='battle-stage' style=\"background-image:url('"+REGIONS[s.region].background+"')\">"
    +"<canvas id='horde-canvas' class='horde-canvas' role='img' aria-label='"+tr('hordeCanvasLabel')+"'></canvas>"
    +"<div class='horde-vignette'></div>"
    +"<div class='horde-boss-readout' id='horde-boss-readout' hidden><strong id='horde-boss-name'></strong><span id='horde-boss-phase'></span><small id='horde-boss-hint'></small></div>"
    +"<div class='horde-top'><span class='horde-pill'>"+icon('compass')+tr('hordeTrial')+' · '+tr(REGIONS[s.region].name)+"</span><span class='horde-pill danger' id='horde-danger'>"+tr('hordeIncoming')+"</span></div>"
    +"<div class='horde-mid-message' id='horde-end' hidden></div><div class='horde-upgrade-overlay' id='horde-choice' hidden></div>"
    +"<div class='horde-bottom'><span id='horde-time'>00:00</span><span>"+tr('hordeEnemies')+" <b id='horde-count'>0</b></span><span>"+tr('hordeKills')+" <b id='horde-kills'>0</b></span></div></div>"
    +"<div class='horde-controls'><button class='primary-button' data-action='horde-capture' id='horde-capture'>"+icon('ball')+tr('capture')+"</button>"
    +"<button class='pause-button' data-action='pause' id='horde-pause'>"+icon('pause')+tr('pause')+"</button>"
    +"<button class='ultimate-button' data-action='horde-pulse' id='horde-pulse'>"+icon('bolt')+tr('ultimate')+" <span id='horde-energy'>0/100</span></button>"
    +"<button class='pause-button' data-action='horde-mode' id='horde-mode'>"+tr('hordeHold')+"</button></div></div>"
    +"<div class='horde-supplies'><button data-action='horde-item-potion' id='horde-item-potion'>"+icon('potion')+tr('campPotion')+" <b id='horde-potion-count'>0</b><small id='horde-potion-cd'></small></button>"
    +"<button data-action='horde-item-tool' id='horde-item-tool'>"+icon('spark')+tr('campTool')+" <b id='horde-tool-count'>0</b><small id='horde-tool-cd'></small></button>"
    +"<button data-page='campWork'>"+icon('leaf')+tr('campWork')+"</button></div>"
    +"<div class='horde-metrics'><div><small>"+tr('hordeLevel')+"</small><strong id='horde-level'>1</strong></div>"
    +"<div class='horde-xp-track'><div id='horde-xp-fill'></div></div><div><small>"+tr('hordeHeroHp')+"</small><strong id='horde-hp'>100%</strong></div>"
    +"<div><small>"+tr('hordeBuild')+"</small><strong id='horde-build'>-</strong></div></div>"
    +"<div class='horde-tactics-strip'><strong>"+tr('combatResonanceTitle')+"</strong><span id='horde-tactics-status'>"+tr('combatResonanceOff')+"</span></div>"
    +"<div class='horde-synergies' id='horde-synergies'></div><div class='horde-training'><label>试炼难度 <select id='horde-tier' data-action='horde-tier'>"+CHALLENGE_TIERS.map(x=>"<option value='"+x.id+"'>"+x.name+"</option>").join('')+"</select></label><small id='horde-help'>新手提示：先选择强化，再利用移动躲避红色预警区域。</small><div id='horde-lesson' role='status'></div><button class='secondary-button' data-training-open>独立新手训练场</button></div>"
    +"<div class='horde-skill-strip'>"+skills+"</div><div class='horde-active-actions'>"+activeButtons+"</div><div class='horde-explainer'>"+tr('hordeInfo')+"</div>"
    +"<div id='ecology-panel'></div><section class='journal'><div class='section-heading'><h2>"+icon('book')+tr('logTitle')+"</h2></div>"
    +"<div class='log-list' id='log-list'></div></section>";
}
export function updateHordePanels(h,s,tr,icon){
  const $=id=>document.getElementById(id);
  if(!$('horde-canvas'))return;
  if($('horde-tier')){$('horde-tier').value=challengeTier(h).id;$('horde-tier').disabled=h.elapsed>0||h.finished;}
  const guide=$('horde-help');if(guide){const lesson=hordeTutorial(h,s);guide.textContent='提示 · '+lesson.text;}
  const training=$('horde-lesson');if(training){const progress=lessonProgress(h);training.textContent='实战教学 '+progress.done.filter(Boolean).length+'/5 · '+(progress.step?progress.step.name+'：'+progress.step.hint:'全部教学任务完成');}
  $('horde-time').textContent=String(Math.floor(h.elapsed/60)).padStart(2,'0')+':'+String(Math.floor(h.elapsed%60)).padStart(2,'0');
  $('horde-count').textContent=h.enemies.length;
  $('horde-kills').textContent=h.kills;
  $('horde-level').textContent=h.rank;
  $('horde-xp-fill').style.width=Math.min(100,h.xp/(10+h.rank*7)*100)+'%';
  $('horde-hp').textContent=Math.max(0,Math.round(s.partyHp/maxPartyHp(s)*100))+'%';
  for(const slot of ['potion','tool']){
    const key=h.supplySlots?.[slot],left=h.supplies?.[key]??0;
    const cooldown=Math.max(0,Math.ceil((slot==='potion'?30:40)-(h.elapsed-(h.itemCooldowns?.[slot]??-100))));
    $('horde-'+slot+'-count').textContent=left;
    $('horde-'+slot+'-cd').textContent=cooldown?cooldown+'s':tr('campReady');
    $('horde-item-'+slot).disabled=left<1||cooldown>0||!s.running||h.finished||!!h.pending.length;
    $('horde-item-'+slot).title=tr('campRecipe'+key);
  }
  $('horde-build').textContent=Object.entries(h.upgrades).filter(([,v])=>v>0).map(([k,v])=>tr(HORDE_LABELS[k][0])+'·'+v).join(' / ')||tr('hordeNone');
  const leading=hordeArchetypeProgress(h).filter(line=>line.owned>0).slice(0,2);
  $('horde-synergies').textContent=[...buildSynergies(h).map(k=>tr('hordeSynergy'+k)),...leading.map(line=>line.name+' '+line.owned+'/'+line.total),...hordeMilestones(h,s).filter(m=>!m.done).slice(0,1).map(m=>tr('hordeMissionLabel')+tr('hordeMission'+m.key))].join(' · ');
  const resonance=resonanceKey(s);
  $('horde-tactics-status').textContent=resonance?tr('combatResonance'+resonance)+' · '+tr('combatResonanceOn'):tr('combatResonanceOff');
  $('horde-energy').textContent=Math.round(s.energy)+'/100';
  for(const p of teamMembers(s)){
    const skill=skillLoadout(s,p.id).active,button=$('active-'+p.id),status=$('active-status-'+p.id);
    if(!button||!status)continue;
    const left=Math.max(0,Math.ceil((h.activeCooldowns?.[p.id]??0)-h.elapsed));
    const available=!!skill&&s.running&&!h.finished&&!h.pending.length&&left===0;
    button.disabled=!available;
    status.textContent=!skill?tr('skillNotSet'):left?tr('skillCooldown',{seconds:left}):tr('skillReady');
  }
  $('horde-danger').title=scoutWarningLead(s)>0?tr('hordeScoutWarning',{seconds:scoutWarningLead(s).toFixed(2)}):'';
  $('horde-danger').textContent=h.dangerMarkers?.length?tr('hordeWarningCount',{count:h.dangerMarkers.length}):h.bossStarted?tr('hordeBossLive'):h.elapsed>65?tr('hordeSurge'):tr('hordeIncoming');
  const bossHud=$('horde-boss-readout');
  bossHud.hidden=!h.bossStarted||h.finished;
  if(!bossHud.hidden){
    $('horde-boss-name').textContent=tr('bossMechanic'+s.region);
    $('horde-boss-phase').textContent=tr('bossPhase'+(h.bossPhase||1));
    $('horde-boss-hint').textContent=tr('bossPattern'+s.region);
  }
  $('horde-pause').innerHTML=icon(s.running?'pause':'play')+tr(s.running?'pause':'resume');
  $('horde-mode').textContent=tr(h.moveMode==='hold'?'hordeAuto':'hordeHold');
  $('horde-pulse').disabled=s.energy<100||h.finished||!s.running||!!h.pending.length;
  $('horde-capture').disabled=h.finished||!s.running||s.balls<1||!!h.pending.length;
  const choice=$('horde-choice');choice.hidden=!h.pending.length;
  if(h.pending.length){
    choice.innerHTML='<h3>'+tr('hordeChoose')+'</h3><p>'+tr('hordeChooseHint')+'</p><div class="horde-options">'
      +h.pending.map(key=>'<button class="horde-rarity-'+UPGRADE_INFO[key].rarity+'" data-horde-upgrade="'+key+'"><span>'+tr('hordeRarity'+UPGRADE_INFO[key].rarity)+'</span><strong>'+tr(HORDE_LABELS[key][0])+'</strong><small>'+tr(HORDE_LABELS[key][1])+'</small><em>'+tr('hordeRank')+' '+(h.upgrades[key]+1)+'/'+UPGRADE_INFO[key].maxRank+'</em></button>').join('')+'</div>';
  }
  const end=$('horde-end');end.hidden=!h.finished;
  if(h.finished){const report=hordeReport(h,s);end.innerHTML='<h2>'+tr(h.defeated?'hordeLost':'hordeVictory')+'</h2><p>'+tr('hordeResult',{kills:h.kills})+'</p><div class="horde-report"><span>'+tr('hordeReportTime')+' '+report.seconds+'s</span><span>'+tr('hordeGrade')+' '+(report.grade??'-')+'</span><span>'+tr('hordeReportDamage')+' '+report.damage+'</span><span>'+tr('hordeReportSignatures')+' '+report.signatures+'</span><span>'+tr('hordeReportDodges')+' '+report.dodges+'</span><span>'+tr('hordeReportResonance')+' '+report.resonance+'</span><span>'+tr('hordeReportSupport')+' '+(report.workCount+report.exploreCount)+'</span></div><div class="horde-report-contributions"><strong>'+tr('hordePartnerContributionTitle')+'</strong>'+report.partners.entries.map(row=>'<span>'+SPECIES[row.species].name+' · '+tr('hordeReportDamage')+' '+row.damage+' / '+tr('hordeSupportHealing')+' '+Math.round(row.healing)+' / '+tr('hordeSupportShield')+' '+Math.round(row.shield)+' / '+tr('hordeSupportControl')+' '+row.control+'</span>').join('')+'<span>'+tr('hordeUnattributed')+' · '+report.partners.unattributed+'</span></div><button class="primary-button" data-action="horde-retry">'+tr('hordeRetry')+'</button>';}
}
