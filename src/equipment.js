// 永久装备实例：只用装备实例ID分配所有权，杜绝同一件装备被两位灵伴共享。
import { SPECIES } from './data.js';
import { EQUIPMENT, EQUIPMENT_SLOTS } from './equipment-data.js';

export function ensureEquipmentState(c){
  if(!Array.isArray(c.equipment))c.equipment=[];
  if(!Number.isInteger(c.equipmentSeq))c.equipmentSeq=0;
  return c.equipment;
}
export function equipmentBonuses(s,workerId){
  const p=s.collection.find(x=>x.id===workerId);
  if(!p)return {attack:0,hp:0};
  const data=SPECIES[p.species];
  const result={attack:0,hp:0};
  for(const instance of s.camp?.equipment??[]){
    if(instance.owner!==workerId)continue;
    const item=EQUIPMENT[instance.recipe];
    if(!item)continue;
    const match=item.element===data.type||item.element===data.secondaryType;
    result.attack+=(item.attack?(item.attack+(match?.005:0)):0);
    result.hp+=(item.hp?(item.hp+(match?.005:0)):0);
  }
  return {attack:Math.min(.065,result.attack),hp:Math.min(.055,result.hp)};
}
export function equipItem(s,uid,workerId){
  const c=s.camp;if(!c||!Array.isArray(c.equipment))return false;
  const item=c.equipment.find(e=>e.uid===uid);
  const member=s.collection.find(p=>p.id===workerId);
  if(!item||!member||item.owner!==null)return false;
  const slot=EQUIPMENT[item.recipe]?.slot;
  if(!slot||c.equipment.some(e=>e.owner===workerId&&EQUIPMENT[e.recipe]?.slot===slot))return false;
  item.owner=workerId;
  return true;
}
export function unequipItem(s,uid){
  const item=s.camp?.equipment?.find(e=>e.uid===uid);
  if(!item||item.owner===null)return false;
  item.owner=null;
  return true;
}
export function validateEquipment(s){
  const c=s.camp;
  if(!c)return true;
  if(c.equipment===undefined&&c.equipmentSeq===undefined)return true; // 0.7.x历史营地存档兼容
  if(!Array.isArray(c.equipment)||!Number.isInteger(c.equipmentSeq)||c.equipmentSeq<0||c.equipmentSeq>1e6||c.equipment.length>120)return false;
  const ids=new Set(),slots=new Set();
  for(const item of c.equipment){
    if(!item||typeof item.uid!=='string'||!/^gear-[1-9]\d*$/.test(item.uid)||ids.has(item.uid)
      ||!Object.hasOwn(EQUIPMENT,item.recipe)||!Object.hasOwn(item,'owner'))return false;
    const n=Number(item.uid.slice(5));
    if(!Number.isSafeInteger(n)||n>c.equipmentSeq)return false;
    if(item.owner!==null&&!s.collection.some(p=>p.id===item.owner))return false;
    ids.add(item.uid);
    if(item.owner!==null){
      const ownerSlot=item.owner+'|'+EQUIPMENT[item.recipe].slot;
      if(slots.has(ownerSlot))return false;
      slots.add(ownerSlot);
    }
  }
  return true;
}
export function nextEquipment(c,recipe){
  ensureEquipmentState(c);
  if(!EQUIPMENT[recipe]||c.equipment.length>=120||c.equipmentSeq>=1e6)return false;
  c.equipmentSeq++;
  c.equipment.push({uid:'gear-'+c.equipmentSeq,recipe,owner:null});
  return true;
}
