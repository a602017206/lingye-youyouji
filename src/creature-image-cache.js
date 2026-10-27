// 约束应用持有的图集引用；RGBA字节为估算值，不代表浏览器进程实际内存。
export function disposeCreatureImage(image){
 image.onload=null;image.onerror=null;
 // 仅用于销毁，绝不绘制：空src会令当前Chrome的失效图片视口监听器持有已关闭节点。
 image.src='data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
}
export function createCreatureImageCache({createImage=()=>new Image(),maxEntries=24,maxBytes=96*1024*1024}={}){
 const entries=new Map(),owners=new Map();
 const held=src=>[...owners.values()].some(sources=>sources.has(src));
 const remove=src=>{
  const entry=entries.get(src);if(!entry)return;
  entries.delete(src);disposeCreatureImage(entry.image);
 };
 const totalBytes=()=>[...entries.values()].reduce((sum,entry)=>sum+entry.bytes,0);
 const trim=()=>{
  while(entries.size>maxEntries||totalBytes()>maxBytes){
   const src=[...entries.keys()].find(key=>!held(key))??entries.keys().next().value;
   remove(src);
  }
 };
 const cache={
  get(src,estimatedBytes=0){
   if(!entries.has(src)){
    const entry={image:createImage(),status:'loading',bytes:estimatedBytes};entries.set(src,entry);
    entry.image.onload=()=>{
     if(entries.get(src)!==entry)return;
     entry.status='ready';
     const {naturalWidth,naturalHeight}=entry.image;
     if(naturalWidth>0&&naturalHeight>0)entry.bytes=naturalWidth*naturalHeight*4;
     trim();
    };
    entry.image.onerror=()=>{if(entries.get(src)===entry){entry.status='failed';entry.bytes=0;}};
    trim();if(entries.has(src))entry.image.src=src;
   }
   const entry=entries.get(src);if(!entry)return null;
   entries.delete(src);entries.set(src,entry);
   return entry.status==='ready'?entry.image:null;
  },
  status:src=>entries.get(src)?.status??'loading',
  retain(owner,sources){
   const next=new Set(sources),previous=owners.get(owner)??new Set();
   if(next.size===previous.size&&[...next].every(src=>previous.has(src)))return;
   if(next.size)owners.set(owner,next);else owners.delete(owner);
   for(const src of previous)if(!next.has(src)&&!held(src))remove(src);
  },
  release(owner){cache.retain(owner,[]);},
  clear(){for(const src of entries.keys())remove(src);owners.clear();},
  stats(){return {entries:entries.size,estimatedBytes:totalBytes(),maxEntries,maxBytes,
   loading:[...entries.values()].filter(entry=>entry.status==='loading').length,
   ready:[...entries.values()].filter(entry=>entry.status==='ready').length,
   failed:[...entries.values()].filter(entry=>entry.status==='failed').length,
   owners:Object.fromEntries([...owners].map(([owner,sources])=>[owner,sources.size]))};},
 };
 return cache;
}

export function atlasBytes(frames){
 const width=Math.max(...frames.map(([x,,w])=>x+w)),height=Math.max(...frames.map(([,y,,h])=>y+h));
 return width*height*4;
}
export const creatureImageCache=createCreatureImageCache();
