// 按同一伙伴全部动作的实际内容边界确定固定展台尺寸，避免宽姿态裁切与切换缩放。
export function creaturePreviewSize(sequences,width,height){
 let size=Math.min(width,height)*.78;
 const margin=Math.min(8,width*.05,height*.05);
 for(const sequence of Object.values(sequences??{})){
  const scale=sequence.scale??1,baseline=sequence.baseline??472/512;
  for(const [x,y,w,h] of sequence.contentBounds??[]){
   const maxX=Math.max(Math.abs((x/512-.5)*scale),Math.abs(((x+w)/512-.5)*scale));
   const maxY=Math.max(Math.abs(-.5+(1-scale)*baseline+y/512*scale),Math.abs(-.5+(1-scale)*baseline+(y+h)/512*scale));
   if(maxX>0)size=Math.min(size,(width/2-margin)/maxX);
   if(maxY>0)size=Math.min(size,(height/2-margin)/maxY);
  }
 }
 return Math.max(0,size);
}
