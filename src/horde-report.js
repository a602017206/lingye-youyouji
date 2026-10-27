// 单局群潮报告，仅依赖本局统计；不写入存档，不在页面刷新时重复结算。
import {familyFieldSupport} from './family-field-support.js';
import {hordeGrade} from './horde-milestones.js';
import {sustainReport} from './horde-support-metrics.js';
import {partnerContributions} from './horde-contributions.js';
export function hordeReport(h,s){
 const support=familyFieldSupport(s);
 return {seconds:Math.floor(h.elapsed),kills:h.kills,grade:hordeGrade(h),damage:Math.round(h.combatDamage||0),
  signatures:h.familySignatureCount||0,dodges:h.hazardsDodged||0,resonance:h.resonanceTriggers||0,
  workCount:support.workFamilies.length,exploreCount:support.exploreFamilies.length,
  sustain:sustainReport(h,s),death:h.deathCause?{...h.deathCause}:null,scoutWarning:support.scout,partners:partnerContributions(h,s),devices:{...(h.deviceStats??{})},reactions:{...(h.deviceReactions??{})}};
}
export function scoutWarningLead(s){const support=familyFieldSupport(s);return support.exploreFamilies.length?Math.min(.55,support.exploreFamilies.length*.18):0;}
