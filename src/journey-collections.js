// 永久遗物/地域藏品与旧纪念物分开保存；已拥有ID即领取收据，不产生重复掉落收益。
export const JOURNEY_RELICS=Object.freeze([
 ['dewCasket',0,'leaf'],['duskPipe',1,'sun'],['tideBottle',2,'potion'],
 ['snowBadge',3,'compass'],['sporeCasket',4,'spark'],['aetherCore',5,'bolt'],
].map(([id,region,icon])=>Object.freeze({id,region,icon,kind:'relic'})));
export const REGIONAL_CURIOS=Object.freeze([
 ['mossScroll',0,'book'],['clayShard',1,'shield'],['seaGlass',2,'ball'],
 ['snowCrystal',3,'spark'],['sporeSachet',4,'leaf'],['starChart',5,'map'],
].map(([id,region,icon])=>Object.freeze({id,region,icon,kind:'curio'})));
export const CURIO_RESEARCH_REWARD=40;
const ALL=[...JOURNEY_RELICS,...REGIONAL_CURIOS],CAP=1e12;
export const journeyItem=id=>ALL.find(item=>item.id===id)??null;
export const journeyCollection=s=>s.journeyCollection??{relics:[],curios:[],selected:null,research:[]};
function ensure(s){return s.journeyCollection??={relics:[],curios:[],selected:null,research:[]};}
export function journeyItemAvailable(s,item){
 const source=item?.kind==='relic'?s.bossCleared:s.camp?.expeditions?.finds;
 return !!item&&item.region<=s.unlockedRegion&&Array.isArray(source)&&source.includes(item.region);
}
export function claimJourneyItem(s,id){
 const item=journeyItem(id);if(!journeyItemAvailable(s,item))return false;
 const key=item.kind==='relic'?'relics':'curios';
 if(journeyCollection(s)[key].includes(id))return false;
 ensure(s)[key].push(id);return true;
}
export function equipJourneyRelic(s,id){
 const book=journeyCollection(s);
 if(id!==null&&(!JOURNEY_RELICS.some(item=>item.id===id)||!book.relics.includes(id)))return false;
 if(book.selected===id)return false;
 ensure(s).selected=id;return true;
}
export function claimCurioResearch(s,id){
 const book=journeyCollection(s);
 if(!book.curios.includes(id)||book.research.includes(id)||s.coins>CAP-CURIO_RESEARCH_REWARD)return false;
 ensure(s).research.push(id);s.coins+=CURIO_RESEARCH_REWARD;return true;
}
export function validateJourneyCollection(s){
 const book=s.journeyCollection;if(book===undefined)return true;
 if(!book||typeof book!=='object'||Array.isArray(book)||Object.keys(book).length!==4
  ||!['relics','curios','selected','research'].every(key=>Object.hasOwn(book,key)))return false;
 const list=(values,items)=>Array.isArray(values)&&values.length<=6&&new Set(values).size===values.length
  &&values.every(id=>items.some(item=>item.id===id)&&journeyItemAvailable(s,journeyItem(id)));
 return list(book.relics,JOURNEY_RELICS)&&list(book.curios,REGIONAL_CURIOS)
  &&Array.isArray(book.research)&&book.research.length<=6&&new Set(book.research).size===book.research.length
  &&book.research.every(id=>book.curios.includes(id))&&(book.selected===null||book.relics.includes(book.selected));
}
export function validateRunRelic(s,h){
 if(h.runRelic===undefined&&h.relicState===undefined)return true;
 const state=h.relicState;
 if(h.runRelic!==null&&!journeyCollection(s).relics.includes(h.runRelic))return false;
 if(!state||typeof state!=='object'||Array.isArray(state)||Object.keys(state).length!==5
  ||!['lastDamageAt','healTick','nextProcAt','fieldXp','ultimateSpent'].every(key=>Object.hasOwn(state,key)))return false;
 return Number.isFinite(state.lastDamageAt)&&state.lastDamageAt>=0&&state.lastDamageAt<=h.elapsed+.001
  &&Number.isInteger(state.healTick)&&state.healTick>=0&&state.healTick<=Math.floor((h.elapsed+.001)/12)
  &&Number.isFinite(state.nextProcAt)&&state.nextProcAt>=0&&state.nextProcAt<=h.elapsed+8.001
  &&Number.isInteger(state.fieldXp)&&state.fieldXp>=0&&state.fieldXp<=8&&typeof state.ultimateSpent==='boolean';
}
