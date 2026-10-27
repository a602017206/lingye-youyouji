import {ACTION_SEQUENCES} from './creature-action-sequence-data.js';
import {ATTACK_SEQUENCES} from './creature-attack-frames.js';
import {LAYER_RIGS} from './creature-layer-rigs.js';
import {creatureImageCache} from './creature-image-cache.js';

// 各使用者独立持有，图鉴关闭不会清除仍在战场绘制的同一图集。
export function retainCreatureAnimations(owner,ids,{reduced=false}={}){
 const sources=[];
 for(const id of ids){
  if(LAYER_RIGS[id]?.quality==='approved')sources.push(LAYER_RIGS[id].src);
  if(reduced)continue;
  for(const sequence of Object.values(ACTION_SEQUENCES[id]??{}))sources.push(sequence.src);
  if(ATTACK_SEQUENCES[id])sources.push(ATTACK_SEQUENCES[id].src);
 }
 creatureImageCache.retain(owner,sources);
}
export const releaseCreatureAnimations=owner=>creatureImageCache.release(owner);
export const clearCreatureAnimations=()=>creatureImageCache.clear();
