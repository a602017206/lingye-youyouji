// D2-B独立原画资源约定：只有通过验收的PNG才会进入正式UI；缺图沿用既有真实SVG界面图标。
import {CAMP_RESOURCES,CAMP_RECIPES,CAMP_FACILITIES} from './camp-data.js';
import {EQUIPMENT} from './equipment-data.js';
import {AVAILABLE_ART} from './art-available.js';
export const ART_CATEGORIES=Object.freeze({
 facilities:Object.keys(CAMP_FACILITIES),
 resources:Object.keys(CAMP_RESOURCES),
 consumables:Object.keys(CAMP_RECIPES),
 equipment:Object.keys(EQUIPMENT),
});
export const ART_TOTAL=Object.values(ART_CATEGORIES).reduce((n,ids)=>n+ids.length,0);
export function artPath(category,id){
 if(!Object.hasOwn(ART_CATEGORIES,category)||!ART_CATEGORIES[category].includes(id))return null;
 const key=category+'/'+id;
 return AVAILABLE_ART[key]===true?'/lingye-youyouji/assets/camp/'+key+'.png':null;
}
export function itemIcon(category,id,iconFallback,iconName){
 const path=artPath(category,id);
 return path?'<img class="camp-original-item-icon" src="'+path+'" width="46" height="46" alt="" loading="lazy" draggable="false" />':iconFallback(iconName);
}
