import test from 'node:test';
import assert from 'node:assert/strict';
import {SphereGeometry,WireframeGeometry} from 'three';
import {globeWirePositions} from '../components/ui/globe-geometry.js';
test('malha elimina diagonais e reduz segmentos de verdade',()=>{
 const sphere=new SphereGeometry(1,32,32), old=new WireframeGeometry(sphere);
 const positions=globeWirePositions();
 assert.equal(positions.length/6,480);
 assert.ok(positions.length < old.attributes.position.array.length/4);
 for(let i=0;i<positions.length;i+=3) assert.ok(Math.abs(Math.hypot(...positions.slice(i,i+3))-1)<0.000001);
 sphere.dispose();old.dispose();
});
