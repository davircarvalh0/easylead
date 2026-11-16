// One topology for entry, orbit, focus and zoom. Curves have no triangle diagonals.
export const GLOBE_GREEN = '#00e676';
export function globeWirePositions() {
 const positions = [];
 const point = (latitude, longitude) => [Math.cos(latitude)*Math.cos(longitude), Math.sin(latitude), Math.cos(latitude)*Math.sin(longitude)];
 const segment = (a,b) => positions.push(...a,...b);
 for(let meridian=0;meridian<10;meridian++) {
  const longitude=meridian*Math.PI*2/10;
  for(let step=0;step<24;step++) segment(point(-Math.PI/2+step*Math.PI/24,longitude),point(-Math.PI/2+(step+1)*Math.PI/24,longitude));
 }
 for(let parallel=1;parallel<=5;parallel++) {
  const latitude=-Math.PI/2+parallel*Math.PI/6;
  for(let step=0;step<48;step++) segment(point(latitude,step*Math.PI*2/48),point(latitude,(step+1)*Math.PI*2/48));
 }
 return new Float32Array(positions);
}
