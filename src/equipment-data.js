// C3基础装备：永久局外物品；使用项目现有UI符号，不冒充已完成独立装备插画。
export const EQUIPMENT={
  woodStaff:{name:'柔枝木杖',slot:'weapon',region:0,seconds:120,materials:{wood:8,fiber:2},coins:45,attack:.03,hp:0,element:'grove',icon:'leaf',description:'伙伴攻击+3%；森灵伙伴额外+0.5%'},
  resinBow:{name:'树脂巡猎弓',slot:'weapon',region:0,seconds:180,materials:{wood:10,herb:3,fiber:4},coins:80,attack:.035,hp:0,element:'gale',icon:'compass',description:'伙伴攻击+3.5%；疾风伙伴额外+0.5%'},
  ironRing:{name:'砂铁破阵环',slot:'weapon',region:1,seconds:210,materials:{ore:9,wood:2},coins:130,attack:.04,hp:0,element:'metal',icon:'shield',description:'伙伴攻击+4%；玄铁伙伴额外+0.5%'},
  coralNeedle:{name:'潮贝短刃',slot:'weapon',region:2,seconds:230,materials:{shell:9,ore:2},coins:155,attack:.04,hp:0,element:'tide',icon:'ball',description:'伙伴攻击+4%；潮汐伙伴额外+0.5%'},
  frostScepter:{name:'霜晶仪杖',slot:'weapon',region:3,seconds:250,materials:{ice:7,ore:4},coins:190,attack:.045,hp:0,element:'frost',icon:'spark',description:'伙伴攻击+4.5%；霜凝伙伴额外+0.5%'},
  starlightRod:{name:'星辉法枝',slot:'weapon',region:5,seconds:320,materials:{stardust:8,wood:4,spore:3},coins:245,attack:.05,hp:0,element:'aether',icon:'spark',description:'伙伴攻击+5%；星辉伙伴额外+0.5%'},
  barkCharm:{name:'森息护符',slot:'charm',region:0,seconds:125,materials:{wood:5,herb:4,dew:2},coins:55,attack:0,hp:.03,element:'grove',icon:'heart',description:'伙伴最大生命+3%；森灵伙伴额外+0.5%'},
  tideAmulet:{name:'海潮护符',slot:'charm',region:2,seconds:210,materials:{shell:6,dew:4,fiber:2},coins:140,attack:0,hp:.04,element:'tide',icon:'shield',description:'伙伴最大生命+4%；潮汐伙伴额外+0.5%'},
  woodAxe:{name:'林工短斧',slot:'work',region:0,seconds:140,materials:{wood:6,fiber:3},coins:65,attack:0,hp:0,element:'grove',icon:'leaf',workJob:'logging',workSpeed:.1,description:'伐木伙伴工作效率+10%'},
  orePick:{name:'砂铁矿镐',slot:'work',region:1,seconds:180,materials:{ore:7,wood:3},coins:125,attack:0,hp:0,element:'stone',icon:'shield',workJob:'mining',workSpeed:.1,description:'挖矿伙伴工作效率+10%'},
};
export const EQUIPMENT_SLOTS=['weapon','charm','work'];
