// 独立无奖励训练场，不操作正式战斗存档与资源。
export const TRAINING_ARENA_TASKS=['移动到安全区域','击退三只训练幻影','选择一次强化','躲避预警','结束训练'];
export function createTrainingArena(){return {step:0,kills:0,position:0,finished:false};}
export function trainingAction(a,action){
 if(a.finished)return false;
 if(a.step===0&&action==='move'){a.position++;a.step++;return true;}
 if(a.step===1&&action==='attack'){a.kills++;if(a.kills===3)a.step++;return true;}
 if(a.step===2&&action==='upgrade'){a.step++;return true;}
 if(a.step===3&&action==='dodge'){a.step++;return true;}
 if(a.step===4&&action==='finish'){a.step++;a.finished=true;return true;}
 return false;
}
export function trainingArenaMarkup(a){
 const commands=[['move','移动'],['attack','攻击幻影'],['upgrade','选择强化'],['dodge','躲避'],['finish','完成训练']];
 return '<section role="dialog" aria-label="独立训练场" class="training-arena"><h2>灵伴训练场</h2><p>安全练习，无正式战斗奖励或资源消耗</p><div style="min-height:160px;padding:20px;border-radius:12px;background:#263e39;color:white"><strong>幻影剩余 '+(3-a.kills)+'</strong><p>目标：'+(a.finished?'训练完成':TRAINING_ARENA_TASKS[a.step])+'</p><div style="width:28px;height:28px;border-radius:50%;background:#a9e7ca;transform:translateX('+a.position*45+'px)"></div></div><p>教学 '+a.step+'/5</p><div class="horde-controls">'+commands.map(([action,label],i)=>'<button data-training-action="'+action+'" '+(a.step!==i?'disabled':'')+'>'+label+'</button>').join('')+'</div><button data-training-close class="secondary-button">返回冒险</button></section>';
}
