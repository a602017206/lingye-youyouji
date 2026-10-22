// 伙伴治疗、护盾生成与控制归因；未归属的技能保持独立总账。
export function creditSupport(h,id,kind,amount){
 if(!id||!['healing','shield','control'].includes(kind)||!Number.isFinite(amount)||amount<=0)return;
 h.partnerSupport??={};h.partnerSupport[id]??={healing:0,shield:0,control:0};
 h.partnerSupport[id][kind]+=amount;
}
export function supportFor(h,id){return {healing:0,shield:0,control:0,...h.partnerSupport?.[id]};}
