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
 return path?'<span class="camp-art" data-camp-art="'+category+'/'+id+'"><img class="camp-original-item-icon" src="'+path+'" width="256" height="256" alt="" loading="lazy" draggable="false" /><span class="camp-art-fallback" hidden>'+iconFallback(iconName)+'</span></span>':iconFallback(iconName);
}
// 保留旧界面图标供网络/解码失败时使用，不改变资源登记、不循环重试坏图。
export function handleCampArtError(event){
 const image=event.target;
 if(!image?.matches?.('img.camp-original-item-icon'))return;
 const container=image.closest('[data-camp-art]'),fallback=container?.querySelector('.camp-art-fallback');
 if(!fallback)return;
 image.hidden=true;fallback.hidden=false;container.dataset.artFailed='true';
}
