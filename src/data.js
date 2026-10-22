import {NEW_FAMILIES,NEW_EVOLUTION_LINES} from './new-families.js';
import {CREATURE_ART_READY} from './creature-art-ready.js';
export const MAX_LEVEL = 100;
export const BOSS_WINS = 15;
export const ELEMENTS = ['grove', 'ember', 'tide', 'frost', 'spore', 'aether', 'storm', 'metal', 'radiance', 'gale', 'umbra', 'stone', 'venom', 'dream', 'dust'];
const families = [
  ['苔绒团', '蕨角灵', '森冠行者'], ['籽灯芽', '枝灯灵', '萤林灯主'],
  ['砂铃虫', '流沙铃', '金漠鸣者'], ['陶蹄仔', '赤陶驮灵', '琥珀窑尊'],
  ['泡沫鳐', '潮帆灵', '澄湾鲸帆'], ['贝眠团', '珠壳梦灵', '月潮织梦者'],
  ['霜绒蛾', '雪纱灵', '极光羽姬'], ['冰芽团', '晶簇灵', '霜棱行者'],
  ['伞菇仔', '菌伞灵', '暮林伞母'], ['暮丝团', '纺月灵', '绒夜织者'],
  ['云纸鹞', '流风纸灵', '天穹折翼'], ['星砂团', '轨星灵', '辉环漫游者'],
];
export const EVOLUTION_LINES = [...families.map((_, family) => [101 + family * 3, 102 + family * 3, 103 + family * 3]),...NEW_EVOLUTION_LINES];
export const SPECIES = Object.fromEntries(families.flatMap((names, family) => names.map((name, stage) => {
  const id = 101 + family * 3 + stage;
  return [id, { name, family, stage, region: Math.floor(family / 2), type: ELEMENTS[Math.floor(family / 2)],
    attack: (family % 2 ? 9 : 11) + stage * 6, vitality: family % 2 ? 1.1 : 1,
    role: family % 2 ? 'keeper' : 'striker', ...(stage < 2 ? { next: id + 1, at: stage === 0 ? 12 : 28 } : {}) }];
})));
// 新增30个完整原创家族，进化时正式获得副属性，成长与觉醒改变基础攻击和生命。
for(const [i,f]of NEW_FAMILIES.entries()){
 const family=12+i,region=i%6,line=NEW_EVOLUTION_LINES[i];
 for(const stage of [0,1,2]){
  const id=line[stage];
  SPECIES[id]={name:f.names[stage],family,stage,region,type:f.type,
    ...(stage>=1?{secondaryType:f.secondaryType}:{}),
    role:f.focus==='battle'?'striker':'keeper',rarity:f.rarity,focus:f.focus,
    attack:(f.focus==='battle'?13:f.focus==='explore'?10:9)+stage*7+(i%3),
    vitality:(f.focus==='battle'?1.03:1.10)+stage*.06,
    ...(stage<2?{next:id+1,at:stage===0?16:36,evolutionCoins:stage===0?300:1100,evolutionMaterials:stage===0?12:30}:{}),
  };
 }
}
const regionDefinitions = [
  ['forest', [101, 104, 101, 104, 107, 113], 103, 5, 290, 9, 18, 'renewal'],
  ['desert', [107, 110, 107, 110, 104, 119], 112, 12, 540, 16, 32, 'sandArmor'],
  ['coast', [113, 116, 113, 116, 101, 125], 115, 20, 920, 25, 52, 'tides'],
  ['snow', [119, 122, 119, 122, 110, 131], 124, 30, 1450, 37, 80, 'frostPulse'],
  ['mushroom', [125, 128, 125, 128, 116, 134], 127, 42, 2220, 51, 118, 'sporeMist'],
  ['sky', [131, 134, 131, 134, 122, 128], 136, 55, 3200, 67, 170, 'starShield'],
];
export const REGIONS = regionDefinitions.map(([id, enemies, boss, level, baseHp, baseAttack, reward, rule], index) => ({
  id, name: id, enemies, boss, level, baseHp, baseAttack, reward, rule,
  theme: id, background: `/lingye-youyouji/assets/regions/${id}.webp`, material: `material${index}`, element: ELEMENTS[index],
}));
// 六种以现有原创画作为母本的稀有异彩形态：双属性、独立收集ID与可追溯衍生贴图。
// 不占用137—172的原定全新物种进化编号，也不假称拥有新独立轮廓。
export const RARE_FORMS = [
  {id:201,from:101,name:'雷纹苔绒',region:0,secondaryType:'storm'},
  {id:202,from:110,name:'玄铁陶灵',region:1,secondaryType:'metal'},
  {id:203,from:113,name:'镜辉潮鳐',region:2,secondaryType:'radiance'},
  {id:204,from:119,name:'风吟霜羽',region:3,secondaryType:'gale'},
  {id:205,from:125,name:'幽影伞灵',region:4,secondaryType:'umbra'},
  {id:206,from:134,name:'星磐灵核',region:5,secondaryType:'stone'},
];
for (const v of RARE_FORMS) {
  const base=SPECIES[v.from];
  SPECIES[v.id]={...base,name:v.name,region:v.region,secondaryType:v.secondaryType,
    attack:Math.round(base.attack*1.05),vitality:base.vitality*1.04,
    rareVariantOf:v.from,stage:0,next:undefined,at:undefined};
  REGIONS[v.region].enemies.push(v.id);
}
export const UPGRADE_KEYS = ['power', 'guard', 'fortune'];
// 群潮局内牌效键名由此统一，存档校验与模拟应使用同一个表。
export const HORDE_UPGRADE_KEYS = ['rapid', 'orbit', 'knock', 'guard', 'fortune', 'regen', 'swift', 'pierce', 'harvest', 'echo',
  'multishot','ricochet','ember','frostbite','spores','gravity','chain','burst','vampire','focus','bulwark','momentum','awakeningVortex','awakeningNova'];
// 只有已有真实PNG，或通过素材质量验收的新单件PNG，才允许展示对应立绘。
export const isSpeciesIllustrated=id=>id>=101&&id<=136||id>=201&&id<=206||CREATURE_ART_READY[id]===true;
export const sprite = id => isSpeciesIllustrated(id)?`/lingye-youyouji/assets/creatures/${id}.png`:null;
// 一条新进化线的3幅原创PNG全部验收成功后，才开放初生形态进入地区野生池。
for(const [i,line] of NEW_EVOLUTION_LINES.entries())if(line.every(isSpeciesIllustrated)){
 REGIONS[i%6].enemies.push(line[0]);
}
