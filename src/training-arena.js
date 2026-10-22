// 独立练习使用正式群潮模拟与渲染；全部奖励只写入临时游戏状态。
import {createGame,maxPartyHp} from './engine.js';
import {createHorde,stepHorde,chooseHordeUpgrade,castHordeActive,setHordeDirection} from './horde.js';
import {setSkillSlot} from './skill-loadouts.js';
import {buildOffer,UPGRADE_INFO} from './horde-build.js';
export const TRAINING_ARENA_TASKS=['移动','击败三名训练敌人','选择一次强化','实际躲避危险区域','释放主动技能','观察补给装置与火元素反应','训练完成'];
export function createTrainingArena(){
 const state=createGame(1000);
 state.settings.autoUpgrade=false;state.settings.autoExplore=false;state.settings.autoHeal=false;
 state.collection.push({id:'training-ember',species:301,level:12,xp:0},{id:'training-supply',species:337,level:12,xp:0});
 state.team=['c101','training-ember','training-supply'];state.partyHp=maxPartyHp(state);
 const horde=createHorde(state,null,123456);horde.training=true;horde.moveMode='hold';
 setSkillSlot(state,'c101','active','ward');
 horde.timers=[.3,.4,.5];horde.dangerMarkers=[];
 return {state,horde,step:0,finished:false,failed:false,skipped:false,casts:0,upgraded:false,dodged:false,kills:0,moved:false};
}
export function trainingAction(a,action,value){
 if(action==='restart'){Object.assign(a,createTrainingArena());return true;}
 if(action==='skip'){a.skipped=true;a.finished=true;return true;}
 if(a.finished||a.failed)return false;
 if(action==='move'){setHordeDirection(a.horde,value?.x??1,value?.y??0);return true;}
 if(action==='stop'){setHordeDirection(a.horde,0,0);return true;}
 if(action==='upgrade')return chooseHordeUpgrade(a.horde,value??a.horde.pending[0]);
 if(action==='skill'){
  const id=value??a.state.team[0];
  const result=castHordeActive(a.horde,a.state,id);
  if(result)a.casts++;
  return result;
 }
 return false;
}
export function stepTrainingArena(a,dt=1/30){
 if(a.finished||a.failed)return;
 const h=a.horde;
 const pos={...h.hero};
 stepHorde(h,a.state,dt);
 if(Math.hypot(h.hero.x-pos.x,h.hero.y-pos.y)>.05)a.moved=true;
 a.kills=h.kills;a.upgraded=!!h.lessonUpgraded;a.dodged=h.hazardsDodged>0;
 if(a.step===2&&!h.pending.length&&!a.upgraded)h.pending=buildOffer(h,()=>.37);
 if(a.step===0&&a.moved)a.step++;
 if(a.step===1&&a.kills>=3)a.step++;
 if(a.step===2&&a.upgraded)a.step++;
 if(a.step===3){
  if(!h.dangerMarkers.length&&h.elapsed>2)h.dangerMarkers.push({shape:'circle',style:'eliteStrike',x:h.hero.x,y:h.hero.y,r:95,life:2.2,max:2.2,damage:maxPartyHp(a.state)*.01});
  if(a.dodged)a.step++;
 }
 if(a.step===4&&a.casts>0){a.step++;h.deviceClock=17.8;}
 if(a.step===5&&(h.deviceReactions?.emberCharge??0)>0)a.step++;
 if(a.step===6){a.finished=true;h.finished=true;}
 if(h.defeated||a.state.partyHp<=0){a.failed=true;h.finished=true;}
}
export function trainingArenaMarkup(a){
 const h=a.horde,goal=a.failed?'训练失败，可立即重试':a.finished?(a.skipped?'已跳过训练':'训练完成'):TRAINING_ARENA_TASKS[a.step];
 return '<section role="dialog" aria-modal="true" aria-label="独立训练场" class="training-arena"><h2>灵伴实时训练场</h2><p>真实群潮引擎 · 独立临时数据 · 不消耗正式资源</p>'
 +'<p id="training-goal" role="status">目标：'+goal+' · 击败 '+a.kills+'/3 · 避险 '+h.hazardsDodged+'</p>'
 +'<canvas id="training-canvas" aria-label="实时训练战场" style="width:100%;aspect-ratio:16/9;display:block;touch-action:none;background:#203d35;border-radius:12px"></canvas>'
 +'<p>WASD / 方向键移动；鼠标、触屏拖动引导。自动攻击由真实伙伴执行。生产灵伴会部署补给装置，火属性触发额外回能。</p>'
 +(h.pending.length?'<div id="training-choices">'+h.pending.map(k=>'<button data-training-upgrade="'+k+'">'+UPGRADE_INFO[k].name+'</button>').join('')+'</div>':'')
 +'<div class="horde-controls"><button data-training-skill>释放伙伴技能</button><button data-training-restart>重新开始</button><button data-training-skip>跳过</button><button data-training-close>退出训练</button></div>'
 +'<p id="training-device-status">装置部署 '+(h.deviceDeployments??0)+' 次 · 火系补给反应 '+(h.deviceReactions?.emberCharge??0)+' 次 · 伙伴技能冷却 '+Math.max(0,Math.ceil((h.activeCooldowns?.c101??0)-h.elapsed))+' 秒</p>'
 +(a.finished||a.failed?'<p id="training-result">结果：移动 '+(a.moved?'掌握':'未完成')+'；击杀 '+a.kills+'；强化 '+(a.upgraded?'掌握':'未完成')+'；避险 '+(a.dodged?'掌握':'未完成')+'；技能 '+(a.casts?'掌握':'未完成')+'</p>':'')+'</section>';
}
