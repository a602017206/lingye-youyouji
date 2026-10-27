// 完整角色的重绘动作图集；待机与资源失败继续使用原分层播放器。
export {ACTION_SEQUENCES} from './creature-action-sequence-data.js';
import {ACTION_SEQUENCES} from './creature-action-sequence-data.js';
import {createCreatureImageCache,creatureImageCache,atlasBytes} from './creature-image-cache.js';

// 无独立分层的伙伴也能播放完整角色姿态，动作时间只影响显示。
export function sequencePoseAt(sequence,time,{phase,reduced=false,mobile=false}={}){
 const duration=sequence.duration??1;
 const clock=Number.isFinite(time)?time:0,sampled=mobile?Math.floor(clock*20)/20:clock;
 const progress=phase===undefined?((sampled%duration)+duration)%duration/duration:Number.isFinite(phase)?Math.max(0,Math.min(1,phase)):0;
 const quantized=mobile&&phase!==undefined&&progress<1?Math.floor(progress*duration*20)/(duration*20):progress;
 return {duration:reduced?0:duration,phase:reduced?0:quantized};
}

export function sequenceFrameAt(sequence,phase){
 const progress=Number.isFinite(phase)?Math.max(0,Math.min(1,phase)):0;
 if(sequence.loop&&progress===1)return 0;
 const index=sequence.timeline.findIndex(end=>progress<end);
 return index<0?sequence.frames.length-1:index;
}
export function createActionSequenceCache(createImage=()=>new Image()){
 return actionCache(createCreatureImageCache({createImage}));
}
function actionCache(images){return {
 get(id,action){const sequence=ACTION_SEQUENCES[id]?.[action];return sequence?images.get(sequence.src,atlasBytes(sequence.frames)):null;},
 clear:()=>images.clear(),
};}
const cache=actionCache(creatureImageCache);
export const actionSequenceImage=(id,action)=>cache.get(id,action);
