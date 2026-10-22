// 30条原创家族的固有天赋：进化提高倍率，能力只依照当前伙伴计算，不新增存档字段。
import {SPECIES} from './data.js';
export const FAMILY_TALENTS=Object.freeze([
 ['狐焰追袭','assault',.052],['雷岩震击','assault',.047],['霜影猎步','assault',.054],['熔岳坚甲','guard',.050],['潮刃连斩','assault',.049],
 ['辉翼祝福','guard',.044],['夜猎突袭','assault',.062],['星甲守御','guard',.057],['毒棘侵蚀','assault',.058],['铁拳破阵','assault',.060],
 ['林铃伐木','logging',.11],['地心采矿','mining',.12],['菌境采药','herbalism',.13],['净泉拾贝','beachcombing',.12],['沙漠搜集','foraging',.12],
 ['百工矿采','mining',.10],['风叶采集','foraging',.13],['百草采药','herbalism',.12],['炎铸采矿','mining',.11],['星轨星矿','starmining',.14],
 ['风羽巡游','scout',.06],['星灯引路','scout',.075],['影迹探路','scout',.065],['深潮探宝','scout',.07],['织梦远行','scout',.06],
 ['沙海侦察','scout',.07],['菌境寻迹','scout',.075],['夜烛远征','scout',.08],['晶角探秘','scout',.07],['云歌巡航','scout',.065]
].map(([name,kind,bonus],index)=>Object.freeze({family:12+index,name,kind,bonus})));
export function familyTalent(speciesId){
 const s=SPECIES[speciesId],item=s&&FAMILY_TALENTS[s.family-12];
 return item?{...item,stage:s.stage,amount:Math.round(item.bonus*(1+s.stage*.3)*10000)/10000}:null;
}
export function talentBonus(speciesId,kind){const item=familyTalent(speciesId);return item?.kind===kind?item.amount:0;}
export const FAMILY_SYNERGIES=Object.freeze([
 {name:'烈焰突围',families:[12,15,30],kind:'damage',bonus:.055},
 {name:'雷铁协奏',families:[13,21,27],kind:'damage',bonus:.05},
 {name:'潮光守护',families:[16,17,25],kind:'guard',bonus:.065},
 {name:'森菌共生',families:[22,24,26],kind:'guard',bonus:.06},
 {name:'星夜猎团',families:[18,19,33],kind:'damage',bonus:.07},
 {name:'风之远行',families:[28,32,41],kind:'damage',bonus:.05}
]);
export function activeFamilySynergies(state){
 const families=new Set((state.team??[]).map(id=>state.collection.find(p=>p.id===id)).filter(Boolean).map(p=>SPECIES[p.species]?.family));
 return FAMILY_SYNERGIES.filter(combo=>combo.families.filter(f=>families.has(f)).length>=2).map(combo=>({...combo,tier:combo.families.every(f=>families.has(f))?2:1}));
}
// 每第4次普通战技发动一次家族招式，战斗效果由群潮引擎统一执行。
const COMBAT_SIGNATURES=['flame','chain','freeze','bulwark','tideSlash','sunHeal','shadowStrike','starShield','venom','ironPush'];
export function combatSignature(speciesId,castCount){
 const item=familyTalent(speciesId),index=item?.family-12;
 if(!item||index<0||index>=10||castCount%4!==0)return null;
 return {action:COMBAT_SIGNATURES[index],strength:1+item.stage*.3};
}
const EXPLORER_MODES=['windSurvey','dreamGuidance','shadowTracking','tideTreasure','dreamWeave','dustScout','sporeFind','nightLantern','crystalTrace','cloudFlight'];
export function expeditionTalentReward(speciesId,kind,region){
 const item=familyTalent(speciesId),index=item?.family-32;
 if(!item||index<0||index>=10)return {resources:0,coins:0,material:0,mode:null};
 const rank=1+item.stage;
 const modes=[
   {resources:rank}, {coins:12*rank}, {material:kind==='delve'?1:0,coins:kind==='delve'?0:6*rank},
   {resources:region===2?2*rank:rank}, {coins:9*rank},
   {resources:rank+1}, {resources:rank}, {material:kind==='delve'?1:0,coins:5*rank},
   {material:kind==='delve'?1:0,resources:rank}, {coins:8*rank,resources:rank}
 ];
 return {resources:0,coins:0,material:0,...modes[index],mode:EXPLORER_MODES[index]};
}
export function familyTeamBonuses(state){
 const members=(state.team??[]).map(id=>state.collection.find(p=>p.id===id)).filter(Boolean);
 const combos=activeFamilySynergies(state);
 const focuses=new Set(members.map(p=>SPECIES[p.species]?.focus).filter(Boolean));
 const triRole=focuses.has('battle')&&focuses.has('work')&&focuses.has('explore');
 return {damage:Math.min(.32,members.reduce((n,p)=>n+talentBonus(p.species,'assault'),0)+(triRole?.035:0)+combos.filter(c=>c.kind==='damage').reduce((n,c)=>n+c.bonus*(c.tier===2?1.35:1),0)),
 guard:Math.min(.27,members.reduce((n,p)=>n+talentBonus(p.species,'guard'),0)+(triRole?.025:0)+combos.filter(c=>c.kind==='guard').reduce((n,c)=>n+c.bonus*(c.tier===2?1.35:1),0)),combos};
}
