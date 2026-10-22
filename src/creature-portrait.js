// 没有通过原画验收的新形态只显示伙伴名称，不用别的精灵图冒充、不发出失效图片请求。
import {sprite} from './data.js';
const escapeText=text=>String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function portraitMarkup(species,name,className=''){
 const src=sprite(species),label=escapeText(name);
 return src?'<img class="'+className+'" src="'+src+'" alt="'+label+'" loading="lazy" draggable="false" />'
   :'<span class="creature-art-pending '+className+'" role="img" aria-label="'+label+'">'+label+'<small>立绘待制作</small></span>';
}
