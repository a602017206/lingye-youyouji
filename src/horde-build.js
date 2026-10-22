// 群潮P2-B构筑目录：独立规则数据，物种名称和图像均不在这里硬编码。
import { HORDE_UPGRADE_KEYS } from './data.js';
const specs=[
 ['rapid','叶针齐射','增加射速与叶针数量','弹幕', 'common',4],
 ['orbit','巡游光环','扩大环绕范围并增强持续伤害','范围','common',4],
 ['knock','破阵震波','强化击退距离和扇形范围','控制','common',4],
 ['guard','营地护盾','降低近身伤害','生存','common',4],
 ['fortune','巡野收获','增加每组清怪的星砂收益','收集','common',3],
 ['regen','苔息回春','每秒回复少量生命','生存','common',4],
 ['swift','风径轻行','提高游走速度','机动','common',3],
 ['pierce','贯叶长针','叶针可连续命中多个敌人','弹幕','common',4],
 ['harvest','灵息拾遗','增加局内经验','成长','common',3],
 ['echo','共鸣余响','三位伙伴伤害均得到提升','共鸣','common',4],
 ['multishot','分形叶幕','叶针向多个方向同步齐射','弹幕','uncommon',3],
 ['ricochet','回音跳弹','叶针命中后跳向附近另一个敌人','弹幕','uncommon',3],
 ['ember','烬纹印记','命中附加持续灼烧；和爆裂形成火环','状态','uncommon',3],
 ['frostbite','寒流结霜','命中附加减速；与孢雾组成霜孢扩散','控制','uncommon',3],
 ['spores','暮孢沾染','光环命中附加孢雾持续伤害','状态','uncommon',3],
 ['gravity','根环牵引','光环对敌群产生短距牵引','范围','uncommon',3],
 ['chain','星辉连跃','弹幕命中额外弹射电弧至附近敌人','连锁','uncommon',3],
 ['burst','破片迸散','敌人倒下时对身边其他怪造成范围溅射','范围','uncommon',3],
 ['vampire','战野回息','累计击退敌人回复小队生命','生存','uncommon',3],
 ['focus','追猎凝神','对精英与守护者造成更高伤害','首领','uncommon',3],
 ['bulwark','潮幕护壳','击退敌人可积累有限护盾，抵消范围伤害','生存','uncommon',3],
 ['momentum','乘风追袭','移动时积累动能并强化下一次攻击','机动','uncommon',3],
 ['awakeningVortex','森渊回环','觉醒：根环牵引范围增强并间歇清扫近身敌群','觉醒','legendary',1],
 ['awakeningNova','星烬核爆','觉醒：击杀迸散扩展为一次有限距离星核冲击','觉醒','legendary',1],
];
export const UPGRADE_INFO=Object.fromEntries(specs.map(([id,name,description,category,rarity,maxRank])=>[id,{name,description,category,rarity,maxRank}]));
if(specs.length!==24||HORDE_UPGRADE_KEYS.some(k=>!UPGRADE_INFO[k]))throw new Error('肉鸽牌效目录不完整');
const rank=(h,k)=>h.upgrades?.[k]??0;
export function buildPool(h){
  return HORDE_UPGRADE_KEYS.filter(k=>{
    const info=UPGRADE_INFO[k];
    if(rank(h,k)>=info.maxRank)return false;
    if(k==='awakeningVortex')return rank(h,'orbit')>=2&&rank(h,'gravity')>=1;
    if(k==='awakeningNova')return rank(h,'echo')>=2&&rank(h,'burst')>=1;
    return true;
  });
}
export function buildSynergies(h){
  const combos=[
    ['frostSpore','frostbite','spores'],
    ['emberBlast','ember','burst'],
    ['stormChain','chain','ricochet'],
    ['shieldHeal','bulwark','regen'],
    ['windMomentum','swift','momentum'],
    ['burningPierce','ember','pierce'],
  ];
  const found=combos.filter(([key,a,b])=>rank(h,a)>0&&rank(h,b)>0).map(([key])=>key);
  if(rank(h,'awakeningVortex')>0)found.push('vortex');
  if(rank(h,'awakeningNova')>0)found.push('nova');
  return found;
}
export function buildOffer(h,random){
  const pool=buildPool(h);
  // 根据当前流派调整抽取权重：已有技能、潜在联动和稀有觉醒更容易出现。
  const selected=[];
  for(let i=0;i<3&&pool.length;i++){
    const weighted=pool.map(k=>{
      const info=UPGRADE_INFO[k],current=rank(h,k);
      const synergyBoost={
        burst:rank(h,'ember')>0||rank(h,'echo')>0,
        ember:rank(h,'burst')>0||rank(h,'pierce')>0,
        orbit:rank(h,'gravity')>0,
        gravity:rank(h,'orbit')>0,
        spores:rank(h,'frostbite')>0,
        frostbite:rank(h,'spores')>0,
        ricochet:rank(h,'chain')>0,
        chain:rank(h,'ricochet')>0,
        momentum:rank(h,'swift')>0,
        bulwark:rank(h,'regen')>0,
      }[k]?1.8:1;
      return (info.rarity==='legendary'?5:info.rarity==='uncommon'?.8:1.2)*(1+current*.35)*synergyBoost;
    });
    let r=random()*weighted.reduce((a,b)=>a+b,0),index=weighted.length-1;
    for(let j=0;j<weighted.length;j++){r-=weighted[j];if(r<=0){index=j;break;}}
    selected.push(pool.splice(index,1)[0]);
  }
  return selected;
}
export const SYNERGY_INFO={
 frostSpore:'霜孢扩散',emberBlast:'烬纹爆环',stormChain:'回声星链',
 shieldHeal:'护壳回息',windMomentum:'风行追袭',burningPierce:'烬叶穿云',
 vortex:'森渊回环·觉醒',nova:'星烬核爆·觉醒',
};
