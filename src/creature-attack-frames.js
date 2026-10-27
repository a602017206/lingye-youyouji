// 真正绘制的四个攻击关键姿态；原始生成图和处理记录随项目保留。
const frames=[[0,0,512,512],[512,0,512,512],[0,512,512,512],[512,512,512,512]];
export const ATTACK_SEQUENCES=Object.fromEntries([301,302,303,316,317,318].map(id=>[id,{src:`/lingye-youyouji/assets/creatures/actions/${id}/attack.png`,frames,mirror:id===303}]));
export function attackFrameAt(phase){return phase<.22?0:phase<.42?1:phase<.68?2:3;}
export function createAttackFrameCache(createImage=()=>new Image()){
 const entries=new Map();
 return {get(id){
  const sequence=ATTACK_SEQUENCES[id];if(!sequence)return null;
  if(!entries.has(id)){
   const image=createImage(),entry={image,ready:false};entries.set(id,entry);
   image.onload=()=>{entry.ready=true;};image.onerror=()=>{entry.ready=false;};image.src=sequence.src;
  }
  const entry=entries.get(id);return entry.ready?entry.image:null;
 }};
}
const cache=createAttackFrameCache();
export const attackFrameImage=id=>cache.get(id);
