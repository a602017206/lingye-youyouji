// 仅用于尚未发布游戏的本地测试：接受当前存档结构，无任何旧版本迁移和标签页修订协议。
import {validateSave} from './engine.js';
const SAVE_KEY='idle-journey-save',BACKUP_KEY='idle-journey-backup';
export function readSave(storage){
 try{
  storage??=globalThis.localStorage;
  for(const key of [SAVE_KEY,BACKUP_KEY]){
   try{
    const raw=storage.getItem(key);
    if(!raw)continue;
    const parsed=JSON.parse(raw);
    if(validateSave(parsed))return {state:parsed,recovered:key===BACKUP_KEY};
   }catch{ /* 主档损坏时读取有效备份；禁止存储时也可继续游玩。 */ }
  }
 }catch{ /* 用户可能禁用浏览器本地存储。 */ }
 return {state:null,recovered:false};
}
export function writeSaveDetailed(state,storage,now=Date.now()){
 try{
  storage??=globalThis.localStorage;
  if(!validateSave(state)||!Number.isFinite(now)||now<0)return {ok:false,reason:'invalid'};
  const raw=storage.getItem(SAVE_KEY);
  if(raw){
   try{
    if(validateSave(JSON.parse(raw)))storage.setItem(BACKUP_KEY,raw);
   }catch{ /* 无效主档不复制入备份。 */ }
  }
  const snapshot={...state,savedAt:Math.max(now,state.savedAt)};
  if(!validateSave(snapshot))return {ok:false,reason:'invalid'};
  storage.setItem(SAVE_KEY,JSON.stringify(snapshot));
  state.savedAt=snapshot.savedAt;
  return {ok:true,reason:'ok'};
 }catch{return {ok:false,reason:'unavailable'};}
}
export function writeSave(state,storage,now=Date.now()){
 return writeSaveDetailed(state,storage,now).ok;
}
