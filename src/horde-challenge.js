// 高难试炼在局内追加压力，只有显式开启才生效；当前难度选择不持久化。
export const CHALLENGE_TIERS=Object.freeze([
 {id:'normal',name:'普通',attack:1,speed:1,reward:1},
 {id:'hard',name:'险境',attack:1.18,speed:1.08,reward:1.2},
 {id:'nightmare',name:'噩梦',attack:1.38,speed:1.16,reward:1.4}
]);
export function challengeTier(h){return CHALLENGE_TIERS.find(x=>x.id===h.challengeTier)??CHALLENGE_TIERS[0];}
export function setChallengeTier(h,tier){
 if(h.elapsed>0||h.kills>0||h.bossStarted||h.finished)return false;
 if(!CHALLENGE_TIERS.some(x=>x.id===tier))return false;
 h.challengeTier=tier;return true;
}
