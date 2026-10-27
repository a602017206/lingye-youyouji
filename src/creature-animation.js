// 统一伙伴动效：仅基于已有PNG做矩阵变换，不制作假贴图或增加逐角色定时器。
import {SPECIES} from './data.js';
const flying=new Set(['gale','aether','storm','dream']);
const heavy=new Set(['stone','metal','dust']);
const soft=new Set(['tide','spore','grove','venom']);
export function creatureMotion(id,time,{moving=false,attacking=false,hurt=false,reduced=false,seed=0}={}){
 if(reduced)return {x:0,y:0,rotation:0,sx:1,sy:1,flash:false};
 const type=SPECIES[id]?.type;
 const phase=time*(moving?11:flying.has(type)?3.2:heavy.has(type)?2.1:3.7)+seed*1.47+Number(id)*.13;
 const wave=Math.sin(phase),step=Math.abs(wave);
 let x=0,y=0,rotation=0,sx=1,sy=1;
 if(flying.has(type)){y=-4-wave*4;rotation=wave*.055;sx=1+wave*.017;sy=1-wave*.014;}
 else if(heavy.has(type)){y=moving?-step*3:-step*.85;rotation=wave*(moving?.037:.009);sx=1+step*.018;sy=1-step*.018;}
 else if(soft.has(type)){y=-step*(moving?6:2);rotation=wave*(moving?.05:.018);sx=1+wave*.025;sy=1-wave*.035;}
 else {y=-step*(moving?8:2.2);rotation=wave*(moving?.065:.016);sx=1+step*.035;sy=1-step*.03;}
 if(attacking){x+=Math.sin(time*19+seed)*3;rotation+=Math.sin(time*17+seed)*.08;sx*=1.055;sy*=.96;}
 if(hurt){x+=Math.sin(time*37+seed)*4;rotation+=Math.sin(time*23)*.09;}
 return {x,y,rotation,sx,sy,flash:hurt};
}
