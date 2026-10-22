import { SPECIES, REGIONS, UPGRADE_KEYS, ELEMENTS, MAX_LEVEL, BOSS_WINS, EVOLUTION_LINES, HORDE_UPGRADE_KEYS } from './data.js';
import { grantGuardianToken, GUARDIAN_TOKENS } from './relics.js';
import { validateCamp } from './camp-engine.js';
import { CAMP_RECIPES } from './camp-data.js';
import { equipmentBonuses } from './equipment.js';
import { trainingMultiplier } from './camp-training.js';
import {careerMultiplier} from './partner-careers.js';
import {hordeOfflineRates} from './horde-offline-economy.js';
import {DEX_RESEARCH,researchKey} from './dex-research.js';
import {familyTeamBonuses} from './family-talents.js';
const CLAIM_KEYS=new Set(['firstSteps','friends','champion',...DEX_RESEARCH.map(entry=>researchKey(entry.count))]);
const RESOURCE_CAP = 1e12;
const bounded = n => Math.max(0, Math.min(RESOURCE_CAP, n));
export const buffMultiplier = ranks => 1 + 0.65 * (1 - Math.exp(-Math.max(0, ranks) / 6));
export const xpToLevel = level => Math.round(32 + 9 * level ** 1.35);
export const teamMembers = s => s.team.map(id => s.collection.find(p => p.id === id)).filter(Boolean);
export const trainCost = p => Math.round(22 + 8 * p.level ** 1.35);
export const creatureAttack = (p,s=null) => (SPECIES[p.species].attack + p.level * 2.4) * (1 + SPECIES[p.species].stage * 0.18) * (s?(1+equipmentBonuses(s,p.id).attack)*trainingMultiplier(s,p.id,'attack')*careerMultiplier(s,p.id,'vanguard'):1);
export function addLog(s, key, params = {}) {
  s.logs.unshift({ key, params, at: Date.now() }); s.logs = s.logs.slice(0, 30);
}
export function bondEffects(s) {
  const types = teamMembers(s).map(p => SPECIES[p.species].type);
  const distinct = new Set(types).size;
  const same = Math.max(...ELEMENTS.map(type => types.filter(t => t === type).length));
  const talents=familyTeamBonuses(s);
  return { key: distinct === 3 ? 'bondDiverse' : same >= 2 ? 'bondTogether' : 'bondGrowing',
    damage: (distinct === 3 ? 1.08 : same >= 2 ? 1.1 : 1)*(1+talents.damage), guard: (distinct === 3 ? .92 : 1)*(1-talents.guard),
    capture: same >= 2 ? .06 : 0 };
}
export function maxPartyHp(s) {
  return Math.round(teamMembers(s).reduce((sum, p) => sum + (65 + p.level * 12) * SPECIES[p.species].vitality * (1+equipmentBonuses(s,p.id).hp) * trainingMultiplier(s,p.id,'hp'), 0) * buffMultiplier(s.buffs.guard));
}
export function power(s) { return Math.round(teamMembers(s).reduce((sum, p) => sum + creatureAttack(p,s), 0) * buffMultiplier(s.buffs.power) * bondEffects(s).damage); }
// 原六系保留历史克制环；新六系使用原创交互表，并非照搬其他游戏属性倍率表。
const resonanceCounters = {
  storm:{tide:1.35,gale:1.22,stone:.78,grove:.88},
  metal:{storm:1.3,frost:1.24,ember:.78,spore:.88},
  radiance:{umbra:1.35,spore:1.22,stone:.8,metal:.88},
  gale:{spore:1.33,grove:1.2,frost:.79,storm:.87},
  umbra:{radiance:1.3,grove:1.22,aether:.79,gale:.88},
  stone:{storm:1.35,ember:1.22,tide:.79,grove:.85},
  venom:{grove:1.32,tide:1.2,stone:.78,radiance:.82},
  dream:{storm:1.28,umbra:1.22,metal:.82,venom:.86},
  dust:{gale:1.27,ember:1.24,tide:.8,grove:.85},
};
export function affinity(attack, defense) {
  if (resonanceCounters[attack]?.[defense]) return resonanceCounters[attack][defense];
  const cycle = ['grove','tide','ember','frost','spore','aether'];
  const a = cycle.indexOf(attack), d = cycle.indexOf(defense);
  if(a<0 || d<0)return 1;
  return (a + 1) % 6 === d ? 1.35 : (d + 1) % 6 === a ? .8 : 1;
}
export function elementalMatch(ally,foe){
  const primary=affinity(ally.type,foe.type);
  const secondary=ally.secondaryType?affinity(ally.secondaryType,foe.type):primary;
  const attackFactor=primary*.68+secondary*.32;
  const foeSecond=foe.secondaryType?(
    affinity(ally.type,foe.secondaryType)*.68+
    (ally.secondaryType?affinity(ally.secondaryType,foe.secondaryType):affinity(ally.type,foe.secondaryType))*.32
  ):attackFactor;
  return Math.max(.72,Math.min(1.55,foe.secondaryType?attackFactor*.75+foeSecond*.25:attackFactor));
}
export function battleDamage(s, random = Math.random) {
  const target = SPECIES[s.enemy.species].type;
  let damage = teamMembers(s).reduce((sum, p) => sum + creatureAttack(p,s) * affinity(SPECIES[p.species].type, target)*trainingMultiplier(s,p.id,'element'), 0);
  damage *= buffMultiplier(s.buffs.power) * bondEffects(s).damage;
  const adapted = teamMembers(s).some(p => SPECIES[p.species].type === REGIONS[s.region].element);
  if (s.region === 1 && !adapted) damage *= .84;
  if (s.region === 5 && s.seconds % 6 < 2 && !adapted) damage *= .65;
  return Math.max(1, Math.round(damage * (.96 + random() * .08)));
}
export function spawnEnemy(s, boss = false) {
  const region = REGIONS[s.region], depth = s.depths[s.region];
  const species = boss ? region.boss : region.enemies[s.encounter % region.enemies.length];
  const scale = (1 + Math.min(s.wins, BOSS_WINS) * .018) * (1 + depth * .23);
  const hp = Math.round(region.baseHp * scale * (boss ? 2.5 : 1));
  s.enemy = { species, hp, maxHp: hp, attack: Math.round(region.baseAttack * scale * (boss ? 1.65 : 1)),
    level: Math.min(MAX_LEVEL, region.level + depth * 3 + Math.floor(Math.min(s.wins, 30) / 5)), boss };
}
export function createGame(now = Date.now()) {
  const s = { version: 3, coins: 420, balls: 12, potions: 3, region: 0, unlockedRegion: 0,
    badges: 0, wins: 0, totalWins: 0, encounter: 0, energy: 30, running: true,
    collection: [101, 107, 113, 104].map(species => ({ id: `c${species}`, species, level: 5, xp: 0 })),
    discovered: [101, 107, 113, 104], team: ['c101', 'c107', 'c113'],
    buffs: { power: 0, guard: 0, fortune: 0 }, choices: [], partyHp: 1, savedAt: now, logs: [], seconds: 0,
    bossCleared: [], mastery: [0, 0, 0, 0, 0, 0], depths: [0, 0, 0, 0, 0, 0],
    materials: [0, 0, 0, 0, 0, 0], scoutEnergy: 0, claimed: [], guardianTokens: [],
    settings: { locale: 'zh-CN', speed: 1, autoUpgrade: true, autoExplore: true, autoHeal: true, reducedMotion: false, theme: 'auto' } };
  s.partyHp = maxPartyHp(s); spawnEnemy(s); addLog(s, 'logWelcome'); return s;
}
function gainXp(p, amount) {
  if (p.level >= MAX_LEVEL) { p.xp = 0; return; }
  p.xp = bounded(p.xp + amount);
  while (p.level < MAX_LEVEL && p.xp >= xpToLevel(p.level)) { p.xp -= xpToLevel(p.level); p.level++; }
  if (p.level === MAX_LEVEL) p.xp = 0;
}
export function battleReward(s) { return Math.round(REGIONS[s.region].reward * (1 + s.depths[s.region] * .22) * buffMultiplier(s.buffs.fortune)); }
export function defeatEnemy(s) {
  const wasBoss = s.enemy.boss;
  const reward = battleReward(s) * (wasBoss ? 6 : 1);
  s.coins = bounded(s.coins + reward); s.totalWins++; s.encounter++; s.wins++;
  const xp = 10 + s.region * 4 + s.depths[s.region] * 2;
  for (const p of teamMembers(s)) gainXp(p, xp * (wasBoss ? 3 : 1));
  s.partyHp = Math.min(maxPartyHp(s), s.partyHp + maxPartyHp(s) * .06);
  s.scoutEnergy = Math.min(10, s.scoutEnergy + 1);
  if (s.totalWins % 3 === 0) s.balls = bounded(s.balls + 1);
  if (s.totalWins % 12 === 0) s.potions = bounded(s.potions + 1);
  if (s.totalWins % 2 === 0) s.materials[s.region] = bounded(s.materials[s.region] + 1 + s.depths[s.region]);
  addLog(s, 'logWin', { species: s.enemy.species, coins: reward });
  if (wasBoss) {
    if (!s.bossCleared.includes(s.region)) s.bossCleared.push(s.region);
    s.badges = s.bossCleared.length;
    s.unlockedRegion = Math.min(REGIONS.length - 1, Math.max(s.unlockedRegion, s.region + 1));
    s.mastery[s.region] = Math.min(5, s.mastery[s.region] + 1);
    s.materials[s.region] = bounded(s.materials[s.region] + 8);
    s.wins = 0; s.buffs = { power: 0, guard: 0, fortune: 0 }; s.choices = [];
    s.partyHp = maxPartyHp(s); addLog(s, 'logBossWin', { region: s.region });
  } else if (s.wins % 5 === 0) s.choices = [...UPGRADE_KEYS];
  spawnEnemy(s);
  if (s.settings.autoExplore && s.scoutEnergy >= 5) exploreEvent(s, 'gather');
}
// 群潮每八个敌人才结算一份进度，禁止把旧单怪收益乘以敌潮数量。
export function grantHordeMilestone(s, bonus = 1) {
  const reward = Math.round(battleReward(s) * Math.max(1, Math.min(1.7, bonus)));
  s.coins = bounded(s.coins + reward); s.totalWins++; s.encounter++; s.wins++;
  const xp = 10 + s.region * 4 + s.depths[s.region] * 2;
  for (const p of teamMembers(s)) gainXp(p, xp);
  s.partyHp = Math.min(maxPartyHp(s), s.partyHp + maxPartyHp(s) * .025);
  s.scoutEnergy = Math.min(10, s.scoutEnergy + 1);
  if (s.totalWins % 3 === 0) s.balls = bounded(s.balls + 1);
  if (s.totalWins % 12 === 0) s.potions = bounded(s.potions + 1);
  if (s.totalWins % 2 === 0) s.materials[s.region] = bounded(s.materials[s.region] + 1 + s.depths[s.region]);
  addLog(s, 'logHordePack', { coins: reward });
}
export function grantHordeCapture(s, species, level) {
  if (!Object.hasOwn(SPECIES, species)) return false;
  const existing = s.collection.find(p => p.species === species);
  if (existing) {
    gainXp(existing, 28 + s.region * 5);
    addLog(s, 'logDuplicate', { species });
  } else {
    if (s.collection.length >= Object.keys(SPECIES).length) return false;
    let id = `c${species}-${s.totalWins}`;
    while (s.collection.some(p => p.id === id)) id += '-1';
    s.collection.push({ id, species, level: Math.max(1, Math.min(MAX_LEVEL, Math.floor(level))), xp: 0 });
    if (!s.discovered.includes(species)) s.discovered.push(species);
  }
  addLog(s, 'logCapture', { species }); return true;
}
export function grantHordeGuardian(s) {
  const firstToken = grantGuardianToken(s,s.region);
  if (firstToken) addLog(s,'logGuardianKeepsake',{region:s.region});
  s.coins = bounded(s.coins + battleReward(s) * 6);
  if (!s.bossCleared.includes(s.region)) s.bossCleared.push(s.region);
  s.badges = s.bossCleared.length;
  s.unlockedRegion = Math.min(REGIONS.length - 1, Math.max(s.unlockedRegion, s.region + 1));
  s.mastery[s.region] = Math.min(5, s.mastery[s.region] + 1);
  s.materials[s.region] = bounded(s.materials[s.region] + 8);
  s.wins = 0;
  s.buffs = { power: 0, guard: 0, fortune: 0 };
  s.choices = []; s.partyHp = maxPartyHp(s);
  addLog(s, 'logBossWin', { region: s.region });
}
export function applyRegionRule(s) {
  const adapted = teamMembers(s).some(p => SPECIES[p.species].type === REGIONS[s.region].element);
  if (s.region === 0) s.partyHp = Math.min(maxPartyHp(s), s.partyHp + maxPartyHp(s) * .01);
  if (s.region === 4) s.partyHp += maxPartyHp(s) * (adapted ? .008 : -.006);
  if (s.region === 5 && s.seconds % 6 === 0) s.energy = Math.min(100, s.energy + 10);
}
export function tick(s, random = Math.random) {
  if (!s.running || s.choices.length) return;
  s.seconds++;
  const adapted = teamMembers(s).some(p => SPECIES[p.species].type === REGIONS[s.region].element);
  const frozen = s.region === 3 && s.seconds % 5 === 0 && !adapted;
  const damage = frozen ? 0 : battleDamage(s, random);
  s.lastDamage = damage; s.enemy.hp = Math.max(0, s.enemy.hp - damage); s.energy = Math.min(100, s.energy + 4);
  if (s.enemy.hp <= 0) { defeatEnemy(s); return; }
  let incoming = s.enemy.attack * bondEffects(s).guard / buffMultiplier(s.buffs.guard);
  if (s.region === 2 && s.seconds % 12 >= 6 && !adapted) incoming *= 1.25;
  s.partyHp -= Math.max(1, Math.round(incoming)); applyRegionRule(s);
  if (s.settings.autoHeal && s.partyHp > 0 && s.partyHp < maxPartyHp(s) * .35 && s.potions > 0) heal(s);
  if (s.partyHp <= 0) {
    s.wins = 0; s.buffs = { power: 0, guard: 0, fortune: 0 }; s.choices = [];
    s.partyHp = maxPartyHp(s); s.energy = 0; spawnEnemy(s); addLog(s, 'logDefeat');
  }
  s.partyHp = Math.min(maxPartyHp(s), s.partyHp);
  if (s.settings.autoExplore && s.scoutEnergy >= 5) exploreEvent(s, 'gather');
}
export function chooseUpgrade(s, key) {
  if (!s.choices.includes(key)) return false;
  s.buffs[key] = Math.min(30, s.buffs[key] + 1);
  if (key === 'guard') s.partyHp = Math.min(maxPartyHp(s), s.partyHp + maxPartyHp(s) * .18);
  s.choices = []; addLog(s, 'logUpgrade', { upgrade: key }); return true;
}
export function captureChance(s) {
  return Math.min(.92, .25 + (1 - s.enemy.hp / s.enemy.maxHp) * .6 + bondEffects(s).capture + (s.region === 2 && s.seconds % 12 < 6 ? .08 : 0));
}
export function capture(s, random = Math.random) {
  if (!s.running || s.balls < 1 || s.enemy.boss || s.choices.length) return false;
  s.balls--; const species = s.enemy.species;
  if (random() >= captureChance(s)) { addLog(s, 'logCaptureFail', { species }); return false; }
  const existing = s.collection.find(p => p.species === species);
  if (!existing) {
    let id = `c${species}-${s.totalWins}`; while (s.collection.some(p => p.id === id)) id += '-1';
    s.collection.push({ id, species, level: Math.min(MAX_LEVEL, s.enemy.level), xp: 0 });
    if (!s.discovered.includes(species)) s.discovered.push(species);
  } else { gainXp(existing, 28 + s.region * 5); addLog(s, 'logDuplicate', { species }); }
  addLog(s, 'logCapture', { species }); defeatEnemy(s); return true;
}
export function train(s, id) {
  const p = s.collection.find(p => p.id === id);
  if (!p || p.level >= MAX_LEVEL || s.coins < trainCost(p)) return false;
  s.coins -= trainCost(p); p.level++; s.partyHp = Math.min(maxPartyHp(s), s.partyHp + 12);
  addLog(s, 'logTrain', { species: p.species, level: p.level }); return true;
}
export function evolutionCost(p) {
  const data = SPECIES[p.species];
  return { coins: data.evolutionCoins??(data.stage===0?240:900), materials: data.evolutionMaterials??(data.stage===0?10:28), region: data.region, level: data.at??MAX_LEVEL };
}
export function evolve(s, id) {
  const p = s.collection.find(p => p.id === id), data = p && SPECIES[p.species];
  if (!data?.next) return false;
  const cost = evolutionCost(p);
  if (p.level < cost.level || s.coins < cost.coins || s.materials[cost.region] < cost.materials || s.collection.some(other => other.species === data.next)) return false;
  // 工作与远征在派出时锁定当前属性/工时，避免中途进化绕过收益与时长结算。
  if(s.camp&&(s.camp.jobs?.some(j=>j.workerId===id)||s.camp.expeditions?.jobs?.some(j=>j.workerId===id)||s.camp.adventureRoutes?.active?.workerId===id))return false;
  s.coins -= cost.coins; s.materials[cost.region] -= cost.materials; p.species = data.next;
  s.partyHp=Math.min(maxPartyHp(s),s.partyHp);
  if (!s.discovered.includes(p.species)) s.discovered.push(p.species);
  addLog(s, 'logEvolve', { species: p.species }); return true;
}
export function toggleTeam(s, id) {
  if (!s.collection.some(p => p.id === id)) return false;
  // 伙伴不能在进行营地工作时同时加入出战队伍。
  if (!s.team.includes(id) && (s.camp?.jobs?.some(j=>j.workerId===id)||s.camp?.expeditions?.jobs?.some(j=>j.workerId===id)||s.camp?.adventureRoutes?.active?.workerId===id))return false;
  if (s.team.includes(id)) { if (s.team.length === 1) return false; s.team = s.team.filter(p => p !== id); }
  else { if (s.team.length >= 3) return false; s.team.push(id); }
  s.partyHp = Math.min(s.partyHp, maxPartyHp(s)); return true;
}
export function heal(s) {
  if (!s.potions || s.partyHp >= maxPartyHp(s)) return false;
  s.potions--; s.partyHp = Math.min(maxPartyHp(s), s.partyHp + maxPartyHp(s) * .6); addLog(s, 'logHeal'); return true;
}
export function ultimate(s) {
  if (!s.running || s.energy < 100 || s.choices.length) return false;
  s.energy = 0; s.enemy.hp = Math.max(0, s.enemy.hp - battleDamage(s, () => .5) * 3.2); addLog(s, 'logUltimate');
  if (s.enemy.hp === 0) defeatEnemy(s); return true;
}
export function challengeBoss(s) {
  if (s.wins < BOSS_WINS || s.enemy.boss || s.choices.length) return false;
  s.partyHp = maxPartyHp(s); spawnEnemy(s, true); addLog(s, 'logBoss'); return true;
}
export function changeRegion(s, region) {
  if (!Number.isInteger(region) || region < 0 || region > s.unlockedRegion || region >= REGIONS.length) return false;
  if (region === s.region) return true;
  s.region = region; s.wins = 0; s.buffs = { power: 0, guard: 0, fortune: 0 }; s.choices = [];
  s.encounter = 0; s.partyHp = maxPartyHp(s); spawnEnemy(s); addLog(s, 'logTravel', { region }); return true;
}
export function setDepth(s, depth) {
  if (!Number.isInteger(depth) || depth < 0 || depth > s.mastery[s.region] || depth > 5) return false;
  s.depths[s.region] = depth; s.wins = 0; s.buffs = { power: 0, guard: 0, fortune: 0 }; s.choices = [];
  s.partyHp = maxPartyHp(s); spawnEnemy(s); addLog(s, 'logDepth', { depth }); return true;
}
export function exploreEvent(s, choice) {
  if (s.scoutEnergy < 5 || !['gather', 'rest'].includes(choice)) return false;
  s.scoutEnergy -= 5;
  if (choice === 'gather') { const amount = 3 + s.depths[s.region]; s.materials[s.region] = bounded(s.materials[s.region] + amount); addLog(s, 'logGather', { region: s.region, amount }); }
  else { s.partyHp = Math.min(maxPartyHp(s), s.partyHp + maxPartyHp(s) * .5); s.energy = Math.min(100, s.energy + 20); addLog(s, 'logRest'); }
  return true;
}
export function estimateRates(s) {
  const copy = structuredClone(s); copy.buffs = { power: 0, guard: 0, fortune: 0 }; copy.wins = 5; copy.seconds = 3; spawnEnemy(copy);
  let hits = Math.ceil(copy.enemy.maxHp / battleDamage(copy, () => .5));
  if (copy.region === 3 && !teamMembers(copy).some(p => SPECIES[p.species].type === 'frost')) hits = Math.ceil(hits * 1.25);
  const probe = structuredClone(copy); probe.partyHp = maxPartyHp(probe); let canWin = false;
  for (let turn = 0; turn < 600; turn++) {
    probe.seconds++;
    const adapted = teamMembers(probe).some(p => SPECIES[p.species].type === REGIONS[probe.region].element);
    if (!(probe.region === 3 && probe.seconds % 5 === 0 && !adapted)) probe.enemy.hp -= battleDamage(probe, () => .5);
    if (probe.enemy.hp <= 0) { canWin = true; break; }
    let incoming = probe.enemy.attack * bondEffects(probe).guard;
    if (probe.region === 2 && probe.seconds % 12 >= 6 && !adapted) incoming *= 1.25;
    probe.partyHp -= Math.max(1, Math.round(incoming)); applyRegionRule(probe);
    if (probe.partyHp <= 0) break;
  }
  if (!canWin) return { secondsPerWin: 0, onlineCoinsPerSecond: 0, offlineCoinsPerSecond: 0, xpPerSecond: 0, materialsPerSecond: 0, blocked: true };
  const survival = Math.min(1, maxPartyHp(copy) / Math.max(1, copy.enemy.attack * Math.max(1, hits - 1) * 3));
  const secondsPerWin = Math.max(2, hits + .75) / Math.max(.15, survival);
  return { secondsPerWin, onlineCoinsPerSecond: battleReward(copy) / secondsPerWin,
    offlineCoinsPerSecond: battleReward(copy) / secondsPerWin * .6,
    xpPerSecond: (10 + s.region * 4 + s.depths[s.region] * 2) / secondsPerWin * .6,
    materialsPerSecond: ((1 + s.depths[s.region]) / 2 + .6) / secondsPerWin * .6 };
}
export function settleOffline(s, now = Date.now()) {
  const seconds = s.running ? Math.min(28800, Math.max(0, Math.floor((now - s.savedAt) / 1000))) : 0;
  const rates = hordeOfflineRates(s), eligible = seconds >= 60 && !rates.blocked;
  const coins = eligible ? Math.floor(seconds * rates.coins) : 0;
  const xp = eligible ? Math.floor(seconds * rates.xp) : 0;
  const materials = eligible ? Math.floor(seconds * rates.materials) : 0;
  s.coins = bounded(s.coins + coins); s.materials[s.region] = bounded(s.materials[s.region] + materials);
  for (const p of teamMembers(s)) gainXp(p, xp);
  s.savedAt = Math.max(now, s.savedAt);
  if (coins) addLog(s, 'logOffline', { coins });
  return { seconds, coins, xp, materials, region: s.region };
}
const finite = (n, max = RESOURCE_CAP) => typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= max;
const integer = (n, max = RESOURCE_CAP) => Number.isInteger(n) && finite(n, max);
const validSpecies = id => Number.isInteger(id) && Object.hasOwn(SPECIES, id);
const vector = (v, max, length = REGIONS.length) => Array.isArray(v) && v.length === length && v.every(n => integer(n, max));
export function validateSave(s) {
  if (!s || s.version !== 3 || !['coins', 'balls', 'potions', 'wins', 'totalWins', 'encounter', 'energy', 'partyHp', 'seconds', 'badges', 'scoutEnergy'].every(k => finite(s[k]))) return false;
  if (!['balls', 'potions', 'wins', 'totalWins', 'encounter', 'seconds', 'badges'].every(k => integer(s[k]))) return false;
  if (!finite(s.savedAt, 8e15) || !integer(s.energy, 100) || !integer(s.scoutEnergy, 10) || !integer(s.region, 5) || !integer(s.unlockedRegion, 5) || s.unlockedRegion < s.region) return false;
  if (!Array.isArray(s.collection) || !s.collection.length || s.collection.length > Object.keys(SPECIES).length || !s.collection.every(p => p && typeof p.id === 'string' && /^[pc][\d-]+$/.test(p.id) && validSpecies(p.species) && integer(p.level, MAX_LEVEL) && p.level > 0 && finite(p.xp))) return false;
  if (new Set(s.collection.map(p => p.id)).size !== s.collection.length || new Set(s.collection.map(p => p.species)).size !== s.collection.length) return false;
  if (!Array.isArray(s.team) || !s.team.length || s.team.length > 3 || new Set(s.team).size !== s.team.length || !s.team.every(id => s.collection.some(p => p.id === id))) return false;
  if (!s.buffs || !UPGRADE_KEYS.every(k => integer(s.buffs[k], 30)) || !Array.isArray(s.choices) || !s.choices.every(k => UPGRADE_KEYS.includes(k)) || s.choices.length > 3) return false;
  if (!s.enemy || !validSpecies(s.enemy.species) || !['hp', 'maxHp', 'attack'].every(k => finite(s.enemy[k])) || !integer(s.enemy.level, MAX_LEVEL) || s.enemy.level < 1 || s.enemy.maxHp <= 0 || s.enemy.hp > s.enemy.maxHp || typeof s.enemy.boss !== 'boolean') return false;
  if (!s.settings || !['zh-CN', 'zh-TW'].includes(s.settings.locale) || ![1, 2].includes(s.settings.speed) || !['autoUpgrade', 'autoExplore', 'autoHeal', 'reducedMotion'].every(k => typeof s.settings[k] === 'boolean') || !['auto', ...REGIONS.map(r => r.theme)].includes(s.settings.theme) || typeof s.running !== 'boolean') return false;
  if (!Array.isArray(s.discovered) || !s.discovered.every(validSpecies) || new Set(s.discovered).size !== s.discovered.length || !s.collection.every(p => s.discovered.includes(p.species))) return false;
  if (!validateCamp(s)) return false;
  if (!vector(s.materials, RESOURCE_CAP) || !vector(s.mastery, 5) || !vector(s.depths, 5) || !s.depths.every((depth, i) => depth <= s.mastery[i])) return false;
  if (!Array.isArray(s.claimed) || !s.claimed.every(key => CLAIM_KEYS.has(key)) || new Set(s.claimed).size !== s.claimed.length) return false;
  // guardianTokens 可选：兼容历史v2存档；拒绝伪造的纪念物与重复条目。
  if(s.guardianTokens!==undefined && (!Array.isArray(s.guardianTokens)||s.guardianTokens.length>GUARDIAN_TOKENS.length||!s.guardianTokens.every(k=>integer(k,GUARDIAN_TOKENS.length-1))||new Set(s.guardianTokens).size!==s.guardianTokens.length))return false;
  // 新群潮切片采用可选的紧凑快照字段，旧版v2存档没有此字段时仍合法。
  if (s.hordeRun !== undefined) {
    const h = s.hordeRun;
    // 旧快照没有补给字段仍然合法；新快照的携带数量、插槽和冷却必须可验证。
    if(h?.supplies!==undefined && (
       !h.supplies || typeof h.supplies!=='object' || Array.isArray(h.supplies) ||
       !Object.entries(h.supplies).every(([id,n])=>CAMP_RECIPES[id]&&integer(n,3)) ||
       !h.supplySlots || !CAMP_RECIPES[h.supplySlots.potion] || CAMP_RECIPES[h.supplySlots.potion].category!=='potion' ||
       !CAMP_RECIPES[h.supplySlots.tool] || CAMP_RECIPES[h.supplySlots.tool].category!=='tool' ||
       !h.itemCooldowns || !['potion','tool'].every(slot=>Number.isFinite(h.itemCooldowns[slot])&&h.itemCooldowns[slot]>=-100&&h.itemCooldowns[slot]<=600) ||
       typeof h.suppliesReturned!=='boolean'))return false;
    if(h?.heroHaste!==undefined&&(!finite(h.heroHaste,10)))return false;
    if(h?.resonanceTick!==undefined&&(!integer(h.resonanceTick,100)||h.resonanceTick>Math.floor(h.elapsed/9)+1))return false;
    if(h?.shieldPool!==undefined&&!finite(h.shieldPool,maxPartyHp(s)*.16+1))return false;
    if(h?.activeCooldowns!==undefined&&(!h.activeCooldowns||typeof h.activeCooldowns!=='object'||Array.isArray(h.activeCooldowns)
      ||Object.keys(h.activeCooldowns).length>120||Object.entries(h.activeCooldowns).some(([id,v])=>
        !s.collection.some(p=>p.id===id)||!finite(v,617))))return false;
    if (!h || !integer(h.region, 5) || !Number.isInteger(h.seed) ||
      !finite(h.elapsed, 600) || !integer(h.kills, 100000) || !integer(h.packs, 10000) ||
      !integer(h.rank, 100) || h.rank < 1 || !finite(h.xp, 999) ||
      typeof h.bossStarted !== 'boolean' || typeof h.finished !== 'boolean' ||
      !h.upgrades || !HORDE_UPGRADE_KEYS.every(k => integer(h.upgrades[k] ?? 0, 10)) ||
      !Array.isArray(h.pending) || h.pending.length > 3 ||
      new Set(h.pending).size !== h.pending.length ||
      !h.pending.every(k => HORDE_UPGRADE_KEYS.includes(k)) ||
      (h.hero !== undefined && (!h.hero || !finite(h.hero.x, 960) || !finite(h.hero.y, 540))) ) return false;
  }
  return Array.isArray(s.logs) && s.logs.length <= 30 && s.logs.every(l => l && finite(l.at, 8e15) && typeof l.key === 'string' && /^log[A-Za-z]+$/.test(l.key) && l.params && typeof l.params === 'object' && Object.values(l.params).every(v => typeof v === 'string' || finite(v))) && Array.isArray(s.bossCleared) && s.bossCleared.every(r => integer(r, 5)) && new Set(s.bossCleared).size === s.bossCleared.length && s.badges === s.bossCleared.length;
}
