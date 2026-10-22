// 守护者纪念物展示。通用图标属于UI符号，不作为独立藏品插画。
import { GUARDIAN_TOKENS } from './relics.js';
export function guardianShelf(s,tr,icon){
 const owned=s.guardianTokens??[];
 return '<section class="guardian-collection" aria-label="'+tr('guardianCollection')+'">'
 +'<div class="section-heading"><h2>'+icon('spark')+tr('guardianCollection')+'</h2>'
 +'<small>'+owned.length+' / '+GUARDIAN_TOKENS.length+' · '+tr('guardianCollectionHint')+'</small></div>'
 +'<div class="guardian-token-grid">'+GUARDIAN_TOKENS.map(item=>{
  const unlocked=owned.includes(item.id);
  return '<article class="guardian-token '+(unlocked?'is-owned':'is-locked')+'">'
   +'<div class="guardian-token-emblem">'+icon(item.icon)+'</div>'
   +'<div class="guardian-token-text"><strong>'+tr(unlocked?'guardianKeepsake'+item.id:'guardianUndiscovered')+'</strong>'
   +'<small>'+tr('guardianKeepsakeDesc'+item.id)+'</small></div>'
   +'<span class="guardian-token-status">'+tr(unlocked?'guardianObtained':'guardianLocked')+'</span>'
   +'</article>';
 }).join('')+'</div></section>';
}
