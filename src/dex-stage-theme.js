// 图鉴展台的元素视觉规则，独立于WebGL，便于单元测试与复用。
import {SPECIES,EVOLUTION_LINES} from './data.js';
export const ELEMENT_COLORS=Object.freeze({
 grove:0x6fcf8b,ember:0xff9451,tide:0x54bde8,frost:0x9fddff,spore:0xc38de6,
 aether:0xc6a0ff,storm:0xf3d66e,metal:0xb1c1d5,radiance:0xffdc83,gale:0x76ddbb,
 umbra:0xa58acd,stone:0xd6ad82,venom:0x9fdb67,dream:0xf7a7d9,dust:0xe7bd7e
});
export function stagePalette(id){
 const species=SPECIES[id];return {primary:ELEMENT_COLORS[species?.type]??0xc6a0ff,secondary:ELEMENT_COLORS[species?.secondaryType]??0xc6a0ff};
}
export function stageEvolutionLine(id){
 const species=SPECIES[id];
 return species&&!species.rareVariantOf?(EVOLUTION_LINES[species.family]??[id]):[id];
}
