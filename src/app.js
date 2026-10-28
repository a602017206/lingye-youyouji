import { SPECIES, REGIONS, EVOLUTION_LINES, BOSS_WINS, sprite } from './data.js';
import * as game from './engine.js';
import { t, creatureName } from './i18n.js';
import { readSave, writeSaveDetailed } from './storage.js';
import { THEMES, applyTheme } from './theme.js';
import { secondaryView, ecologyView } from './views.js';
import {closeDexStage,openDexStage} from './dex-stage.js';
import {openDexAnimation,closeDexAnimation,selectDexAnimationAction} from './dex-animation-preview.js';
import {LAYER_ACTIONS} from './creature-layer-animation.js';
import {stageEvolutionLine} from './dex-stage-theme.js';
import {claimDexResearch} from './dex-research.js';
import {claimJourneyItem,equipJourneyRelic,claimCurioResearch,journeyItem,CURIO_RESEARCH_REWARD} from './journey-collections.js';
import {handleCampArtError} from './art-registry.js';
import {creditSupport} from './horde-support-metrics.js';
import { createHorde, stepHorde, serializeHorde, chooseHordeUpgrade, triggerHordePulse, captureHordeTarget, setHordeDirection, useHordeSupply, returnUnusedSupplies,castHordeActive } from './horde.js';
import { renderHordeCanvas } from './horde-render.js';
import {releaseCreatureAnimations,clearCreatureAnimations} from './creature-animation-resources.js';
import {setChallengeTier} from './horde-challenge.js';
import {createTrainingArena,trainingAction,trainingArenaMarkup,stepTrainingArena} from './training-arena.js';
import { hordePageMarkup, updateHordePanels } from './horde-view.js';
import { ensureCamp,settleCamp,assignCampJob,removeCampJob,startCraft,upgradeCamp,selectCampLoadout,setCampPaused } from './camp-engine.js';
import { campView } from './camp-view.js';
import { addProductionPlan,removeProductionPlan,setProductionEnabled,upgradeCampFacility } from './camp-engine.js';
import { enqueueCraft,plantGarden,harvestGarden,setAutoTarget,setGardenAuto } from './camp-engine.js';
import { trainCompanion } from './camp-training.js';
import { equipItem,unequipItem } from './equipment.js';
import { startExpedition,claimExpedition,recallExpedition } from './expeditions.js';
import {startAdventureRoute,chooseAdventurePath,claimAdventureRoute,abortAdventureRoute} from './adventure-routes.js';
import { chooseCombatRole } from './combat-tactics.js';
import { setSkillSlot } from './skill-loadouts.js';
import {trainCareer} from './partner-careers.js';
import {createMusicPlayer,musicTrackFor} from './background-music.js';
import {musicSettingsMarkup,updateMusicControls} from './music-view.js';

const paths = {
  leaf: '<path d="M20 4C10 2 3 7 5 16c7 3 15-2 15-12Z"/><path d="m4 21 11-11"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="m16 8-3 5-5 3 3-5 5-3Z"/>',
  ball: '<path d="m12 2 8 10-8 10L4 12 12 2Z"/><path d="M12 6v12M8 12h8"/>',
  map: '<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6ZM9 3v15m6-12v15"/>',
  book: '<path d="M12 5c-3-2-7-2-10-1v15c4-1 7-1 10 1 3-2 6-2 10-1V4c-4-1-7-1-10 1Zm0 0v15"/>',
  bag: '<rect x="5" y="6" width="14" height="15" rx="4"/><path d="M9 6V4a3 3 0 0 1 6 0v2M5 13h14m-10 0v3m6-3v3"/>',
  trophy: '<path d="M8 3h8v7a4 4 0 0 1-8 0V3Zm0 2H4v3a4 4 0 0 0 4 4m8-7h4v3a4 4 0 0 1-4 4m-4 2v6m-4 1h8"/>',
  settings: '<path d="m9 3-1 3-3 1-2 4 2 3v3l4 3 3-1 3 1 4-3v-3l2-3-2-4-3-1-1-3H9Z"/><circle cx="12" cy="12" r="3"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 1 1 4 3c-1 0-1 1-1 2m0 3h.01"/>',
  arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1"/>',
  pause: '<path d="M9 5v14m6-14v14"/>',
  play: '<path d="m8 4 12 8-12 8V4Z"/>',
  bolt: '<path d="m13 2-9 12h7l-1 8 10-13h-7V2Z"/>',
  coin: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><path d="M12 9v6"/>',
  heart: '<path d="M20 4c-3-2-6-1-8 2-2-3-5-4-8-2-6 5 2 12 8 17 6-5 14-12 8-17Z"/>',
  shield: '<path d="m12 2 8 4v6c0 5-8 10-8 10S4 17 4 12V6l8-4Z"/>',
  check: '<path d="m5 12 4 4L20 5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  save: '<path d="M4 3h13l4 4v14H3V3h1Zm3 0v7h10V3M7 21v-7h10v7"/>',
  potion: '<path d="M9 2h6v5l4 7v7H5v-7l4-7V2Zm-4 12h14M9 18h6m-3-3v6"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V6a4 4 0 0 1 8 0v4m-4 5v3"/>',
  spark: '<path d="m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7Z"/>',
};
const icon = (name, cls = '') => `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] ?? paths.leaf}</svg>`;
const loaded = readSave();
let state = loaded.state ?? game.createGame();
// 本地开发阶段只保存当前格式；启动时的资源变化和离线收益即时落盘。
const bootSignature=s=>JSON.stringify({
  resources:s.camp?.resources,consumables:s.camp?.consumables,
  craft:s.camp?.craft,queue:s.camp?.craftQueue,equipment:s.camp?.equipment,
  expeditions:s.camp?.expeditions,adventureRoutes:s.camp?.adventureRoutes,combatRoles:s.camp?.combatRoles,
  skillLoadouts:s.camp?.skillLoadouts,autoActiveSkills:s.camp?.autoActiveSkills,
  hordeSupplies:s.hordeRun?.supplies??null,
});
const beforeBoot=bootSignature(state);
ensureCamp(state,Date.now());settleCamp(state);
let horde = createHorde(state, state.hordeRun);
// 当前本地保存包含局内补给快照，避免初次进入战斗时遗漏道具。
state.hordeRun=serializeHorde(horde);
const offline = loaded.state ? game.settleOffline(state) : { coins: 0 };
const bootChanged=beforeBoot!==bootSignature(state)||offline.coins>0||offline.xp>0||offline.materials>0;
let page = 'adventure';
let selectedTraining=null;
let selectedCareer=null;
let warehouseFilter='all';
let modal = null;
let choiceStarted = Date.now();
let choiceActive = false;
let toastTimer;
let lastTick = performance.now();
let lastSaved = Date.now();
let saveHealthy=loaded.state&&!bootChanged?true:writeSaveDetailed(state).ok;
const $ = selector => document.querySelector(selector);
const tr = (key, params = {}) => t(key, params, state.settings.locale);
const music = createMusicPlayer({
  createAudio: () => {
    const audio = document.createElement('audio');
    audio.id = 'background-music-audio'; audio.hidden = true;
    document.body.append(audio); return audio;
  },
  onChange: value => updateMusicControls(value,tr),
});
function syncMusic() { music.select(musicTrackFor(page,horde,!!document.querySelector('#standalone-training'))); }
const name = id => creatureName(id, state.settings.locale);
const num = n => Math.floor(n).toLocaleString(state.settings.locale);
const img = (id, cls = '') => sprite(id)
  ? `<img class="creature ${cls}" src="${sprite(id)}" alt="${name(id)}" draggable="false" />`
  : `<span class="creature creature-art-pending ${cls}" role="img" aria-label="${name(id)}">${name(id)}<small>${tr('artPending')}</small></span>`;
const pct = (n, max) => Math.max(0, Math.min(100, n / max * 100));
const navItems = [['adventure', 'compass'], ['campWork', 'leaf'], ['collection', 'ball'], ['map', 'map'], ['dex', 'book'], ['bag', 'bag'], ['achievements', 'trophy']];
const esc = str => String(str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
function toast(key, params) {
  $('#toast').textContent = tr(key, params);
  $('#toast').classList.add('visible');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 3500);
}
function persist(notify = false) {
  settleCamp(state);
  if (horde.region === state.region) state.hordeRun = serializeHorde(horde);
  const result=writeSaveDetailed(state);
  saveHealthy=result.ok;lastSaved=Date.now();
  if (notify || !saveHealthy) toast(saveHealthy ? 'saved' : 'saveFail');
}
function shell() {
  if(page!=='adventure')releaseCreatureAnimations('horde');
  // 整页重建时释放旧列表引用，避免切回战场后仍保留整页伙伴节点。
  secondarySnapshot=undefined;
  applyTheme(state);
  document.documentElement.lang = state.settings.locale;
  document.title = tr('title');
  document.body.classList.toggle('reduced-motion', state.settings.reducedMotion);
  $('#app').innerHTML = `
    <aside class="sidebar">
      <a class="brand" href="#adventure" aria-label="${tr('title')}"><span class="brand-emblem">${icon('leaf')}</span><span><strong>${tr('brand')}</strong><small>${tr('brandSub')}</small></span></a>
      <div class="sidebar-label">${tr('camp')}</div>
      <nav aria-label="${tr('camp')}">${navItems.map(([key, symbol]) => `<button class="nav-item ${page === key ? 'active' : ''}" data-page="${key}" ${page === key ? 'aria-current="page"' : ''}>${icon(symbol)}<span>${tr(key)}</span>${key === 'adventure' ? '<i class="nav-dot"></i>' : ''}</button>`).join('')}</nav>
      <div class="sidebar-bottom"><div class="camp-note"><span class="little-leaf">${icon('leaf')}</span><strong>${tr('notice')}</strong><p>${tr('tip')}</p><span class="note-dots">· · ·</span></div><button class="nav-item" data-action="guide">${icon('help')}${tr('guide')}</button><button class="nav-item" data-action="settings">${icon('settings')}${tr('settings')}</button><div class="sidebar-footer"><span class="status-dot"></span>${tr('local')}</div></div>
    </aside>
    <div class="app-body">
      <header class="topbar"><div class="trainer"><div class="trainer-avatar">${img(101)}</div><div><strong>${tr('trainerName')}<span class="trainer-tag">${tr('trainer')}</span></strong><small>${tr('greeting')} ${icon('sun')}</small></div></div><div class="resources" id="resources"></div><button class="icon-button music-button" data-action="music-toggle" aria-label="${tr('musicEnable')}"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18V5l11-2v13M9 8l11-2"/><ellipse cx="6" cy="18" rx="3" ry="2"/><ellipse cx="17" cy="16" rx="3" ry="2"/></svg></button><button class="icon-button save-button" data-action="save" title="${tr('save')}" aria-label="${tr('save')}">${icon('save')}</button><button class="icon-button mobile-settings" data-action="settings" title="${tr('settings')}" aria-label="${tr('settings')}">${icon('settings')}</button></header>
      <main class="layout"><section class="workspace"><div id="page-heading"></div><div id="page-content"></div></section><aside class="team-column" id="team-panel"></aside></main>
      <footer class="app-footer"><span>${icon('leaf')}${tr('footerTip')}</span><span id="save-status"></span></footer>
    </div>`;
  renderPage();
  syncMusic(); updateMusicControls(music.snapshot(),tr);
}
function heading(title, subtitle, eyebrow) {
  return `<div class="page-heading"><div><div class="eyebrow">${icon('compass')}${eyebrow ?? tr('today')}</div><h1>${title}</h1><p>${subtitle}</p></div><button class="quiet-button region-select" data-page="map">${icon('map')}${tr(REGIONS[state.region].name)}${icon('down')}</button></div>`;
}
function renderPage() {
  const heads = {
    adventure: ['heading', 'subtitle'], campWork:['campPageHeading','campPageDesc'], collection: ['collectionTitle', 'collectionDesc'], map: ['mapTitle', 'mapDesc'],
    dex: ['dexTitle', 'dexDesc'], bag: ['bagTitle', 'bagDesc'], achievements: ['achievementsTitle', 'achievementsDesc'],
  };
  $('#page-heading').innerHTML = heading(tr(heads[page][0]), tr(heads[page][1]), tr(page));
  if (page === 'adventure') renderAdventure();
  else renderSecondary();
  renderResources(); renderTeam();
}
function renderResources() {
  $('#resources').innerHTML = `<span class="resource coins">${icon('coin')}<strong>${num(state.coins)}</strong><small>${tr('coins')}</small></span><span class="resource">${icon('ball', 'ball-icon')}<strong>${num(state.balls)}</strong><small>${tr('balls')}</small></span><span class="resource badges">${icon('shield')}<strong>${state.badges}</strong><small>${tr('badges')}</small></span>`;
  $('#save-status').innerHTML = `${icon(saveHealthy ? 'check' : 'help')}${tr(saveHealthy?'saveReady':'saveFail')} · ${tr('saveVersion',{version:state.version})}`;
}
function renderAdventure() {
  if (horde.region !== state.region) horde = createHorde(state, state.hordeRun);
  $('#page-content').innerHTML = hordePageMarkup(state, tr, icon);
  updateHordePanels(horde, state, tr, icon); renderEcology(); renderLogs();
}
function renderLogs() {
  $('#log-list').innerHTML = state.logs.slice(0, 4).map((log, index) => {
    const params = { ...log.params };
    if ('species' in params) params.species = name(params.species);
    if ('region' in params) params.region = tr(REGIONS[params.region]?.name ?? 'forest');
    if ('upgrade' in params) params.upgrade = tr(params.upgrade);
    return `<div class="log-entry ${index === 0 ? 'latest' : ''}"><span class="log-dot"></span><time>${new Date(log.at).toLocaleTimeString(state.settings.locale, { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Shanghai' })}</time><p>${esc(tr(log.key, params))}</p>${index === 0 ? icon('leaf') : ''}</div>`;
  }).join('');
}
function renderTeam() {
  $('#team-panel').innerHTML = `<div class="section-heading team-heading"><h2>${tr('yourTeam')}<small>${tr('teamCount', { count: state.team.length })}</small></h2><button class="text-button" data-page="collection">${tr('editTeam')}${icon('arrow')}</button></div><div class="team-cards">${game.teamMembers(state).map((p, i) => partnerCard(p, i)).join('')}</div><div class="team-summary"><div><span>${icon('bolt')}${tr('teamPower')}</span><strong>${game.power(state)}</strong></div><div><span>${icon('heart')}${tr('partyHp')}</span><strong>${Math.ceil(state.partyHp)}<small> / ${Math.round(game.maxPartyHp(state))}</small></strong></div><div class="health-bar party-health"><i style="width:${pct(state.partyHp, game.maxPartyHp(state))}%"></i></div><p>${tr('teamNote')}</p></div><div class="buff-panel"><div class="section-heading"><h3>${icon('spark')}${tr('buffs')}</h3><span>${Object.values(state.buffs).reduce((sum, n) => sum + n, 0)}</span></div>${Object.values(state.buffs).some(Boolean) ? `<div class="buff-list">${Object.entries(state.buffs).filter(([, n]) => n).map(([key, n]) => `<span title="${tr(`${key}Desc`)}">${tr(key)}<b>×${n}</b></span>`).join('')}</div>` : `<p>${tr('noBuffs')}</p>`}</div><div class="rest-card">${img(104)}<div><strong>${tr('nextArea')}</strong><p>${tr('nextStep')}</p></div></div>`;
}
function partnerCard(p, i) {
  const data = SPECIES[p.species];
  return `<article class="partner-card type-${data.type}"><div class="partner-top"><span class="slot-label">0${i + 1}</span><span class="type-tag">${tr(data.type)}</span></div><div class="partner-main"><div class="partner-art">${img(p.species)}</div><div><h3>${name(p.species)}</h3><span class="partner-level">${tr('levelValue', { level: p.level })}</span><div class="xp-bar"><i style="width:${pct(p.xp, game.xpToLevel(p.level))}%"></i></div></div></div><div class="partner-actions"><span>${icon('bolt')}${Math.round(game.creatureAttack(p,state))}</span><button data-train="${p.id}" class="train-button" ${state.coins < game.trainCost(p) || p.level >= 100 ? 'disabled' : ''} title="${tr('trainingCost', { coins: game.trainCost(p) })}">${tr('train')}<span>${icon('coin')}${game.trainCost(p)}</span>${icon('arrow')}</button></div></article>`;
}
let secondarySnapshot;
function renderSecondary() {
  const host=$('#page-content');
  const markup=page==='campWork'?campView(state,tr,icon,img,name,selectedTraining,warehouseFilter,selectedCareer):secondaryView({ page, state, tr, name, img, icon, num });
  // 内容未变时保留原节点，避免长图鉴和收藏列表每秒被重建而跳回顶部。
  if(secondarySnapshot?.host===host&&secondarySnapshot.page===page&&secondarySnapshot.markup===markup&&secondarySnapshot.first===host.firstElementChild)return;
  const position={left:scrollX,top:scrollY,behavior:'instant'};
  const open = [...document.querySelectorAll('.route-details[open]')].map(el => el.dataset.route);
  host.innerHTML = markup;
  for (const id of open) document.querySelector(`.route-details[data-route="${id}"]`)?.setAttribute('open', '');
  secondarySnapshot={host,page,markup,first:host.firstElementChild};
  window.scrollTo(position);
}
function dismissDexStage(){
  closeDexStage();closeDexAnimation();
  document.querySelectorAll('.dex-stage-overlay').forEach(root=>root.remove());
}
function renderDexPreview(root){
  closeDexStage();closeDexAnimation();
  const host=root.querySelector('.dex-stage-canvas'),id=Number(root.dataset.species),mode=root.dataset.mode;
  host.replaceChildren();delete host.dataset.art;delete host.dataset.error;
  root.querySelector('.dex-animation-actions').hidden=mode!=='animation';
  root.querySelector('.dex-animation-status').hidden=mode!=='animation';
  root.querySelector('[data-dex-hint]').textContent=tr(mode==='animation'?'dexAnimationHint':'dexStageHint');
  root.querySelectorAll('[data-dex-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.dexMode===mode)));
  if(mode==='portrait'){openDexStage(id,host);return;}
  openDexAnimation(id,host,{action:root.dataset.action,reduced:!!state.settings.reducedMotion,label:name(id),onStatus:status=>{root.querySelector('.dex-animation-status').textContent=tr('dexArt'+status);}});
}
function navigatePage(nextPage){
  dismissDexStage();page=nextPage;shell();
  window.scrollTo({left:0,top:0,behavior:'instant'});
}
function renderEcology() {
  const focusedDepth = document.activeElement?.id === 'depth-select';
  if (!focusedDepth) $('#ecology-panel').innerHTML = ecologyView({ state, tr, icon, num });
}
function refresh() {
  applyTheme(state);
  renderResources(); renderTeam();
  if (page === 'adventure') { updateHordePanels(horde, state, tr, icon); renderEcology(); renderLogs(); }
  else if(page==='campWork') { if(!['camp-worker','camp-job','camp-loadout-potion','camp-loadout-tool','c4-auto-product','c4-auto-goal','c4-training-partner','c5-plan-recipe','c5-plan-goal','expedition-worker','expedition-region','expedition-kind'].includes(document.activeElement?.id) && !document.activeElement?.hasAttribute('data-gear-owner'))renderSecondary(); }
  else renderSecondary();
}
function openModal(type) {
  modal = type;
  const title = tr(type === 'settings' ? 'settingsTitle' : type === 'guide' ? 'helpTitle' : type === 'offline' ? 'offlineTitle' : 'resetTitle');
  let body = '';
  if (type === 'settings') body = `<div class="settings-row"><div><strong>${tr('language')}</strong></div><select id="language-select" aria-label="${tr('language')}"><option value="zh-CN" ${state.settings.locale === 'zh-CN' ? 'selected' : ''}>${tr('simplified')}</option><option value="zh-TW" ${state.settings.locale === 'zh-TW' ? 'selected' : ''}>${tr('traditional')}</option></select></div><div class="settings-row"><div><strong>${tr('theme')}</strong><p>${tr('themeDesc')}</p></div><select id="theme-select" aria-label="${tr('theme')}"><option value="auto" ${state.settings.theme === 'auto' ? 'selected' : ''}>${tr('themeAuto')}</option>${Object.keys(THEMES).map(key => `<option value="${key}" ${state.settings.theme === key ? 'selected' : ''}>${tr(key)}</option>`).join('')}</select></div><label class="settings-row"><div><strong>${tr('autoExplore')}</strong><p>${tr('autoExploreDesc')}</p></div><input type="checkbox" data-setting="autoExplore" ${state.settings.autoExplore ? 'checked' : ''}></label><label class="settings-row"><div><strong>${tr('autoHeal')}</strong><p>${tr('autoHealDesc')}</p></div><input type="checkbox" data-setting="autoHeal" ${state.settings.autoHeal ? 'checked' : ''}></label><label class="settings-row"><div><strong>${tr('autoUpgrade')}</strong><p>${tr('autoUpgradeDesc')}</p></div><input type="checkbox" data-setting="autoUpgrade" ${state.settings.autoUpgrade ? 'checked' : ''}></label><label class="settings-row"><div><strong>${tr('reducedMotion')}</strong><p>${tr('reducedMotionDesc')}</p></div><input type="checkbox" data-setting="reducedMotion" ${state.settings.reducedMotion ? 'checked' : ''}></label><p class="save-description">${tr('saveDesc')}</p><div class="settings-actions"><button class="primary-button" data-action="save">${icon('save')}${tr('save')}</button><button class="secondary-button" data-action="export">${tr('export')}</button><button class="secondary-button" data-action="import">${tr('import')}</button></div><button class="guide-link" data-action="guide">${icon('help')}${tr('guide')}</button><button class="reset-button" data-action="reset">${tr('reset')}</button><input type="file" id="import-input" accept="application/json,.json" hidden>`;
  if (type === 'guide') body = `<p class="guide-intro">${tr('helpIntro')}</p>${['Battle', 'Upgrade', 'Capture', 'Offline', 'Boss'].map((key, i) => `<div class="guide-row"><span>0${i + 1}</span><div><h3>${tr(`help${key}`)}</h3><p>${tr(`help${key}Desc`)}</p></div></div>`).join('')}`;
  if (type === 'offline') body = `<div class="offline-art">${img(101)}${img(107)}${img(113)}</div><p class="center">${tr('offlineDesc')}</p><p class="offline-duration">${icon('clock')}${tr('offlineTime', { hours: Math.floor(offline.seconds / 3600), minutes: Math.floor(offline.seconds / 60) % 60 })}</p><div class="offline-rewards"><div>${icon('coin')}<strong>+${num(offline.coins)}</strong><span>${tr('coins')}</span></div><div>${icon('spark')}<strong>+${num(offline.xp)}</strong><span>${tr('offlineXp')}</span></div></div><p class="center">${tr('offlineMaterial')} · ${tr(`material${offline.region ?? state.region}`)} +${offline.materials ?? 0}</p><button class="primary-button wide" data-action="close">${tr('continue')}${icon('arrow')}</button>`;
  if (type === 'reset') body = `<p>${tr('resetDesc')}</p><div class="settings-actions"><button class="secondary-button" data-action="close">${tr('cancel')}</button><button class="danger-button" data-action="confirmReset">${tr('confirmReset')}</button></div>`;
  if (type === 'settings') body = musicSettingsMarkup(tr) + body;
  $('#modal-root').innerHTML = `<div class="modal-backdrop"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" tabindex="-1"><button class="icon-button modal-close" data-action="close" aria-label="${tr('close')}">${icon('close')}</button><span class="modal-emblem">${icon(type === 'settings' ? 'settings' : type === 'guide' ? 'compass' : 'leaf')}</span><h2 id="modal-title">${title}</h2>${body}</section></div>`;
  updateMusicControls(music.snapshot(),tr);
  $('.modal').focus();
}
function closeModal() { modal = null; $('#modal-root').innerHTML = ''; (window.matchMedia('(max-width:760px)').matches ? $('.mobile-settings') : $('[data-action="settings"]'))?.focus(); }
function animateAttack() {
  if (page !== 'adventure' || !state.running || state.choices.length) return;
  const stage = $('#battle-stage');
  stage.classList.remove('attack-tick'); void stage.offsetWidth; stage.classList.add('attack-tick');
  $('#damage-number').textContent = `−${state.lastDamage ?? game.power(state)}`;
}
function handleAction(action) {
  if (action === 'music-toggle' || action === 'music-retry') {
    const value=music.snapshot();
    if(action==='music-retry'||!value.enabled||['waiting','error'].includes(value.status))music.enable();
    else music.disable();
    return;
  }
  if (action === 'pause') { state.running = !state.running; lastTick = performance.now(); persist(); }
  if (action === 'speed') { state.settings.speed = state.settings.speed === 1 ? 2 : 1; applyTheme(state); persist(); }
  if (action === 'horde-pulse') { if(triggerHordePulse(horde, state))persist();refresh(); return; }
  if (action === 'horde-item-potion'||action==='horde-item-tool') {
    toast(useHordeSupply(horde,state,action==='horde-item-potion'?'potion':'tool')?'campItemUsed':'campItemUnavailable');persist();refresh();return;
  }
  if(action==='c5-add-plan'){
    toast(addProductionPlan(state,$('#c5-plan-recipe')?.value,Number($('#c5-plan-goal')?.value))?'c5PlanAdded':'c5PlanFailed');persist();refresh();return;
  }
  if(action==='c5-toggle-plans'){
    toast(setProductionEnabled(state,!state.camp.productionEnabled)?'c5PlanChanged':'c5PlanFailed');persist();refresh();return;
  }
  if (action === 'camp-pause') {setCampPaused(state,!state.camp.paused);persist();refresh();return;}
  if(action==='c4-set-auto'){
    toast(setAutoTarget(state,$('#c4-auto-product')?.value,Number($('#c4-auto-goal')?.value))?'c4AutoSaved':'campNotEnough');persist();refresh();return;
  }
  if(action==='skill-toggle-auto'){
    state.camp.autoActiveSkills=!state.camp.autoActiveSkills;
    toast(state.camp.autoActiveSkills?'skillAutoOn':'skillAutoOff');persist();refresh();return;
  }
  if(action==='route-start'){
    const ok=startAdventureRoute(state,$('#route-worker')?.value,Number($('#route-region')?.value));
    toast(ok?'routeStarted':'routeStartFailed');persist();refresh();return;
  }
  if(action==='route-claim'){
    const reward=claimAdventureRoute(state);
    toast(reward?'routeClaimed':'routeClaimFailed',reward?{amount:reward.amount,item:tr('campRes'+reward.item),coins:reward.coins}:{});
    persist();refresh();return;
  }
  if(action==='route-abort'){
    toast(abortAdventureRoute(state)?'routeAborted':'routeAbortFailed');persist();refresh();return;
  }
  if(action==='expedition-start'){
    const ok=startExpedition(state,$('#expedition-worker')?.value,Number($('#expedition-region')?.value),$('#expedition-kind')?.value);
    toast(ok?'expSent':'expSendFailed');persist();refresh();return;
  }
  if (action === 'camp-assign') {toast(assignCampJob(state,$('#camp-worker')?.value,$('#camp-job')?.value)?'campAssigned':'campAssignFailed');persist();refresh();return;}
  if (action === 'camp-upgrade') {toast(upgradeCamp(state)?'campUpgraded':'campNotEnough');persist();refresh();return;}
  if (action === 'camp-prepare-run') {returnUnusedSupplies(horde,state);horde=createHorde(state);persist();page='adventure';shell();return;}
  if (action === 'horde-mode') { horde.moveMode = horde.moveMode==='hold'?'auto':'hold'; setHordeDirection(horde,0,0); refresh(); return; }
  if (action === 'horde-capture') {
    const result = captureHordeTarget(horde, state);
    toast(result === 'success' ? 'captured' : result === 'noTarget' ? 'hordeNoTarget' : result === 'unavailable' ? 'needBalls' : 'captureFailed');
    persist(); refresh(); return;
  }
  if (action === 'horde-retry') {
    state.wins = 0; state.partyHp = game.maxPartyHp(state); state.energy = 30;
    returnUnusedSupplies(horde,state);horde = createHorde(state); persist(); shell(); return;
  }
  if (action === 'capture') {
    if (!state.balls) return toast('needBalls');
    const result = game.capture(state);
    toast(result ? 'captured' : 'captureFailed');
  }
  if (action === 'ultimate' && game.ultimate(state)) $('#battle-stage')?.classList.add('ultimate-flash');
  if (action === 'boss') game.challengeBoss(state);
  if (action === 'heal') {
    const before=Math.max(0,state.partyHp),used=game.heal(state);
    if(used&&!horde.finished)creditSupport(horde,null,'healing',Math.max(0,state.partyHp)-before);
    toast(used?'healed':'noHeal');if(used)persist();
  }
  if (action === 'save') persist(true);
  if (action === 'settings' || action === 'guide') { openModal(action); return; }
  if (action === 'close') { closeModal(); return; }
  if (action === 'reset') { openModal('reset'); return; }
  if (action === 'confirmReset') { state = game.createGame();ensureCamp(state);horde = createHorde(state); offline.coins = 0; page = 'adventure'; persist(); closeModal(); shell(); return; }
  if (action === 'export') {
    persist();
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href = url; link.download = `${tr('exportName')}-${new Date().toISOString().slice(0, 10)}.json`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  if (action === 'import') $('#import-input').click();
  refresh();
}
document.addEventListener('click', event => {
  if(event.target.closest('[data-training-open]')){
    releaseCreatureAnimations('horde');
    const arena=createTrainingArena(),root=document.createElement('div');
    root.id='standalone-training';root.style.cssText='position:fixed;inset:0;z-index:500;background:rgba(0,0,0,.88);overflow:auto;padding:3vh max(3vw,12px)';
    const draw=()=>{root.innerHTML=trainingArenaMarkup(arena);renderHordeCanvas(root.querySelector('#training-canvas'),arena.horde,arena.state);};
    const keys=new Set();
    const direction=()=>{const x=Number(keys.has('ArrowRight')||keys.has('KeyD'))-Number(keys.has('ArrowLeft')||keys.has('KeyA')),y=Number(keys.has('ArrowDown')||keys.has('KeyS'))-Number(keys.has('ArrowUp')||keys.has('KeyW'));trainingAction(arena,x||y?'move':'stop',{x,y});};
    const keydown=e=>{if(e.key==='Escape'){close();return;}if(['ArrowRight','ArrowLeft','ArrowUp','ArrowDown','KeyW','KeyA','KeyS','KeyD'].includes(e.code)){e.preventDefault();keys.add(e.code);direction();}};
    const keyup=e=>{keys.delete(e.code);direction();};
    const close=()=>{root.remove();releaseCreatureAnimations('training');window.removeEventListener('keydown',keydown,true);window.removeEventListener('keyup',keyup,true);};
    root.addEventListener('click',e=>{
      if(e.target.closest('[data-training-close]')){close();return;}
      if(e.target.closest('[data-training-restart]'))trainingAction(arena,'restart');
      if(e.target.closest('[data-training-skip]'))trainingAction(arena,'skip');
      if(e.target.closest('[data-training-skill]'))trainingAction(arena,'skill');
      const upgrade=e.target.closest('[data-training-upgrade]')?.dataset.trainingUpgrade;
      if(upgrade)trainingAction(arena,'upgrade',upgrade);
      draw();
    });
    const point=e=>{const canvas=root.querySelector('#training-canvas');if(e.target!==canvas)return;const rect=canvas.getBoundingClientRect();trainingAction(arena,'move',{x:(e.clientX-rect.left)/rect.width*960-arena.horde.hero.x,y:(e.clientY-rect.top)/rect.height*540-arena.horde.hero.y});};
    root.addEventListener('pointerdown',e=>{if(e.target.id==='training-canvas'){e.target.setPointerCapture?.(e.pointerId);point(e);}});
    root.addEventListener('pointermove',e=>{if(e.buttons||e.pointerType==='touch')point(e);});
    root.addEventListener('pointerup',()=>trainingAction(arena,'stop'));root.addEventListener('pointercancel',()=>trainingAction(arena,'stop'));
    window.addEventListener('keydown',keydown,true);window.addEventListener('keyup',keyup,true);
    document.body.append(root);draw();
    let last=performance.now(),accum=0;
    const frame=now=>{if(!root.isConnected)return;if(document.hidden){last=now;accum=0;requestAnimationFrame(frame);return;}accum=Math.min(.1,accum+(now-last)/1000);last=now;let changed=false;
      while(accum>=1/30){const before=arena.step+'|'+arena.horde.pending.join(',')+'|'+arena.finished+'|'+arena.failed;stepTrainingArena(arena);accum-=1/30;if(before!==arena.step+'|'+arena.horde.pending.join(',')+'|'+arena.finished+'|'+arena.failed)changed=true;}
      if(changed)draw();else renderHordeCanvas(root.querySelector('#training-canvas'),arena.horde,arena.state);
      requestAnimationFrame(frame);
    };requestAnimationFrame(frame);return;
  }
  if(event.target.matches('.dex-stage-overlay')){dismissDexStage();return;}
  const button = event.target.closest('button, a.brand');
  if (!button || button.disabled) return;
  if (button.matches('a.brand')) { event.preventDefault(); navigatePage('adventure'); return; }
  if (button.dataset.page) { navigatePage(button.dataset.page); return; }
  if(button.dataset.journeyClaim){
    const id=button.dataset.journeyClaim,ok=claimJourneyItem(state,id);
    toast(ok?(journeyItem(id).kind==='relic'?'journeyRelicClaimed':'journeyCurioClaimed'):'journeyClaimFailed');persist();refresh();return;
  }
  if(button.dataset.journeyEquip){
    toast(equipJourneyRelic(state,button.dataset.journeyEquip==='none'?null:button.dataset.journeyEquip)?'journeyEquippedToast':'journeyEquipFailed');persist();refresh();return;
  }
  if(button.dataset.curioResearch){
    toast(claimCurioResearch(state,button.dataset.curioResearch)?'journeyResearchToast':'journeyResearchFailed',{coins:CURIO_RESEARCH_REWARD});persist();refresh();return;
  }
  if(button.dataset.dexResearch){const success=claimDexResearch(state,Number(button.dataset.dexResearch));if(success){persist();refresh();}return;}
  if(button.dataset.dexStage){
    dismissDexStage();
    const id=Number(button.dataset.dexStage);
    const root=document.createElement('div');root.className='dex-stage-overlay';root.dataset.species=String(id);root.dataset.mode='animation';root.dataset.action='idle';
    root.innerHTML=`<section class="dex-stage-dialog" role="dialog" aria-modal="true" aria-label="${tr('dexStageTitle')}" tabindex="-1"><button class="secondary-button" data-close-dex-stage>${tr('dexStageClose')}</button><div class="dex-preview-modes"><button class="secondary-button" data-dex-mode="animation" aria-pressed="true">${tr('dexAnimationMode')}</button><button class="secondary-button" data-dex-mode="portrait" aria-pressed="false">${tr('dexPortraitMode')}</button></div><div class="dex-stage-canvas"></div><div class="dex-animation-actions" role="group" aria-label="${tr('dexAnimationActions')}">${LAYER_ACTIONS.map(action=>`<button class="secondary-button" data-dex-action="${action}" aria-pressed="${action==='idle'}">${tr('dexAction'+action)}</button>`).join('')}</div><p class="dex-animation-status" role="status"></p><div class="dex-stage-forms">${stageEvolutionLine(id).map(form=>`<button class="secondary-button" data-dex-stage-select="${form}" ${form===id?'disabled':''}>${name(form)}</button>`).join('')}</div><p data-dex-hint>${tr('dexAnimationHint')}</p></section>`;
    document.body.append(root);
    root.querySelector('.dex-stage-dialog').focus();
    renderDexPreview(root);return;
  }
  if(button.dataset.dexStageSelect){const id=Number(button.dataset.dexStageSelect),overlay=button.closest('.dex-stage-overlay');if(!overlay)return;overlay.dataset.species=String(id);overlay.querySelectorAll('[data-dex-stage-select]').forEach(item=>item.disabled=Number(item.dataset.dexStageSelect)===id);renderDexPreview(overlay);return;}
  if(button.dataset.dexAction){const root=button.closest('.dex-stage-overlay');root.dataset.action=button.dataset.dexAction;root.querySelectorAll('[data-dex-action]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));selectDexAnimationAction(button.dataset.dexAction);return;}
  if(button.dataset.dexMode){const root=button.closest('.dex-stage-overlay');root.dataset.mode=button.dataset.dexMode;renderDexPreview(root);return;}
  if(button.hasAttribute('data-close-dex-stage')){dismissDexStage();return;}
  if(button.dataset.campFilter){
    warehouseFilter=button.dataset.campFilter;
    renderSecondary();return;
  }
  if (button.dataset.action) { handleAction(button.dataset.action); return; }
  if(button.dataset.routeChoice){
    toast(chooseAdventurePath(state,button.dataset.routeChoice)?'routeChosen':'routeChoiceFailed');
    persist();refresh();return;
  }
  if(button.dataset.careerUpgrade){
    const [id,role]=button.dataset.careerUpgrade.split('|');
    toast(trainCareer(state,id,role)?'careerSaved':'careerFailed');persist();refresh();return;
  }
  if(button.dataset.skillEquip){
    const [id,slot,option]=button.dataset.skillEquip.split('|');
    toast(setSkillSlot(state,id,slot,option==='none'?null:option)?'skillSaved':'skillInvalid');persist();refresh();return;
  }
  if(button.dataset.skillCast){
    toast(castHordeActive(horde,state,button.dataset.skillCast)?'skillCastSuccess':'skillCastBlocked');
    persist();refresh();return;
  }
  if(button.dataset.combatRole){
    const [workerId,role]=button.dataset.combatRole.split('|');
    toast(chooseCombatRole(state,workerId,role)?'combatChosen':'combatChooseFailed');persist();refresh();return;
  }
  if(button.dataset.expeditionClaim){
    const reward=claimExpedition(state,button.dataset.expeditionClaim);
    toast(reward?'expClaimed':'expClaimBlocked',reward?{item:tr('campRes'+reward.item),count:reward.resources,coins:reward.coins}:{});
    persist();refresh();return;
  }
  if(button.dataset.expeditionRecall){
    toast(recallExpedition(state,button.dataset.expeditionRecall)?'expRecalled':'expClaimBlocked');persist();refresh();return;
  }
  if(button.dataset.c5Remove){toast(removeProductionPlan(state,button.dataset.c5Remove)?'c5PlanRemoved':'c5PlanFailed');persist();refresh();return;}
  if(button.dataset.c5Facility){toast(upgradeCampFacility(state,button.dataset.c5Facility)?'c5FacilityUpgraded':'campNotEnough');persist();refresh();return;}
  if(button.dataset.c4AutoPlot!==undefined){
    const plot=Number(button.dataset.c4AutoPlot),enabled=!state.camp.gardenAuto[plot];
    toast(setGardenAuto(state,plot,enabled)?'d2AutoGardenSaved':'campNotEnough');persist();refresh();return;
  }
  if(button.dataset.c4Plot!==undefined){
    const plot=Number(button.dataset.c4Plot),bed=state.camp.garden[plot];
    const success=bed?harvestGarden(state,plot):plantGarden(state,plot);
    toast(success?(bed?'c4Harvested':'c4Planted'):'campNotEnough');persist();refresh();return;
  }
  if(button.dataset.c4Make){toast(startCraft(state,button.dataset.c4Make)?'campCraftStarted':'campNotEnough');persist();refresh();return;}
  if(button.dataset.c4Batch){toast(enqueueCraft(state,button.dataset.c4Batch,Number(button.dataset.c4Quantity))?'c4Enqueued':'campNotEnough');persist();refresh();return;}
  if(button.dataset.c4Train){
    const id=selectedTraining??state.collection[0].id;
    toast(trainCompanion(state,id,button.dataset.c4Train)?'c4Trained':'campNotEnough');
    state.partyHp=Math.min(state.partyHp,game.maxPartyHp(state));persist();refresh();return;
  }
  if(button.dataset.gearCraft){toast(startCraft(state,button.dataset.gearCraft)?'gearCraftStarted':'campNotEnough');persist();refresh();return;}
  if(button.dataset.gearEquip){
    const owner=document.querySelector('select[data-gear-owner="'+button.dataset.gearEquip+'"]')?.value;
    toast(equipItem(state,button.dataset.gearEquip,owner)?'gearEquipped':'gearEquipFailed');persist();refresh();return;
  }
  if(button.dataset.gearUnequip){
    toast(unequipItem(state,button.dataset.gearUnequip)?'gearRemoved':'gearEquipFailed');
    state.partyHp=Math.min(state.partyHp,game.maxPartyHp(state));persist();refresh();return;
  }
  if (button.dataset.campRemove) {toast(removeCampJob(state,button.dataset.campRemove)?'campRecalled':'campAssignFailed');persist();refresh();return;}
  if (button.dataset.campCraft) {toast(startCraft(state,button.dataset.campCraft)?'campCraftStarted':'campNotEnough');persist();refresh();return;}
  if (button.dataset.train) toast(game.train(state, button.dataset.train) ? 'trainingDone' : 'notEnough');
  if (button.dataset.evolve) toast(game.evolve(state, button.dataset.evolve) ? 'evolved' : 'evolveUnavailable');
  if (button.dataset.team) toast(game.toggleTeam(state, button.dataset.team) ? 'teamUpdated' : 'campTeamConflict');
  if (button.dataset.region) {
    const desired=Number(button.dataset.region);
    if(Number.isInteger(desired)&&desired>=0&&desired<=state.unlockedRegion&&state.region!==desired)returnUnusedSupplies(horde,state);
    const changed = game.changeRegion(state,desired);
    if (!changed) return;
    if (horde.region !== state.region) { state.hordeRun = undefined; horde = createHorde(state); }
    page = 'adventure'; shell(); persist(); return;
  }
  if (button.dataset.upgrade) { game.chooseUpgrade(state, button.dataset.upgrade); choiceActive = false; }
  if (button.dataset.hordeUpgrade) chooseHordeUpgrade(horde, button.dataset.hordeUpgrade);
  if (button.dataset.explore) game.exploreEvent(state, button.dataset.explore);
  if (button.dataset.buy) {
    const balls = button.dataset.buy === 'balls'; const price = balls ? 150 : 100;
    if (state.coins >= price) { state.coins -= price; state[balls ? 'balls' : 'potions'] += balls ? 5 : 1; toast('bought'); }
    else toast('notEnough');
  }
  if (button.dataset.claim) {
    const rules = { firstSteps: [state.totalWins >= 10, 200], friends: [state.discovered.length >= 6, 400], champion: [state.badges >= 1, 600] };
    const key = button.dataset.claim;
    state.claimed ??= [];
    if (rules[key]?.[0] && !state.claimed.includes(key)) { state.claimed.push(key); state.coins += rules[key][1]; toast('claimedToast'); }
  }
  persist(); refresh();
});
document.addEventListener('change', async event => {
  if (event.target.id === 'music-enabled') { event.target.checked ? music.enable() : music.disable(); return; }
  if(event.target.id==='horde-tier'){setChallengeTier(horde,event.target.value);refresh();return;}
  if(event.target.id==='career-partner'){selectedCareer=event.target.value;renderSecondary();return;}
  if(event.target.id==='c4-training-partner'){
    selectedTraining=event.target.value;renderSecondary();return;
  }
  if(event.target.id==='camp-loadout-potion'||event.target.id==='camp-loadout-tool'){
    const slot=event.target.id.endsWith('potion')?'potion':'tool';
    selectCampLoadout(state,slot,event.target.value);persist();refresh();return;
  }
  if (event.target.id === 'language-select') {
    state.settings.locale = event.target.value; shell(); openModal('settings'); persist();
  }
  if (event.target.id === 'theme-select') { state.settings.theme = event.target.value; applyTheme(state); persist(); }
  if (event.target.id === 'depth-select') { if(game.setDepth(state, Number(event.target.value)))horde=createHorde(state); choiceActive = false; persist(); refresh(); }
  if (event.target.dataset.setting) {
    state.settings[event.target.dataset.setting] = event.target.checked;
    document.body.classList.toggle('reduced-motion', state.settings.reducedMotion); persist();
  }
  if (event.target.id === 'import-input' && event.target.files[0]) {
    try {
      if (event.target.files[0].size > 1000000) throw new Error();
      const imported = JSON.parse(await event.target.files[0].text());
      if(!game.validateSave(imported))throw new Error();
      const incoming=imported;
      state=incoming;game.settleOffline(state);ensureCamp(state);settleCamp(state);
      horde=createHorde(state,state.hordeRun);state.hordeRun=serializeHorde(horde);
      persist();closeModal();shell();if(saveHealthy)toast('imported');
    } catch { toast('invalidSave'); }
  }
});
// 方向引导仅在群潮战场生效；松开鼠标、触屏或方向键后恢复自动避险。
function guidePointer(event) {
  const canvas = $('#horde-canvas');
  if (!canvas || !state.running || horde.finished || horde.pending.length) return;
  const bounds = canvas.getBoundingClientRect();
  const x = (event.clientX - bounds.left) / bounds.width * 960;
  const y = (event.clientY - bounds.top) / bounds.height * 540;
  const dx = x - horde.hero.x, dy = y - horde.hero.y;
  if (Math.hypot(dx,dy)<15) setHordeDirection(horde,0,0);
  else setHordeDirection(horde,dx,dy);
}
document.addEventListener('pointerdown', event => {
  if (event.target.id !== 'horde-canvas') return;
  event.target.setPointerCapture?.(event.pointerId);
  guidePointer(event);
});
document.addEventListener('pointermove', event => {
  if (event.buttons && event.target.id === 'horde-canvas') guidePointer(event);
});
document.addEventListener('pointerup', event => {
  if (event.target.id === 'horde-canvas') setHordeDirection(horde,0,0);
});
document.addEventListener('pointercancel', () => setHordeDirection(horde,0,0));
document.addEventListener('keydown', event => {
  if(event.key==='Escape'&&document.querySelector('.dex-stage-overlay')){event.preventDefault();dismissDexStage();return;}
  if (modal) {
    if (event.key === 'Escape') closeModal();
    if (event.key === 'Tab') {
      const controls = [...$('.modal').querySelectorAll('button:not(:disabled), input:not([hidden]), select')];
      const first = controls[0], last = controls.at(-1);
      if (event.shiftKey && (document.activeElement === first || document.activeElement === $('.modal'))) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
    return;
  }
  if (['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON', 'A'].includes(event.target.tagName)) return;
  if (event.code === 'Space') { event.preventDefault(); handleAction('pause'); }
  const direction = {ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0],KeyW:[0,-1],KeyS:[0,1],KeyA:[-1,0],KeyD:[1,0]}[event.code];
  if (direction && page==='adventure') { event.preventDefault(); setHordeDirection(horde,...direction); }
});
document.addEventListener('keyup', event => {
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyW','KeyA','KeyS','KeyD'].includes(event.code)) setHordeDirection(horde,0,0);
});
document.addEventListener('input', event => {
  if (event.target.id === 'music-volume') music.setVolume(Number(event.target.value) / 100);
});
// 已保存开启偏好时也先等待本页的一次真实操作，避免浏览器自动播放拦截。
function unlockMusic(event) {
  if (!event.isTrusted || event.target.closest?.('[data-action^="music-"],#music-enabled')) return;
  music.unlock();
}
document.addEventListener('pointerdown',unlockMusic,true);
document.addEventListener('keydown',unlockMusic,true);
window.addEventListener('pagehide', () => music.setHidden(true));
window.addEventListener('pageshow', () => music.setHidden(document.hidden));
window.addEventListener('pagehide', persist);
window.addEventListener('pagehide', dismissDexStage);
window.addEventListener('pagehide', clearCreatureAnimations);
document.addEventListener('visibilitychange', () => {
  music.setHidden(document.hidden);
  if (document.hidden) {persist();clearCreatureAnimations();}
  else {
    const result = game.settleOffline(state);settleCamp(state);
    if (result.coins) { Object.assign(offline, result); persist(); openModal('offline'); }
    lastTick = performance.now(); refresh();
  }
});
setInterval(() => {
  if (document.hidden) return;
  const now = performance.now();
  if (now - lastTick >= 900) { lastTick = now;settleCamp(state);refresh(); }
  if (Date.now() - lastSaved > 10000) persist();
}, 150);
// 实时仿真按30Hz固定逻辑步长推进，动画在刷新率上限内平滑绘制。
let hordeFrameAt = performance.now(), hordeAccum = 0;
function runHordeFrame(now) {
  const passed = Math.min(100, Math.max(0, now - hordeFrameAt));
  hordeFrameAt = now;
  if (!document.hidden) {
    hordeAccum = Math.min(100, hordeAccum + passed);
    for (let n = 0; hordeAccum >= 1000 / 30 && n < 3; n++) {
      const beforePacks = horde.packs, beforeFinished = horde.finished, beforeFamilyCast = horde.familyCastRevision??0,beforeRelic=horde.relicRevision??0;
      if(!document.querySelector('#standalone-training'))stepHorde(horde, state, 1 / 30); hordeAccum -= 1000 / 30;
      const collectionChanged=(horde.relicRevision??0)!==beforeRelic;
      if (horde.packs !== beforePacks || (!beforeFinished && horde.finished) || (horde.familyCastRevision??0)!==beforeFamilyCast || collectionChanged) persist();
      if(page==='adventure'&&((horde.familyCastRevision??0)!==beforeFamilyCast||collectionChanged))updateHordePanels(horde,state,tr,icon);
    }
    syncMusic();
    if (page === 'adventure'&&!document.querySelector('#standalone-training')) renderHordeCanvas($('#horde-canvas'), horde, state);
  } else hordeAccum = 0;
  requestAnimationFrame(runHordeFrame);
}
document.addEventListener('error',handleCampArtError,true);
shell();
music.setHidden(document.hidden);
requestAnimationFrame(runHordeFrame);
if (loaded.recovered) toast('recovered');
if (offline.coins) openModal('offline');
if (!saveHealthy) toast('saveFail');
