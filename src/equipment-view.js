// C3永久装备仓库和铸造清单。使用已有UI图形符号，不代替未来原创装备插画。
import { EQUIPMENT } from './equipment-data.js';
import { SPECIES } from './data.js';
import { equipmentBonuses } from './equipment.js';
import { itemIcon } from './art-registry.js';
export function equipmentView(s,tr,icon,name){
 const c=s.camp;
 return '<section class="camp-section camp-equipment" id="camp-equipment">'
  +'<div class="section-heading"><h2>'+icon('shield')+tr('gearTitle')+'</h2><small>'+tr('gearOwned',{count:c.equipment.length})+'</small></div>'
  +'<p class="gear-hint">'+tr('gearHint')+'</p>'
  +'<div class="gear-crafting-grid">'+Object.entries(EQUIPMENT).map(([id,item])=>{
    const locked=item.region>s.unlockedRegion;
    const affordable=!locked&&!c.craft&&s.coins>=item.coins&&Object.entries(item.materials).every(([k,v])=>c.resources[k]>=v)&&c.equipment.length<120;
    const costs=Object.entries(item.materials).map(([k,n])=>tr('campRes'+k)+' '+c.resources[k]+'/'+n).join(' · ')+' · '+tr('coins')+' '+item.coins;
    return '<article class="gear-recipe-card '+(locked?'camp-locked':'')+'"><header><span class="gear-icon">'+itemIcon('equipment',id,icon,item.icon)+'</span><div><strong>'+tr('gear'+id)+'</strong><small>'+tr(item.slot==='weapon'?'gearWeapon':item.slot==='work'?'gearWork':'gearCharm')+' · '+tr('gearBonus'+id)+'</small></div></header>'
    +'<p>'+costs+'</p><footer><span>'+tr('gearCraftSeconds',{seconds:item.seconds})+'</span><button class="secondary-button" data-gear-craft="'+id+'" '+(affordable?'':'disabled')+'>'+(locked?tr('locked'):tr('campMake'))+'</button></footer></article>';
  }).join('')+'</div>'
  +'<div class="section-heading gear-list-title"><h3>'+tr('gearWarehouse')+'</h3><small>'+tr('gearOwned',{count:c.equipment.length})+'</small></div>'
  +'<div class="gear-instance-list">'+(c.equipment.map(item=>{
   const spec=EQUIPMENT[item.recipe];
   const owner=s.collection.find(p=>p.id===item.owner);
   const available=s.collection.filter(p=>!c.equipment.some(e=>e.owner===p.id&&EQUIPMENT[e.recipe].slot===spec.slot));
   const mods=owner?equipmentBonuses(s,owner.id):null;
   return '<article class="gear-instance"><span class="gear-icon">'+itemIcon('equipment',item.recipe,icon,spec.icon)+'</span>'
    +'<div class="gear-instance-info"><strong>'+tr('gear'+item.recipe)+'</strong><small>'+item.uid+' · '+tr(spec.slot==='weapon'?'gearWeapon':spec.slot==='work'?'gearWork':'gearCharm')+'</small>'
    +'<p>'+(owner?tr('gearEquipped',{name:name(owner.species)}):tr('gearUnequipped'))+'</p></div>'
    +(owner?'<button class="secondary-button" data-gear-unequip="'+item.uid+'">'+tr('gearRemove')+'</button>':
      '<div class="gear-assign"><select aria-label="'+tr('gearPartner')+'" data-gear-owner="'+item.uid+'">'+available.map(p=>'<option value="'+p.id+'">'+name(p.species)+' · Lv.'+p.level+'</option>').join('')+'</select>'
      +'<button class="secondary-button" data-gear-equip="'+item.uid+'" '+(!available.length?'disabled':'')+'>'+tr('gearEquip')+'</button></div>')
    +'</article>';
  }).join('')||'<div class="camp-empty">'+tr('gearEmpty')+'</div>')+'</div></section>';
}
