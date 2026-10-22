// 生产/探索家族上阵时的战场支援：职业之间有差异，但不取代战斗家族专属技能。
import {SPECIES} from './data.js';
export function familyFieldSupport(state){
 const members=(state.team??[]).map(id=>state.collection.find(p=>p.id===id)).filter(Boolean);
 const work=new Set(),explore=new Set();
 for(const p of members){const spec=SPECIES[p.species];if(!spec||spec.family<22||spec.family>41)continue;
 if(spec.family<32)work.add(spec.family);else explore.add(spec.family);}
 return {shield:Math.min(.05,work.size*.012),vision:Math.min(.09,explore.size*.03),
  supplies:work.has(27),scout:explore.has(32)||explore.has(37),workFamilies:[...work],exploreFamilies:[...explore]};
}
