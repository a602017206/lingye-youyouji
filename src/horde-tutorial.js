// 根据战斗状态提供顺序教学；纯函数，避免反复弹窗阻挡操作。
export function hordeTutorial(h,s){
 if(h.finished)return {step:5,text:'试炼结束：查看伤害、治疗和护盾贡献，调整队伍再挑战。'};
 if(h.pending?.length)return {step:2,text:'构筑选择：查看流派进度，挑选互相联动的升级牌。'};
 if(h.dangerMarkers?.length)return {step:3,text:'危险预警：移动到标记区域之外，规避精英与首领攻击。'};
 if(h.elapsed<12)return {step:1,text:'基础操作：方向键、WASD或触屏控制移动，伙伴会自动攻击。'};
 if(h.elapsed<45)return {step:2,text:'局内构筑：消灭敌群获得经验，升级后选择强化。'};
 if((h.devices?.length??0)>0)return {step:4,text:'阵容协同：生产伙伴的装置会与部分元素技能产生反应。'};
 return {step:4,text:'战斗观察：关注生命、能量、羁绊、装置与首领预警。'};
}
