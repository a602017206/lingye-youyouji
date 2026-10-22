// 七类肉鸽构筑均由现有24张牌实际等级判定，未创造无来源奖励。
export const HORDE_ARCHETYPES=Object.freeze([
 {key:'barrage',name:'贯穿弹幕',cards:['rapid','pierce','multishot'],bonus:'弹幕贯穿与齐射'},
 {key:'burn',name:'烬火爆裂',cards:['ember','burst','awakeningNova'],bonus:'灼烧与击杀爆炸'},
 {key:'frost',name:'寒孢控场',cards:['frostbite','spores','gravity'],bonus:'减速与孢雾控制'},
 {key:'storm',name:'雷跃连锁',cards:['chain','ricochet','echo'],bonus:'连锁弹射'},
 {key:'shield',name:'护盾续航',cards:['guard','bulwark','regen'],bonus:'减伤与持续回复'},
 {key:'mobile',name:'疾风追击',cards:['swift','momentum','vampire'],bonus:'移动强化与击退回复'},
 {key:'orbit',name:'星环牵引',cards:['orbit','gravity','awakeningVortex'],bonus:'环绕牵引与觉醒'}
]);
export function hordeArchetypeProgress(h){
 return HORDE_ARCHETYPES.map(line=>({...line,owned:line.cards.filter(key=>(h.upgrades?.[key]??0)>0).length,total:line.cards.length}))
 .sort((a,b)=>b.owned-a.owned||a.key.localeCompare(b.key));
}
