// 守护者纪念物：独立于物种收集、局内构筑的永久单机成就。
export const GUARDIAN_TOKENS=[
 {id:0,name:'森冠古芽',region:0,icon:'leaf',desc:'击败林地守护者后取得的珍藏；林地作战伤害+4.5%'},
 {id:1,name:'赤砂陶铭',region:1,icon:'shield',desc:'击败沙谷守护者后取得的珍藏；沙谷作战伤害+4.5%'},
 {id:2,name:'潮汐泪珠',region:2,icon:'ball',desc:'击败浅湾守护者后取得的珍藏；浅湾作战伤害+4.5%'},
 {id:3,name:'霜铃月羽',region:3,icon:'sun',desc:'击败雪原守护者后取得的珍藏；雪原作战伤害+4.5%'},
 {id:4,name:'暮紫孢冠',region:4,icon:'spark',desc:'击败菌境守护者后取得的珍藏；菌境作战伤害+4.5%'},
 {id:5,name:'辉环星核',region:5,icon:'compass',desc:'击败浮岛守护者后取得的珍藏；浮岛作战伤害+4.5%'},
];
export function grantGuardianToken(s,region){
 if(!Number.isInteger(region)||region<0||region>=GUARDIAN_TOKENS.length)return false;
 if(!Array.isArray(s.guardianTokens))s.guardianTokens=[];
 if(s.guardianTokens.includes(region))return false;
 s.guardianTokens.push(region);
 s.guardianTokens.sort((a,b)=>a-b);
 return true;
}
export function guardianBonus(s,region){
 return (s.guardianTokens??[]).includes(region)?1.045:1;
}
