// 六区主线阶段目标与战后评级，根据已有战斗事件推导，不产生额外奖励。
import {REGIONS} from './data.js';
export function hordeMilestones(h,s){
 const region=REGIONS[s.region];if(!region)return [];
 return [
  {key:'survive',name:'在'+region.id+'坚持60秒',done:h.elapsed>=60},
  {key:'elites',name:'击败精英并突破群潮',done:(h.eliteCount??0)>0},
  {key:'guardian',name:'击败本区守护者',done:!!h.bossCleared}
 ];
}
export function hordeGrade(h){
 if(!h.finished||!h.bossCleared)return null;
 const seconds=Math.max(0,h.elapsed);
 return seconds<=110&&h.hazardsDodged>=3?'S':seconds<=145?'A':seconds<=200?'B':'C';
}
