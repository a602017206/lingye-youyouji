// 生产型伙伴在群潮内建造装置；家族决定类别和强度，所有收益有硬上限。
import {deviceRoster} from './device-specialties.js';
import {deviceReaction} from './horde-device-reactions.js';
import {creditSupport} from './horde-support-metrics.js';
export function updateHordeDevices(h,s,dt,maxHp){
 h.devices??=[];h.deviceClock??=0;h.deviceDeployments??=0;
 h.devices=h.devices.filter(device=>(device.life-=dt)>0);
 const roster=deviceRoster(s);
 if(!roster.length){h.deviceClock=0;return;}
 h.deviceClock+=dt;
 if(h.deviceClock<18)return;
 h.deviceClock%=18;
 const talent=roster[h.deviceDeployments%roster.length];
 h.deviceDeployments++;
 const strength=Math.min(1.6,talent.power*(1+talent.stage*.12));
 const owner=(s.team??[]).map(id=>s.collection.find(p=>p.id===id)).find(p=>p&&talent.family===Math.floor((p.species-301)/3)+12);
 const device={kind:talent.kind,family:talent.family,label:talent.label,x:h.hero.x,y:h.hero.y,life:14,max:14};
 h.devices.push(device);if(h.devices.length>3)h.devices.shift();
 h.deviceMaxHp=maxHp;
 const reaction=deviceReaction(h,s,device);
 if(reaction?.healed>0)creditSupport(h,owner?.id,'healing',reaction.healed);
 if(reaction){h.deviceReactions??={};h.deviceReactions[reaction.kind]=(h.deviceReactions[reaction.kind]??0)+1;}
 h.deviceStats??={shield:0,trap:0,supply:0};
 h.deviceStats[talent.kind]++;
 if(talent.kind==='shield'){const before=h.shieldPool;h.shieldPool=Math.min(maxHp*.16,h.shieldPool+maxHp*.028*strength);creditSupport(h,owner?.id,'shield',h.shieldPool-before);}
 if(talent.kind==='supply')s.energy=Math.min(100,s.energy+Math.min(10,Math.round(6*strength)));
 if(talent.kind==='trap')for(const e of h.enemies)if(e.hp>0&&Math.hypot(e.x-device.x,e.y-device.y)<150){e.slow=Math.max(e.slow,Math.min(3,1.9*strength));creditSupport(h,owner?.id,'control',1);}
}
