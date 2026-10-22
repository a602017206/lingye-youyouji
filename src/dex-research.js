// 图鉴研究：累计发现里程碑，仅领取一次，沿用原有claimed字段，无需存档迁移。
export const DEX_RESEARCH=Object.freeze([{count:6,coins:300},{count:18,coins:900},{count:36,coins:1800},{count:60,coins:3200},{count:90,coins:5200},{count:120,coins:8000}]);
export const researchKey=count=>'dex-research-'+count;
export function claimDexResearch(state,count){
 const entry=DEX_RESEARCH.find(item=>item.count===Number(count));
 if(!entry||!Array.isArray(state.discovered)||!Array.isArray(state.claimed)||state.discovered.length<entry.count||state.claimed.includes(researchKey(entry.count)))return false;
 state.claimed.push(researchKey(entry.count));state.coins+=entry.coins;return true;
}
