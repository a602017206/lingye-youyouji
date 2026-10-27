// 伙伴/共享支援与实际损血账本，仅累计本次页面运行；不改变战斗数值或进入存档。
const positive=value=>Number.isFinite(value)?Math.max(0,value):0;
const emptySupport=()=>({healing:0,shield:0,control:0,shieldAbsorbed:0});
function metrics(h){return h.sustainMetrics??={since:h.metricsSince??0,healthLost:0,healing:0,shieldGenerated:0,shieldAbsorbed:0,damageByCause:{},shared:emptySupport()};}
function partner(h,id){h.partnerSupport??={};return h.partnerSupport[id]??=emptySupport();}
// 护盾共用一个池；按各来源剩余份额分摊实际吸收，未追踪的初始盾归共享。
function syncShield(h,pool){
 h.shieldLedger??={};pool=positive(pool);
 const total=Object.values(h.shieldLedger).reduce((sum,value)=>sum+value,0);
 if(total>pool&&total>0)for(const id of Object.keys(h.shieldLedger))h.shieldLedger[id]*=pool/total;
 else if(pool>total)h.shieldLedger.shared=(h.shieldLedger.shared??0)+pool-total;
 for(const id of Object.keys(h.shieldLedger))if(h.shieldLedger[id]<=1e-9)delete h.shieldLedger[id];
}
export function creditSupport(h,id,kind,amount){
 if(!['healing','shield','control'].includes(kind)||!Number.isFinite(amount)||amount<=0)return;
 const total=metrics(h),entry=id?partner(h,id):total.shared;
 entry[kind]+=amount;
 if(kind==='healing')total.healing+=amount;
 if(kind==='shield'){
  total.shieldGenerated+=amount;syncShield(h,Math.max(0,h.shieldPool-amount));
  const key=id?'partner:'+id:'shared';h.shieldLedger[key]=(h.shieldLedger[key]??0)+amount;
 }
}
export function supportFor(h,id){return {...emptySupport(),...h.partnerSupport?.[id]};}
export function healParty(h,s,amount,maxHp,id=null){
 const before=s.partyHp;s.partyHp=Math.min(maxHp,s.partyHp+amount);
 const actual=Math.max(0,Math.max(0,s.partyHp)-Math.max(0,before));creditSupport(h,id,'healing',actual);return actual;
}
export function grantShield(h,amount,cap,id=null){
 const before=h.shieldPool;syncShield(h,before);h.shieldPool=Math.min(cap,h.shieldPool+amount);
 const actual=Math.max(0,h.shieldPool-before);
 if(actual>0)creditSupport(h,id,'shield',actual);else syncShield(h,h.shieldPool);
 return actual;
}
export function recordHealthLoss(h,before,after,kind){
 const actual=Math.min(positive(before),positive(before-after));if(actual<=0)return;
 const total=metrics(h);total.healthLost+=actual;total.damageByCause[kind]=(total.damageByCause[kind]??0)+actual;
 h.lastHealthHit={kind,damage:actual,at:h.elapsed??0};
}
export function takeHordeDamage(h,s,damage,kind){
 const before=s.partyHp,pool=h.shieldPool,shielded=Math.min(pool,damage);syncShield(h,pool);
 if(shielded>0){
  const total=metrics(h);total.shieldAbsorbed+=shielded;
  for(const [id,value]of Object.entries(h.shieldLedger)){
   const used=shielded*value/pool;h.shieldLedger[id]=Math.max(0,value-used);
   (id==='shared'?total.shared:partner(h,id.slice(8))).shieldAbsorbed+=used;
  }
 }
 h.shieldPool-=shielded;s.partyHp-=damage-shielded;syncShield(h,h.shieldPool);
 recordHealthLoss(h,before,s.partyHp,kind);return shielded;
}
export function recordDefeat(h,kind=null){h.deathCause=kind?{kind,damage:0,at:h.elapsed??0}:{...(h.lastHealthHit??{kind:'unknown',damage:0,at:h.elapsed??0})};}
export function sustainReport(h,s=null){
 const m=h.sustainMetrics;
 const shared={...emptySupport(),...m?.shared};
 if(s){const current=new Set(s.team??[]);for(const [id,entry]of Object.entries(h.partnerSupport??{}))if(!current.has(id))for(const key of Object.keys(shared))shared[key]+=entry[key]??0;}
 return {since:m?.since??h.metricsSince??0,healthLost:m?.healthLost??0,healing:m?.healing??0,
  shieldGenerated:m?.shieldGenerated??0,shieldAbsorbed:m?.shieldAbsorbed??0,shieldRemaining:positive(h.shieldPool),
  damageByCause:{...m?.damageByCause},shared};
}
