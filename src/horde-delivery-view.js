import {creatureName} from './i18n.js';
const escape=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const number=value=>{const amount=Math.max(0,value??0);return amount>0&&amount<1?Number(amount.toPrecision(2)):Math.round(amount);};
export function hordeDeliveryView(report,s,tr){
 const m=report.sustain,stat=(key,value)=>`<span>${tr(key)} <b>${number(value)}</b></span>`;
 const support=row=>stat('reportHealing',row.healing)+stat('reportShieldGenerated',row.shield)+stat('reportShieldAbsorbed',row.shieldAbsorbed);
 const death=report.death?`<p class="horde-death-reason" data-cause="${report.death.kind}">${tr('reportDeath',{reason:tr('reportCause'+report.death.kind)})}${report.death.kind==='timeout'?'':' · '+tr('reportFinalHit',{damage:number(report.death.damage)})}</p>`:'';
 return `${death}<section class="horde-sustain-report"><strong>${tr('reportSustain')}</strong><div class="horde-sustain-grid">${stat('reportHealthLost',m.healthLost)+stat('reportHealing',m.healing)+stat('reportShieldGenerated',m.shieldGenerated)+stat('reportShieldAbsorbed',m.shieldAbsorbed)}</div><small>${tr('reportShieldGuide')}</small></section>`
  +`<div class="horde-report-contributions"><strong>${tr('hordePartnerContributionTitle')}</strong>${report.partners.entries.map(row=>`<article data-report-partner="${escape(row.id)}"><b>${creatureName(row.species,s.settings?.locale)}</b><div>${stat('hordeReportDamage',row.damage)+support(row)+stat('hordeSupportControl',row.control)}</div></article>`).join('')}<article><b>${tr('reportSharedSupport')}</b><div>${support(m.shared)}</div></article><span>${tr('hordeUnattributed')} · ${report.partners.unattributed}</span></div><p class="horde-report-scope">${tr('reportScope')}</p>`;
}
