// 战场教学使用真实的移动、击杀、升级、躲避和结算事件，记录仅限本次试炼。
export const TRAINING_STEPS=Object.freeze([
 {key:'move',name:'移动练习',hint:'方向键/WASD或触屏控制英雄移动'},
 {key:'kills',name:'击退练习',hint:'让伙伴自动攻击并击败3名敌人'},
 {key:'upgrade',name:'构筑练习',hint:'获得升级机会并选一张强化牌'},
 {key:'dodge',name:'躲避练习',hint:'避开一次精英或首领的危险区域'},
 {key:'finish',name:'结算练习',hint:'完成一局试炼并查看战斗报告'}
]);
export function lessonProgress(h){
 const done=[!!h.lessonMoved,(h.kills??0)>=3,!!h.lessonUpgraded,(h.hazardsDodged??0)>=1,!!h.finished];
 const index=done.findIndex(ok=>!ok);
 return {done,index:index<0?5:index,total:5,complete:index<0,step:index<0?null:TRAINING_STEPS[index]};
}
export function markMovement(h,before,after){
 if(Math.hypot(after.x-before.x,after.y-before.y)>=.08)h.lessonMoved=true;
}
