// 新的30个原创伙伴家族：每家族3个不同阶段，共90种形态。
// 注意：这份清单是正式数值与进化元数据，不代表已有90张独立立绘。
export const NEW_FAMILIES = [
 // 战斗型：10条进化路线
 {names:['焰尾狐','赤绫狐','燎原九焰'],type:'ember',secondaryType:'gale',focus:'battle',rarity:'common'},
 {names:['雷角獾','奔霆獾','震岳雷君'],type:'storm',secondaryType:'stone',focus:'battle',rarity:'common'},
 {names:['霜牙狼','寒鬃狼','夜霜逐影'],type:'frost',secondaryType:'umbra',focus:'battle',rarity:'rare'},
 {names:['熔甲犀','熔脊犀','不灭熔岳'],type:'stone',secondaryType:'ember',focus:'battle',rarity:'rare'},
 {names:['潮刃螳','逐浪螳','千刃潮舞'],type:'tide',secondaryType:'gale',focus:'battle',rarity:'common'},
 {names:['光羽狮鹫','曜翼狮鹫','辉穹狮皇'],type:'radiance',secondaryType:'gale',focus:'battle',rarity:'rare'},
 {names:['影爪豹','影驰豹','无相夜猎'],type:'umbra',secondaryType:'storm',focus:'battle',rarity:'epic'},
 {names:['星锤龟','星脉岩龟','群星玄甲'],type:'aether',secondaryType:'stone',focus:'battle',rarity:'epic'},
 {names:['毒棘蝎','腐刺蝎','瘴漠毒王'],type:'venom',secondaryType:'dust',focus:'battle',rarity:'rare'},
 {names:['铁拳猿','钢腕猿','万钧铁圣'],type:'metal',secondaryType:'storm',focus:'battle',rarity:'epic'},
 // 生产型：10条进化路线
 {names:['木铃鹿','林铃灵鹿','千枝古鹿'],type:'grove',secondaryType:'radiance',focus:'work',rarity:'common'},
 {names:['铁齿鼹','钻岩鼹','地心掘主'],type:'metal',secondaryType:'stone',focus:'work',rarity:'common'},
 {names:['苔菇灵','苔茸伞灵','万菌雨母'],type:'spore',secondaryType:'grove',focus:'work',rarity:'common'},
 {names:['泉泡龟','涟泡灵龟','净泉潮灵'],type:'tide',secondaryType:'radiance',focus:'work',rarity:'common'},
 {names:['沙爪狸','掠砂狸','流漠拾荒王'],type:'dust',secondaryType:'stone',focus:'work',rarity:'common'},
 {names:['铜壳蟹','机铜蟹','百工械甲'],type:'metal',secondaryType:'tide',focus:'work',rarity:'rare'},
 {names:['雾叶蝶','风叶蝶','翠岚织翼'],type:'gale',secondaryType:'grove',focus:'work',rarity:'rare'},
 {names:['毒囊蛙','药雾毒蛙','百草瘴尊'],type:'venom',secondaryType:'tide',focus:'work',rarity:'rare'},
 {names:['熔炉獭','锻焰獭','炎铸工匠'],type:'ember',secondaryType:'metal',focus:'work',rarity:'epic'},
 {names:['星壳蜗','星轨蜗','寰宇藏壳'],type:'aether',secondaryType:'spore',focus:'work',rarity:'legendary'},
 // 探索型：10条进化路线
 {names:['风羽雀','踏岚雀','天行游隼'],type:'gale',secondaryType:'radiance',focus:'explore',rarity:'common'},
 {names:['星灯猫','引梦灯猫','星河巡夜'],type:'aether',secondaryType:'dream',focus:'explore',rarity:'epic'},
 {names:['影尾狸','幽径狸','无声寻踪'],type:'umbra',secondaryType:'grove',focus:'explore',rarity:'common'},
 {names:['潮汐獭','浪纹獭','深潮寻珍'],type:'tide',secondaryType:'aether',focus:'explore',rarity:'common'},
 {names:['梦絮羊','绵梦羊','织梦牧云'],type:'dream',secondaryType:'radiance',focus:'explore',rarity:'rare'},
 {names:['砂翼鸮','渡漠鸮','沙海瞭望'],type:'dust',secondaryType:'gale',focus:'explore',rarity:'common'},
 {names:['菌冠兔','荧冠兔','秘林幻菇'],type:'spore',secondaryType:'dream',focus:'explore',rarity:'rare'},
 {names:['夜烛鸦','烛影鸦','长夜执灯'],type:'umbra',secondaryType:'radiance',focus:'explore',rarity:'legendary'},
 {names:['晶脉鹿','晶角鹿','遗迹晶皇'],type:'stone',secondaryType:'aether',focus:'explore',rarity:'epic'},
 {names:['云歌鹭','逐云鹭','天穹远歌'],type:'gale',secondaryType:'tide',focus:'explore',rarity:'rare'},
];
export const NEW_FAMILY_START_ID=301;
export const NEW_EVOLUTION_LINES=NEW_FAMILIES.map((family,i)=>[0,1,2].map(stage=>NEW_FAMILY_START_ID+i*3+stage));
