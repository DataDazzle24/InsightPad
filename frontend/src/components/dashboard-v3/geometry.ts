/** Presentation helpers only. Never use plotted numbers to serialize money. */
export function smoothPath(points:ReadonlyArray<readonly [number,number]>):string {
 if(!points.length)return ''; if(points.length===1)return `M${points[0][0]},${points[0][1]}`;
 const d=points.slice(1).map((p,i)=>(p[1]-points[i][1])/(p[0]-points[i][0]||1));
 const m=points.map((_,i)=>i===0?d[0]:i===points.length-1?d[d.length-1]:d[i-1]*d[i]<=0?0:2/(1/d[i-1]+1/d[i]));
 d.forEach((v,i)=>{if(!v){m[i]=m[i+1]=0;return;}const a=m[i]/v,b=m[i+1]/v,s=a*a+b*b;if(s>9){const f=3/Math.sqrt(s);m[i]=f*a*v;m[i+1]=f*b*v;}});
 let path=`M${points[0][0]},${points[0][1]}`;
 for(let i=0;i<points.length-1;i++){const [x,y]=points[i],[nx,ny]=points[i+1],h=(nx-x)/3;path+=` C${x+h},${y+m[i]*h} ${nx-h},${ny-m[i+1]*h} ${nx},${ny}`;}
 return path;
}
export function compareRaw(a:unknown,b:unknown):number {
 if(typeof a==='string'&&typeof b==='string'&&/^[+-]?\d+$/.test(a)&&/^[+-]?\d+$/.test(b)){const x=BigInt(a),y=BigInt(b);return x===y?0:x>y?1:-1;}
 if(typeof a==='number'&&typeof b==='number')return a-b;
 return String(a??'').localeCompare(String(b??''),'pt-BR',{numeric:true});
}
export function heatStyle(value:number,values:number[]):{backgroundColor?:string}{
 if(!Number.isFinite(value)||value===0)return {};
 const d=[...new Set(values.filter(Number.isFinite).map(Math.abs).filter(Boolean))].sort((a,b)=>a-b),r=d.length<2?.5:Math.max(0,d.indexOf(Math.abs(value)))/(d.length-1);
 return {backgroundColor:`hsl(${value<0?33:210-62*r} 92% 53% / ${.14+.33*r})`};
}
export function toggleSelection(current:string[],id:string,additive:boolean):string[]{return additive?(current.includes(id)?current.filter(x=>x!==id):[...current,id]):current.length===1&&current[0]===id?[]:[id];}

/** Offsets are derived before JSX rendering; no component closure is mutated. */
export function ringSegments(values: readonly number[], circumference = 440) {
 const sum=values.reduce((total,value)=>total+value,0),segments:{start:number;length:number}[]=[];
 let start=0;
 for(const value of values){const length=value/sum*circumference;segments.push({start,length});start+=length;}
 return segments;
}

/** Split missing observations without drawing an invented connection over a gap. */
export function lineSegments(points:ReadonlyArray<readonly [number,number]>) {
 const segments:Array<Array<readonly [number,number]>>=[];
 let current:Array<readonly [number,number]>=[];
 for(const point of points){if(Number.isFinite(point[0])&&Number.isFinite(point[1]))current.push(point);else if(current.length){segments.push(current);current=[];}}
 if(current.length)segments.push(current);
 return segments;
}
