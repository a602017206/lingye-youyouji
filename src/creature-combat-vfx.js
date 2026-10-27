// 属性战斗动效：仅用于绘制，永不写入战斗状态和存档。
import {SPECIES} from './data.js';
const bursts={
 ember:'flare',storm:'sparks',frost:'crystal',tide:'ripple',grove:'leaves',spore:'motes',
 radiance:'halo',gale:'gust',metal:'slash',stone:'dust',dust:'dust',
 aether:'stars',umbra:'shade',venom:'motes',dream:'stars'
};
export function creatureAttackStyle(id){
 const type=SPECIES[id]?.type??'grove';
 return {type,shape:bursts[type]??'motes',duration:.28,range:SPECIES[id]?.stage===2?29:22};
}
export function creatureAttackPose(id,progress,reduced=false){
 if(reduced||progress<=0||progress>=1)return {x:0,y:0,rotation:0,sx:1,sy:1};
 const kind=creatureAttackStyle(id).shape;
 const strike=Math.sin(Math.PI*progress);
 const vector=kind==='gust'||kind==='slash'?1:kind==='dust'?.35:.65;
 return {x:strike*12*vector,y:-strike*(kind==='stars'||kind==='halo'?10:5),rotation:strike*(kind==='slash'?.18:kind==='gust'?-.13:.06),sx:1+strike*.12,sy:1-strike*.09};
}
