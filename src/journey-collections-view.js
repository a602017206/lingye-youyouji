import {REGIONS} from './data.js';
import {JOURNEY_RELICS,REGIONAL_CURIOS,CURIO_RESEARCH_REWARD,journeyCollection,journeyItemAvailable} from './journey-collections.js';
export function journeyCollectionView(s,tr,icon){
 const book=journeyCollection(s),name=id=>tr(id?'journeyName'+id:'journeyNone');
 const card=item=>{
  const relic=item.kind==='relic',owned=(relic?book.relics:book.curios).includes(item.id),available=journeyItemAvailable(s,item);
  const source=tr(relic?'journeyRelicSource':'journeyCurioSource',{region:tr(REGIONS[item.region].name)});
  let action='';
  if(!owned)action=`<button class="secondary-button" data-journey-claim="${item.id}" ${available?'':'disabled'}>${tr('journeyTake')}</button>`;
  else if(relic)action=`<button class="secondary-button" data-journey-equip="${item.id}" ${book.selected===item.id?'disabled':''} aria-pressed="${book.selected===item.id}">${tr(book.selected===item.id?'journeyEquipped':'journeyEquip')}</button>`;
  else{
   const done=book.research.includes(item.id),full=s.coins>1e12-CURIO_RESEARCH_REWARD;
   action=`<details class="journey-story"><summary>${tr('journeyRead')}</summary><p>${tr('journeyStory'+item.id)}</p></details>`
    +`<button class="secondary-button" data-curio-research="${item.id}" ${done||full?'disabled':''}>${tr(done?'journeyResearchDone':full?'journeyResearchFull':'journeyResearch',{coins:CURIO_RESEARCH_REWARD})}</button>`;
  }
  return `<article class="journey-item ${owned?'is-owned':''}" data-journey-id="${item.id}" data-owned="${owned}">`
   +`<header><span class="journey-emblem">${icon(item.icon)}</span><div><h3>${name(item.id)}</h3><small>${tr(REGIONS[item.region].name)} · ${tr(owned?'journeyOwned':available?'journeyReady':'journeyLocked')}</small></div></header>`
   +`<p>${relic?tr('journeyDesc'+item.id):tr(owned?'journeyCurioEffect':'journeyStoryLocked',{coins:CURIO_RESEARCH_REWARD})}</p><p class="journey-source">${source}</p>${action}</article>`;
 };
 return `<section class="journey-museum" aria-label="${tr('journeyTitle')}" data-owned-relics="${book.relics.length}" data-owned-curios="${book.curios.length}">`
  +`<div class="section-heading"><h2>${icon('book')}${tr('journeyTitle')}</h2><small>${tr('journeyCollectionProgress',{relics:book.relics.length,curios:book.curios.length})}</small></div><p>${tr('journeyGuide')}</p>`
  +`<div class="journey-loadout"><strong>${tr('journeySelected',{name:name(book.selected)})}</strong><span>${tr('journeySelectGuide')}</span><button class="secondary-button" data-journey-equip="none" ${book.selected===null?'disabled':''}>${tr('journeyClear')}</button><button class="secondary-button" data-action="camp-prepare-run">${tr('journeyDepart')}</button></div>`
  +`<h3>${tr('journeyRelics')}</h3><div class="journey-grid">${JOURNEY_RELICS.map(card).join('')}</div><h3>${tr('journeyCurios')}</h3><div class="journey-grid">${REGIONAL_CURIOS.map(card).join('')}</div><p class="journey-art-note">${tr('journeyArtNote')}</p></section>`;
}
