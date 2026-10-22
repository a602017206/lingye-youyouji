// 营地资源与制作数据。材料均为新增账本，不能替代已有的六区进化材料。
export const CAMP_RESOURCES={
  wood:{name:'柔枝木'},herb:{name:'草叶'},fiber:{name:'藤纤'},ore:{name:'砂铁'},
  dew:{name:'净露'},shell:{name:'贝纤'},ice:{name:'冰晶矿'},spore:{name:'孢囊'},
  stardust:{name:'星辉砂'},seed:{name:'药草种子'},plank:{name:'木板'},ingot:{name:'锻锭'},herbPowder:{name:'药粉'},
};
export const CAMP_JOBS={
  logging:{name:'伐木',region:0,seconds:90,item:'wood',amount:2,icon:'leaf'},
  herbalism:{name:'草药采集',region:0,seconds:120,item:'herb',amount:2,icon:'leaf'},
  foraging:{name:'野外拾荒',region:0,seconds:150,item:'fiber',amount:2,icon:'compass'},
  mining:{name:'采矿',region:1,seconds:150,item:'ore',amount:2,icon:'shield'},
  beachcombing:{name:'海岸采集',region:2,seconds:160,item:'shell',amount:2,icon:'compass'},
  frostmining:{name:'霜晶开采',region:3,seconds:190,item:'ice',amount:2,icon:'shield'},
  sporehunt:{name:'孢囊采集',region:4,seconds:190,item:'spore',amount:2,icon:'leaf'},
  starmining:{name:'星砂采集',region:5,seconds:220,item:'stardust',amount:2,icon:'spark'},
};
export const CAMP_RECIPES={
  herbalPotion:{name:'苔叶草露',category:'potion',seconds:30,region:0,materials:{herb:3,dew:1},description:'本局回复25%生命，药剂冷却30秒'},
  repelVial:{name:'清障投掷罐',category:'tool',seconds:65,region:0,materials:{wood:3,fiber:2},description:'局内击退周围怪潮，战术道具冷却40秒'},
  energySeal:{name:'灵息集气符',category:'tool',seconds:45,region:0,materials:{wood:2,fiber:3},coins:20,description:'局内回复20点共鸣能量'},
  recoveryDraught:{name:'森息缓释瓶',category:'potion',seconds:60,region:0,materials:{herb:5,fiber:2,dew:1},description:'局内回复30%生命，药剂冷却30秒'},
  swiftSigil:{name:'风径轻跃符',category:'tool',seconds:75,region:2,materials:{fiber:2,shell:3},description:'短暂提高走位速度'},
  frostVial:{name:'寒息符瓶',category:'tool',seconds:100,region:3,materials:{ice:2,wood:1},description:'让身边怪物短暂减速'},
  fortifiedDraught:{name:'精炼森息合剂',category:'potion',seconds:130,region:0,materials:{herbPowder:2,dew:1},description:'局内恢复最大生命35%，消耗药粉加工材料'},
  reinforcedDisc:{name:'锻纹震荡盘',category:'tool',seconds:145,region:1,materials:{plank:2,ingot:1},description:'对近距离怪潮造成伤害与击退'},
};
export const PROCESS_RECIPES={
  sawPlanks:{name:'锯制木板',region:0,seconds:90,materials:{wood:5,fiber:1},output:'plank',amount:2},
  smeltIngots:{name:'矿炉冶炼',region:1,seconds:150,materials:{ore:5,wood:2},output:'ingot',amount:2},
  dryHerbs:{name:'草药研磨',region:0,seconds:100,materials:{herb:5,dew:1},output:'herbPowder',amount:2},
};

// C5四类可升级设施。高阶只优化效率，不复制工人或让装备增益无上限叠加。
export const CAMP_FACILITIES={
  lumber:{name:'枝木工棚',region:0,unlock:3,icon:'leaf',
    upgrade:{2:{wood:16,plank:3,coins:120},3:{wood:30,plank:8,ingot:2,coins:270}}},
  mine:{name:'砂晶矿炉',region:1,unlock:3,icon:'shield',
    upgrade:{2:{ore:15,ingot:3,coins:160},3:{ore:26,ingot:9,plank:4,coins:300}}},
  garden:{name:'回春药圃',region:0,unlock:3,icon:'heart',
    upgrade:{2:{herb:15,herbPowder:3,coins:140},3:{herb:28,herbPowder:9,plank:3,coins:280}}},
  workshop:{name:'星纹工坊',region:0,unlock:3,icon:'spark',
    upgrade:{2:{plank:5,ingot:3,coins:170},3:{plank:12,ingot:7,stardust:4,coins:340}}},
};
export const CAMP_JOB_LIMIT=[1,2,3,4,6];
export const CAMP_LEVEL_COSTS={
  2:{wood:20,herb:8,coins:100},
  3:{wood:30,herb:12,ore:10,coins:220},
  4:{plank:8,ingot:4,herbPowder:4,coins:440},
  5:{plank:18,ingot:12,herbPowder:9,stardust:8,coins:860},
};
