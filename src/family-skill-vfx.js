// 10种家族战技的Canvas表现参数，不使用角色替代图像。
export const SIGNATURE_VFX=Object.freeze({
 flame:{shape:'rays',color:'#ff884a',count:9},chain:{shape:'bolts',color:'#ffe16b',count:5},
 freeze:{shape:'snow',color:'#a6efff',count:8},bulwark:{shape:'shield',color:'#e2af77',count:6},
 tideSlash:{shape:'slashes',color:'#62d5ff',count:5},sunHeal:{shape:'petals',color:'#ffe5a0',count:8},
 shadowStrike:{shape:'slashes',color:'#ae7cff',count:3},starShield:{shape:'stars',color:'#c8beff',count:7},
 venom:{shape:'bubbles',color:'#9bdf82',count:9},ironPush:{shape:'rays',color:'#c9d2df',count:7}
});
export function skillVisual(action){return SIGNATURE_VFX[action]??null;}
