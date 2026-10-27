// 群潮试炼：与旧版单体引擎隔离的可复现多敌人实时仿真。角色使用项目现有真实贴图。
import { SPECIES, REGIONS, HORDE_UPGRADE_KEYS } from './data.js';
import { buildPool, buildOffer, buildSynergies } from './horde-build.js';
import { advanceHero, setHordeDirection as guide } from './horde-movement.js';
import { teamMembers, creatureAttack, elementalMatch, maxPartyHp, heal, grantHordeMilestone, grantHordeGuardian, grantHordeCapture, addLog } from './engine.js';
import { BOSS_STYLES, createBossWarnings, createEliteWarning, insideWarning } from './horde-boss.js';
import {combatRole,roleAttackMultiplier,resonanceKey,applyResonance} from './combat-tactics.js';
import {performActiveSkill} from './skill-loadouts.js';
import { guardianBonus } from './relics.js';
import {familyTeamBonuses,combatSignature,familyTalent} from './family-talents.js';
import {pushCombatText,advanceCombatText} from './combat-feedback.js';
import {recordPartnerDamage} from './horde-contributions.js';
import {recordCreatureCast,recordCreatureHit} from './creature-action-state.js';
import {creditSupport} from './horde-support-metrics.js';
import {markMovement} from './horde-training-lesson.js';
import {familyFieldSupport} from './family-field-support.js';
import {updateHordeDevices} from './horde-devices.js';
import {challengeTier} from './horde-challenge.js';
import {enemyVitalityMultiplier} from './horde-balance-tuning.js';
import {scoutWarningLead} from './horde-report.js';
import { trainingMultiplier } from './camp-training.js';
import { ensureCamp } from './camp-engine.js';

export const HORDE_WIDTH = 960;
export const HORDE_HEIGHT = 540;
export const HORDE_UPGRADES = HORDE_UPGRADE_KEYS;
export const setHordeDirection = guide;
const PI2 = Math.PI * 2;
const clamp = (n,a,b)=>Math.max(a,Math.min(b,n));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const numeric = (n,a,b,d)=>Number.isFinite(n)?clamp(n,a,b):d;
function rand(h){let x=h.seed|0;x^=x<<13;x^=x>>>17;x^=x<<5;h.seed=x|0;return (x>>>0)/4294967296;}
export function createHorde(state, snapshot=null, seed=712367) {
  const saved = snapshot?.region === state.region && snapshot && !snapshot.finished ? snapshot : null;
  // 开新局才从永久库存预留补给；刷新恢复快照不再次扣货。
  const camp=ensureCamp(state);
  const supplied=saved?.supplies;
  const supplies=supplied?{...supplied}:{};
  if(!supplied){for(const id of [camp.potionSlot,camp.toolSlot]){
    const n=Math.min(3,camp.consumables[id]??0);
    supplies[id]=n;camp.consumables[id]-=n;
  }}
  return {
    region:state.region, seed:(saved?.seed ?? seed)|0 || 1, elapsed:numeric(saved?.elapsed,0,600,0),
    enemies:[], projectiles:[], pulses:[], dangerMarkers:[], hero:{x:numeric(saved?.hero?.x,42,918,480),y:numeric(saved?.hero?.y,42,498,270)},
    manual:{x:0,y:0},moveMode:'auto', eliteCount:0,bossAttacks:0,regionClock:0,regenClock:0,eliteClock:0,
    nextId:1, spawnClock:0, timers:[0.2,0.5,0.8], skillCasts:[0,0,0],
    activeCooldowns:saved?.activeCooldowns?{...saved.activeCooldowns}:{},activeCasts:0,
    kills:Math.floor(numeric(saved?.kills,0,100000,0)), packs:Math.floor(numeric(saved?.packs,0,10000,0)),
    xp:numeric(saved?.xp,0,999,0), rank:Math.floor(numeric(saved?.rank,1,100,1)),
    upgrades:Object.fromEntries(HORDE_UPGRADES.map(k=>[k,Math.floor(numeric(saved?.upgrades?.[k],0,10,0))])),
    pending:Array.isArray(saved?.pending)?saved.pending.filter(k=>HORDE_UPGRADES.includes(k)).slice(0,3):[],
    // 恢复快照会重建当前阶段实体，避免首领标志留存却丢失首领。
    autoChoice:0, bossStarted:false, bossCleared:false, contactWindow:0, contactDamage:0,
    resonanceTick:Math.floor(numeric(saved?.resonanceTick,0,100,Math.floor(numeric(saved?.elapsed,0,600,0)/9))),resonanceTriggers:0,
    finished:!!saved?.finished, defeated:false, notice:'', impact:0, combatDamage:0,
    effectsApplied:0, shieldPool:numeric(saved?.shieldPool,0,maxPartyHp(state)*.16,0), motionTime:0, vortexClock:0,
    bossPhase:0, bossMechanic:null, heroSlow:0, heroHaste:numeric(saved?.heroHaste,0,10,0), hazardsDodged:0,
    supplies, supplySlots:{potion:saved?.supplySlots?.potion??camp.potionSlot,tool:saved?.supplySlots?.tool??camp.toolSlot},
    itemCooldowns:{potion:saved?.itemCooldowns?.potion??-100,tool:saved?.itemCooldowns?.tool??-100},suppliesReturned:!!saved?.suppliesReturned,
  };
}
export function serializeHorde(h){
  return {region:h.region,seed:h.seed,elapsed:+h.elapsed.toFixed(3),kills:h.kills,packs:h.packs,
    hero:{x:+h.hero.x.toFixed(2),y:+h.hero.y.toFixed(2)},
    rank:h.rank,xp:+h.xp.toFixed(3),upgrades:{...h.upgrades},pending:[...h.pending],
    bossStarted:h.bossStarted,finished:h.finished,heroHaste:+h.heroHaste.toFixed(2),resonanceTick:h.resonanceTick,
    shieldPool:+h.shieldPool.toFixed(2),activeCooldowns:{...h.activeCooldowns},
    supplies:{...h.supplies},supplySlots:{...h.supplySlots},itemCooldowns:{...h.itemCooldowns},suppliesReturned:!!h.suppliesReturned};
}
function spawn(h,s,boss=false) {
  const region=REGIONS[h.region], d=rand(h);
  const edge=Math.floor(d*4), t=rand(h);
  const coords=[[-32,t*HORDE_HEIGHT],[HORDE_WIDTH+32,t*HORDE_HEIGHT],[t*HORDE_WIDTH,-32],[t*HORDE_WIDTH,HORDE_HEIGHT+32]][edge];
  const choice=rand(h), kind=boss?'boss':choice<0.19?'runner':choice<0.36?'tank':'walker';
  const common=region.enemies.filter(id=>!SPECIES[id].rareVariantOf);
  const rare=region.enemies.find(id=>SPECIES[id].rareVariantOf);
  // 异彩灵伴拥有独立真实PNG与编号，每次刷新约6%概率显现。
  const species=boss?region.boss:(rare&&rand(h)<.06?rare:common[Math.floor(rand(h)*common.length)]);
  const power=1+Math.min(h.elapsed,180)/210 + s.depths[s.region]*.19;
  const hp=(boss?900:kind==='tank'?155:kind==='runner'?44:82)*power*(1+h.region*.38)*enemyVitalityMultiplier(h,s)*(h.training?.22:1);
  const enemy={id:h.nextId++,species,kind,x:boss?HORDE_WIDTH/2:coords[0],
    y:boss?-65:coords[1],hp,maxHp:hp,r:boss?36:kind==='tank'?20:kind==='runner'?12:16,
    speed:boss?30:kind==='tank'?32:kind==='runner'?100:55,
    attack:h.training?1:boss?34:kind==='tank'?13:kind==='runner'?8:9,hitCooldown:0,slow:0,flash:0,
    abilityClock:boss?2.5:0,shield:0,phase:boss?1:0};
  h.enemies.push(enemy);
  return enemy;
}
function nearest(h,x,y,limit=550) {
  let target=null, best=limit*limit;
  for(const e of h.enemies) if(e.hp>0) {
    const dx=e.x-x,dy=e.y-y,dd=dx*dx+dy*dy;
    if(dd<best){best=dd;target=e;}
  }
  return target;
}
function hit(h,e,damage,dx=0,dy=0,push=0,ownerId=null) {
  if(e.hp<=0)return;
  const absorption=Math.min(.25, (e.shield??0)*.075);
  const bossBonus=(e.kind==='boss'||e.kind==='elite')?1+h.upgrades.focus*.14:1;
  const movingBonus=h.motionTime>0?1+h.upgrades.momentum*.075:1;
  const applied=damage*(1-absorption)*bossBonus*movingBonus;
  e.hp=Math.max(0,e.hp-applied); e.flash=0.15; h.combatDamage+=applied;
  if(ownerId){recordPartnerDamage(h,ownerId,applied);recordCreatureHit(h,e,ownerId);}
  if(applied>=1)pushCombatText(h,{x:e.x,y:e.y-22,value:applied});
  if(h.upgrades.ember>0){e.burn=Math.max(e.burn??0,1.6+h.upgrades.ember*.55);h.effectsApplied++;}
  if(h.upgrades.frostbite>0){e.slow=Math.max(e.slow,1+h.upgrades.frostbite*.45);h.effectsApplied++;}
  if(h.upgrades.spores>0){e.spore=Math.max(e.spore??0,2+h.upgrades.spores*.6);h.effectsApplied++;}
  if(h.upgrades.frostbite&&h.upgrades.spores){e.slow=Math.max(e.slow,1.7);e.spore=Math.max(e.spore??0,2.6);}
  if(push && e.kind!=='boss'){
    const len=Math.max(1,Math.hypot(dx,dy));
    e.x=clamp(e.x+dx/len*push,-35,HORDE_WIDTH+35);
    e.y=clamp(e.y+dy/len*push,-35,HORDE_HEIGHT+35);
  }
}
function triggerFamilySignature(h,s,p,count,attack){
 const signature=combatSignature(p.species,count);
 if(!signature)return;
 h.familySignatureCount=(h.familySignatureCount||0)+1;
 const {action,strength}=signature,foes=h.enemies.filter(e=>e.hp>0).sort((a,b)=>distance(a,h.hero)-distance(b,h.hero));
 pushCombatText(h,{x:h.hero.x,y:h.hero.y-70,label:familyTalent(p.species)?.name,kind:'skill'});
 const primary=foes[0],hp=maxPartyHp(s);
 const strike=(e,power)=>{if(e)hit(h,e,power,0,0,0,p.id);};
 if(action==='flame')for(const e of foes.filter(e=>distance(e,h.hero)<170))strike(e,attack*.16*strength);
 if(action==='chain')for(const e of foes.slice(0,3)){strike(e,attack*.19*strength);e.slow=Math.max(e.slow,1.1*strength);}
 if(action==='freeze')for(const e of foes.filter(e=>distance(e,h.hero)<195)){e.slow=Math.max(e.slow,2.1*strength);creditSupport(h,p.id,'control',1);}
 if(action==='bulwark'){const before=h.shieldPool;h.shieldPool=Math.min(hp*.16,h.shieldPool+hp*.018*strength);creditSupport(h,p.id,'shield',h.shieldPool-before);}
 if(action==='tideSlash')for(const e of foes.filter(e=>distance(e,h.hero)<220).slice(0,5))strike(e,attack*.24*strength);
 if(action==='sunHeal'){const before=s.partyHp;s.partyHp=Math.min(hp,s.partyHp+hp*.012*strength);creditSupport(h,p.id,'healing',s.partyHp-before);}
 if(action==='shadowStrike')strike(primary,attack*.65*strength);
 if(action==='starShield'){const before=h.shieldPool;h.shieldPool=Math.min(hp*.16,h.shieldPool+hp*.014*strength);creditSupport(h,p.id,'shield',h.shieldPool-before);strike(primary,attack*.19*strength);}
 if(action==='venom')for(const e of foes.slice(0,4)){strike(e,attack*.12*strength);e.spore=Math.max(e.spore??0,2*strength);}
 if(action==='ironPush')for(const e of foes.filter(e=>distance(e,h.hero)<140)){strike(e,attack*.14*strength);const dx=e.x-h.hero.x,dy=e.y-h.hero.y,length=Math.max(1,Math.hypot(dx,dy));e.x=clamp(e.x+dx/length*25*strength,-35,HORDE_WIDTH+35);e.y=clamp(e.y+dy/length*25*strength,-35,HORDE_HEIGHT+35);}
 h.pulses.push({x:h.hero.x,y:h.hero.y,radius:130,life:.55,max:.55,kind:'familySignature',action,color:SPECIES[p.species].type});
}
function offer(h){
  h.pending=buildOffer(h,()=>rand(h));h.autoChoice=0;
}
export function chooseHordeUpgrade(h,key){
  if(!h.pending.includes(key)||!buildPool(h).includes(key))return false;
  h.upgrades[key]++;h.pending=[];h.autoChoice=0;h.lessonUpgraded=true;
  h.notice=key;return true;
}
function addExperience(h,value) {
  if(h.rank>=50)return;
  h.xp+=value*(1+h.upgrades.harvest*.14);
  const threshold=7+h.rank*3;
  if(h.xp>=threshold && !h.pending.length){
    h.xp-=threshold;h.rank++;offer(h);
  }
}
export function finishHordePack(h,s,boss=false){
  if(boss){ h.bossCleared=true;h.finished=true;grantHordeGuardian(s);return;}
  h.kills++;
  addExperience(h,1);
  if(h.kills%8!==0)return;
  h.packs++;
  // 每八只群潮敌人才结算一份奖励，绝不复用旧版“每只怪完整收益”。
  grantHordeMilestone(s,(1+h.upgrades.fortune*0.07)*challengeTier(h).reward);
}
function cast(h,s,index){
  const allies=teamMembers(s), p=allies[index];if(!p)return;
  const mode=SPECIES[p.species].family%3;
  const attacking=SPECIES[p.species];
  const foe=nearest(h,h.hero.x,h.hero.y,540);
  const baseMatch=foe?elementalMatch(attacking,SPECIES[foe.species]):1;
  const specialty=combatRole(s,p.id);
  const attack=creatureAttack(p,s)*(1+familyTeamBonuses(s).damage)*.92*(1+h.upgrades.echo*.075)*baseMatch*trainingMultiplier(s,p.id,'element')*guardianBonus(s,h.region)*roleAttackMultiplier(s,p.id);
  if(specialty.role==='guardian')h.shieldPool=Math.min(maxPartyHp(s)*.16,h.shieldPool+maxPartyHp(s)*.004*specialty.rank);
  const angles=[-0.9,1.8,0.65],ox=h.hero.x+Math.cos(angles[index])*39,oy=h.hero.y+Math.sin(angles[index])*32;
  const target=nearest(h,ox,oy,500);
  h.skillCasts[index]++;
  recordCreatureCast(h,p,index);
  triggerFamilySignature(h,s,p,h.skillCasts[index],attack);
  if(specialty.role==='control')for(const e of h.enemies)if(e.hp>0&&distance(e,h.hero)<180)e.slow=Math.max(e.slow,.8+.45*specialty.rank);
  if(mode===0){ // 追踪叶针，快速直射与穿透弹体
    if(!target)return;
    const a=Math.atan2(target.y-oy,target.x-ox);
    const count=1+(h.upgrades.rapid>=2?1:0)+h.upgrades.multishot;
    for(let j=0;j<count;j++){
      const arc=a+(j-(count-1)/2)*(h.upgrades.multishot?.22:.18);
      h.projectiles.push({x:ox,y:oy,vx:Math.cos(arc)*460,vy:Math.sin(arc)*460,
        life:1.35,r:6,damage:attack*(1+h.upgrades.rapid*.14),pierce:1+h.upgrades.pierce+(h.upgrades.ember&&h.upgrades.pierce?1:0),
        bounce:h.upgrades.ricochet,hit:[],ownerId:p.id,source:attacking.secondaryType??attacking.type});
    }
  } else if(mode===1){ // 环状范围技，近身敌人同时受伤
    const radius=145+h.upgrades.orbit*17;
    for(const e of h.enemies) if(distance(e,h.hero)<radius+e.r){
      hit(h,e,attack*.75*(1+h.upgrades.orbit*.16),e.x-h.hero.x,e.y-h.hero.y,-h.upgrades.gravity*6,p.id);
    }
    h.pulses.push({x:h.hero.x,y:h.hero.y,radius,life:0.45,max:0.45,kind:'orbit',color:attacking.secondaryType??attacking.type});
  } else { // 扇形冲击波，击退多个敌人
    const base=target?Math.atan2(target.y-oy,target.x-ox):Math.sin(h.elapsed*2.3);
    const radius=180+h.upgrades.knock*15;
    for(const e of h.enemies) {
      const dx=e.x-ox,dy=e.y-oy,len=Math.hypot(dx,dy),delta=Math.atan2(Math.sin(Math.atan2(dy,dx)-base),Math.cos(Math.atan2(dy,dx)-base));
      if(len<radius+e.r&&Math.abs(delta)<0.9)hit(h,e,attack*.72,dx,dy,30+h.upgrades.knock*11,p.id);
    }
    h.pulses.push({x:ox,y:oy,radius,angle:base,life:0.38,max:0.38,kind:'cone',color:attacking.secondaryType??attacking.type});
  }
}
// E2-B手动主动战技：只对当前队伍可施放，同伴换装备不清除本局冷却。
export function castHordeActive(h,s,id){
 const p=teamMembers(s).find(member=>member.id===id);
 if(!p)return false;
 const attack=creatureAttack(p,s)*trainingMultiplier(s,p.id,'element')*guardianBonus(s,h.region)*roleAttackMultiplier(s,p.id);
 return performActiveSkill(h,s,p,(e,damage,dx,dy,push)=>hit(h,e,damage,dx,dy,push,p.id),attack,maxPartyHp(s));
}
export function triggerHordePulse(h,s) {
  if(!s.running || h.finished || s.energy<100 || h.pending.length)return false;
  s.energy=0;
  const power=teamMembers(s).reduce((sum,p)=>sum+creatureAttack(p,s),0);
  for(const e of h.enemies)if(distance(e,h.hero)<340+e.r){
    hit(h,e,power*3.6,e.x-h.hero.x,e.y-h.hero.y,66);
  }
  h.pulses.push({x:h.hero.x,y:h.hero.y,radius:340,life:.6,max:.6,kind:'ultimate'});
  addLog(s,'logUltimate');return true;
}
export function captureHordeTarget(h,s) {
  if(!s.running||h.finished||h.pending.length||s.balls<1)return 'unavailable';
  const target=h.enemies.filter(e=>e.kind!=='boss'&&e.hp>0&&e.hp/e.maxHp<=0.6)
    .sort((a,b)=>Number(!!SPECIES[b.species].rareVariantOf)-Number(!!SPECIES[a.species].rareVariantOf)||distance(a,h.hero)-distance(b,h.hero))[0];
  if(!target)return 'noTarget';
  s.balls--;
  const chance=Math.min(.9,.26+.61*(1-target.hp/target.maxHp));
  if(rand(h)>=chance) return 'miss';
  if(!grantHordeCapture(s,target.species,Math.min(100,5+Math.floor(h.elapsed/35)))) return 'miss';
  target.hp=0; // 群潮中的结契按一次清怪计数，不重复给予一份单体战斗奖励。
  h.enemies=h.enemies.filter(e=>e!==target);
  finishHordePack(h,s);
  return 'success';
}
function spawnElite(h,s) {
  const e=spawn(h,s);
  e.kind='elite';e.r=26;e.speed*=.88;
  e.hp*=5;e.maxHp=e.hp;e.attack*=1.7;e.abilityClock=3;
  e.eliteRole=['charger','warder','caster'][h.eliteCount%3];
  if(e.eliteRole==='warder')e.shield=2.5;
  h.eliteCount++;
  h.notice='elite';
  return e;
}
function regionEffect(h,s,dt){
  h.regionClock+=dt;h.regenClock+=dt;
  const adapted=teamMembers(s).some(p=>SPECIES[p.species].region===h.region);
  if(h.regenClock<1)return;
  h.regenClock-=1;
  if(h.region===0)s.partyHp=Math.min(maxPartyHp(s),s.partyHp+maxPartyHp(s)*.003);
  if(h.upgrades.regen>0)s.partyHp=Math.min(maxPartyHp(s),s.partyHp+maxPartyHp(s)*Math.min(.014,h.upgrades.regen*.002));
  if(h.upgrades.bulwark>0&&h.upgrades.regen>0)h.shieldPool=Math.min(maxPartyHp(s)*.15,h.shieldPool+maxPartyHp(s)*.001);
  if(h.upgrades.awakeningVortex>0){
    h.vortexClock+=1;
    if(h.vortexClock>=4){h.vortexClock=0;
      const radius=195+h.upgrades.orbit*11;
      for(const e of h.enemies)if(e.hp>0&&distance(e,h.hero)<radius+e.r)hit(h,e,24+h.upgrades.gravity*12,e.x-h.hero.x,e.y-h.hero.y,-15);
      h.pulses.push({x:h.hero.x,y:h.hero.y,radius,life:.55,max:.55,kind:'vortex'});
    }
  }
  if(h.region===2)s.energy=Math.min(100,s.energy+(Math.floor(h.elapsed/12)%2===0?3:1));
  if(h.region===3)for(const e of h.enemies)if(distance(e,h.hero)<120)e.slow=Math.max(e.slow,.7);
  if(h.region===4) s.partyHp=Math.min(maxPartyHp(s),s.partyHp+maxPartyHp(s)*(adapted?.004:-.006));
  if(h.region===5)for(const e of h.enemies)if(e.kind==='boss'||e.kind==='elite')e.shield=Math.min(3,(e.shield||0)+.5);
}
function spawnWarning(h,s,e) {
  h.dangerMarkers.push({
    shape:'circle',style:'eliteStrike',source:'elite',
    x:clamp(h.hero.x,52,908),y:clamp(h.hero.y,52,488),
    r:e.kind==='boss'?105:68,life:1.15,max:1.15,
    damage:e.kind==='boss'?maxPartyHp(s)*.035:maxPartyHp(s)*.025,
  });
  if(e.kind==='boss')h.bossAttacks++;
}
function resolveWarnings(h,s,dt) {
  const lead=scoutWarningLead(s);
  for(const mark of h.dangerMarkers){
    if(lead>0&&!mark.scoutEnhanced){mark.life+=lead;mark.max+=lead;mark.scoutEnhanced=true;}
    mark.life-=dt;
    if(mark.life<=0&&insideWarning(mark,h.hero)) {
      const damage=Math.min(mark.damage,maxPartyHp(s)*.12);
      const shielded=Math.min(h.shieldPool,damage);h.shieldPool-=shielded;
      s.partyHp-=damage-shielded;
      if(mark.status==='spore')h.heroSlow=Math.max(h.heroSlow,2.4);
      h.impact=.25;
    }
  }
  h.hazardsDodged+=(h.dangerMarkers.filter(m=>m.life<=0&&!insideWarning(m,h.hero)).length);
  h.dangerMarkers=h.dangerMarkers.filter(m=>m.life>0);
}
// 携带物品仅限当前试炼；冷却根据局内经过时间计算，暂停时不推进。
export function useHordeSupply(h,s,slot){
  if(!['potion','tool'].includes(slot)||!s.running||h.finished||h.pending.length)return false;
  const id=h.supplySlots?.[slot];
  if(!id||(h.supplies[id]??0)<1||h.elapsed-(h.itemCooldowns[slot]??-100)<(slot==='potion'?30:40))return false;
  if(slot==='potion'&&s.partyHp>=maxPartyHp(s))return false;
  if(id==='herbalPotion')s.partyHp=Math.min(maxPartyHp(s),s.partyHp+maxPartyHp(s)*.25);
  else if(id==='recoveryDraught')s.partyHp=Math.min(maxPartyHp(s),s.partyHp+maxPartyHp(s)*.30);
  else if(id==='fortifiedDraught')s.partyHp=Math.min(maxPartyHp(s),s.partyHp+maxPartyHp(s)*.35);
  else if(id==='repelVial'||id==='reinforcedDisc'){
    for(const e of h.enemies)if(e.hp>0&&distance(e,h.hero)<240){
      const dx=e.x-h.hero.x,dy=e.y-h.hero.y;
      hit(h,e,id==='reinforcedDisc'?52:28,dx,dy,id==='reinforcedDisc'?85:60);
    }
    h.pulses.push({x:h.hero.x,y:h.hero.y,radius:240,life:.65,max:.65,kind:'ultimate'});
  }else if(id==='energySeal')s.energy=Math.min(100,s.energy+20);
  else if(id==='swiftSigil'){h.heroSlow=0;h.heroHaste=6;}
  else if(id==='frostVial')for(const e of h.enemies)if(distance(e,h.hero)<250)e.slow=Math.max(e.slow,3);
  h.supplies[id]--;h.itemCooldowns[slot]=h.elapsed;
  addLog(s,'logCampItem');return true;
}
export function returnUnusedSupplies(h,s){
  if(h.suppliesReturned)return false;
  const c=ensureCamp(s);for(const [id,n] of Object.entries(h.supplies??{})){
    if(Object.hasOwn(c.consumables,id))c.consumables[id]=Math.min(99,c.consumables[id]+n);
  }
  h.suppliesReturned=true;return true;
}
export function stepHorde(h,s,dt=1/30){
  if(!s.running||h.finished||h.region!==s.region)return;
  dt=clamp(dt,0,1/15);
  if(h.pending.length) {
    if(s.settings.autoUpgrade){h.autoChoice+=dt;if(h.autoChoice>=1.5)chooseHordeUpgrade(h,h.pending[0]);}
    return;
  }
  h.elapsed+=dt;
  advanceCombatText(h,dt);
  if(s.camp?.autoActiveSkills){
    for(const p of teamMembers(s))castHordeActive(h,s,p.id);
  }
  const resonanceTick=Math.floor(h.elapsed/9);
  if(resonanceTick>h.resonanceTick){
    h.resonanceTick=resonanceTick;
    if(resonanceTick>0)applyResonance(h,s,maxPartyHp(s));
  }
  const fieldSupport=familyFieldSupport(s);
  updateHordeDevices(h,s,dt,maxPartyHp(s));
  const oldX=h.hero.x,oldY=h.hero.y;
  // 无法击败守护者的试炼在十分钟时安全撤离，避免快照无限增长而失效。
  if(h.elapsed>=590){h.finished=true;h.defeated=true;h.notice='timeout';addLog(s,'logDefeat');returnUnusedSupplies(h,s);return;}
  h.heroSlow=Math.max(0,h.heroSlow-dt);
  h.heroHaste=Math.max(0,h.heroHaste-dt);
  advanceHero(h,dt);
  markMovement(h,{x:oldX,y:oldY},h.hero);
  h.motionTime=Math.hypot(h.hero.x-oldX,h.hero.y-oldY)>.08?1:Math.max(0,h.motionTime-dt);
  regionEffect(h,s,dt);
  resolveWarnings(h,s,dt);
  h.impact=Math.max(0,h.impact-dt);
  h.contactWindow+=dt;
  if(h.contactWindow>=1){h.contactWindow%=1;h.contactDamage=0;}
  for(const p of h.pulses)p.life-=dt;
  h.pulses=h.pulses.filter(p=>p.life>0);
  for(const e of h.enemies){
    e.flash=Math.max(0,e.flash-dt);e.hitCooldown=Math.max(0,e.hitCooldown-dt);e.slow=Math.max(0,e.slow-dt);
    const dot=((e.burn??0)>0?h.upgrades.ember*3:0)+((e.spore??0)>0?h.upgrades.spores*2.8:0);
    if(dot>0){const applied=Math.min(e.hp,dot*dt);e.hp-=applied;h.combatDamage+=applied;}
    e.burn=Math.max(0,(e.burn??0)-dt);e.spore=Math.max(0,(e.spore??0)-dt);
  }
  if(!h.training&&!h.bossStarted && h.elapsed>=100){h.bossStarted=true;spawn(h,s,true);h.bossPhase=1;h.bossMechanic=BOSS_STYLES[h.region].kind;h.notice='boss';}
  h.eliteClock+=dt;
  if(!h.training&&!h.bossStarted&&h.elapsed>=24&&h.eliteClock>=29){h.eliteClock=0;spawnElite(h,s);}
  const cap=h.training?6:h.bossStarted?22:Math.min(52,Math.floor(9+h.elapsed*.30));
  h.spawnClock-=dt;
  if(h.spawnClock<=0&&h.enemies.length<cap){
    spawn(h,s);
    h.spawnClock=(h.bossStarted?1.25:Math.max(.19,.76-h.elapsed*.004))*(.75+rand(h)*.5);
  }
  for(const e of h.enemies){
    const dx=h.hero.x-e.x,dy=h.hero.y-e.y,len=Math.max(1,Math.hypot(dx,dy));
    const gap=e.kind==='boss'?72:e.kind==='elite'?56:43;
    if((e.kind==='boss'||e.kind==='elite')&&e.hp>0){
      if(e.kind==='boss'){
        if(e.phase===1&&e.hp/e.maxHp<=.5){e.phase=2;h.bossPhase=2;h.notice='bossPhase2';e.abilityClock=Math.min(e.abilityClock,.75);
          h.pulses.push({x:e.x,y:e.y,radius:110,life:.7,max:.7,kind:'bossPhase'});
        }
      }
      e.abilityClock=(e.abilityClock??3)-dt;
      if(e.abilityClock<=0){
        if(e.kind==='boss')createBossWarnings(h,s,e,()=>rand(h));else createEliteWarning(h,s,e);
        e.abilityClock=e.kind==='boss'?(e.phase===2?3.8:5.8):7.5;
      }
    }
    if(len>gap){
      const speed=e.speed*challengeTier(h).speed*(e.slow>0?.65:1)*(h.region===2&&Math.floor(h.elapsed/6)%2===1?1.14:1);
      e.x+=dx/len*speed*dt;e.y+=dy/len*speed*dt;
    } else if(e.hitCooldown<=0){
      // 同时近身的群怪共享秒级伤害预算，不会因实体叠身瞬间秒杀。
      const budget=maxPartyHp(s)*.016;
      const adapted=teamMembers(s).some(p=>SPECIES[p.species].region===h.region);
      const regionPressure=h.region===1&&!adapted?1.17:1;
      const first=teamMembers(s)[0];
      const match=first?elementalMatch(SPECIES[e.species],SPECIES[first.species]):1;
      const damage=Math.min(e.attack*challengeTier(h).attack*(1-h.upgrades.guard*.055)*(1-familyTeamBonuses(s).guard)*(1-fieldSupport.shield)*(1-fieldSupport.vision)*regionPressure*Math.max(.8,Math.min(1.2,match)),Math.max(0,budget-h.contactDamage));
      const shielded=Math.min(h.shieldPool,damage);h.shieldPool-=shielded;
      s.partyHp-=damage-shielded;h.contactDamage+=damage;
      e.hitCooldown=e.kind==='boss'?1.15:1.55;
      if(damage>0)h.impact=.25;
    }
  }
  for(let i=0;i<3;i++){
    if(!teamMembers(s)[i])continue;
    h.timers[i]-=dt;
    if(h.timers[i]<=0){
      cast(h,s,i);
      const mode=SPECIES[teamMembers(s)[i].species].family%3;
      h.timers[i]=[.65,2.25,2.65][mode]/(1+h.upgrades.rapid*.09);
    }
  }
  for(const bullet of h.projectiles) {
    bullet.x+=bullet.vx*dt;bullet.y+=bullet.vy*dt;bullet.life-=dt;
    if(bullet.life<=0)continue;
    for(const e of h.enemies){
      if(e.hp<=0||bullet.hit.includes(e.id))continue;
      const dx=e.x-bullet.x,dy=e.y-bullet.y;
      if(dx*dx+dy*dy<(e.r+bullet.r)**2){
        hit(h,e,bullet.damage,dx,dy,5,bullet.ownerId);bullet.hit.push(e.id);
        if(h.upgrades.chain>0){
          const other=h.enemies.filter(t=>t!==e&&t.hp>0&&!bullet.hit.includes(t.id)&&distance(t,e)<145)
            .sort((a,b)=>distance(a,e)-distance(b,e))[0];
          if(other){hit(h,other,bullet.damage*(.3+h.upgrades.chain*.09),0,0,0,bullet.ownerId);h.pulses.push({x:e.x,y:e.y,radius:Math.max(15,distance(e,other)),life:.19,max:.19,kind:'chain'});
            if(h.upgrades.ricochet>0){const extra=h.enemies.find(t=>t!==other&&t!==e&&t.hp>0&&distance(t,other)<110);if(extra)hit(h,extra,bullet.damage*.2,0,0,0,bullet.ownerId);}
          }
        }
        if((bullet.bounce??0)>0){
          const next=h.enemies.filter(t=>t!==e&&t.hp>0&&!bullet.hit.includes(t.id)&&distance(t,e)<240)
            .sort((a,b)=>distance(a,e)-distance(b,e))[0];
          if(next){const a=Math.atan2(next.y-e.y,next.x-e.x);
            h.projectiles.push({...bullet,x:e.x,y:e.y,vx:Math.cos(a)*420,vy:Math.sin(a)*420,
              damage:bullet.damage*.65,bounce:bullet.bounce-1,pierce:1,hit:[...bullet.hit],life:.65});
          }
        }
        bullet.pierce--;if(bullet.pierce<=0){bullet.life=0;break;}
      }
    }
  }
  h.projectiles=h.projectiles.filter(b=>b.life>0&&b.x>-60&&b.x<1020&&b.y>-60&&b.y<600).slice(-150);
  const dead=h.enemies.filter(e=>e.hp<=0);
  h.enemies=h.enemies.filter(e=>e.hp>0);
  for(const e of dead) {
    if(e.kind==='boss'){finishHordePack(h,s,true);break;}
    if(h.upgrades.burst>0){
      const radius=60+h.upgrades.burst*13+(h.upgrades.awakeningNova?50:0)+(h.upgrades.ember?12:0);
      const bonus=18+h.upgrades.burst*13+(h.upgrades.awakeningNova?23:0)+(h.upgrades.ember?8:0);
      for(const other of h.enemies)if(other.hp>0&&distance(e,other)<radius)hit(h,other,bonus);
      h.pulses.push({x:e.x,y:e.y,radius,life:.34,max:.34,kind:'burst'});
    }
    if(h.upgrades.vampire>0&&(h.kills+1)%6===0){
      s.partyHp=Math.min(maxPartyHp(s),s.partyHp+maxPartyHp(s)*h.upgrades.vampire*.008);
    }
    if(h.upgrades.bulwark>0)h.shieldPool=Math.min(maxPartyHp(s)*.15,h.shieldPool+maxPartyHp(s)*.002*h.upgrades.bulwark);
    if(e.kind==='elite'){
      s.materials[s.region]=Math.min(1e12,s.materials[s.region]+2);
      s.energy=Math.min(100,s.energy+10);
    }
    finishHordePack(h,s);
    s.energy=Math.min(100,s.energy+2);
  }
  if(s.settings.autoExplore&&s.scoutEnergy>=5){
    // 群潮战斗与现有生态材料循环兼容。
    s.scoutEnergy-=5;s.materials[s.region]+=3+s.depths[s.region];
  }
  if(s.settings.autoHeal&&s.partyHp>0&&s.partyHp<maxPartyHp(s)*.35)heal(s);
  if(s.partyHp<=0) {
    s.partyHp=maxPartyHp(s);s.energy=0;s.wins=0;
    h.finished=true;h.defeated=true;h.notice='defeat';addLog(s,'logDefeat');
  }
  if(h.finished)returnUnusedSupplies(h,s);
}
