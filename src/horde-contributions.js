// 群潮单局伙伴贡献，攻击与支持效果归属可追溯来源，环境及共享伤害独立统计。
import {supportFor} from './horde-support-metrics.js';
export function recordPartnerDamage(h,id,amount){
 if(typeof id!=='string'||!Number.isFinite(amount)||amount<=0)return;
 h.partnerDamage??={};
 h.partnerDamage[id]=(h.partnerDamage[id]??0)+amount;
}
export function partnerContributions(h,s){
 const total=Math.max(0,h.combatDamage||0);
 const members=(s.team??[]).map(id=>s.collection.find(p=>p.id===id)).filter(Boolean);
 const entries=members.map(p=>({id:p.id,species:p.species,damage:Math.round(Math.max(0,h.partnerDamage?.[p.id]??0)),...supportFor(h,p.id)}));
 const accounted=members.reduce((n,p)=>n+Math.max(0,h.partnerDamage?.[p.id]??0),0);
 return {entries,unattributed:Math.round(Math.max(0,total-accounted))};
}
