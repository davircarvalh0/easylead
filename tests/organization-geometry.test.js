import test from 'node:test';
import assert from 'node:assert/strict';
import {SphereGeometry,WireframeGeometry} from 'three';
import {globeWirePositions} from '../components/ui/globe-geometry.js';
import {constellationFrame} from '../components/ui/solar-orbits.js';
test('malha elimina diagonais e reduz segmentos de verdade',()=>{
 const sphere=new SphereGeometry(1,32,32), old=new WireframeGeometry(sphere);
 const positions=globeWirePositions();
 assert.equal(positions.length/6,480);
 assert.ok(positions.length < old.attributes.position.array.length/4);
 for(let i=0;i<positions.length;i+=3) assert.ok(Math.abs(Math.hypot(...positions.slice(i,i+3))-1)<0.000001);
 sphere.dispose();old.dispose();
});

test('a constelação abre espaço para a subárea maior', () => {
 const atoms = ['a4', 'a3', 'a2', 'a1', 'a0'].map(id => ({id, count: 1}));
 const techGrows = atoms.map(atom => ({
  ...atom,
  count: atom.id === 'a2' ? 6 : atom.id === 'a0' ? 2 : 1,
 }));
 for (const width of [320, 390, 1280]) {
  const height = 740;
  const before = constellationFrame(atoms, width, height, 0, 0, 0);
  const after = constellationFrame(techGrows, width, height, 0, 0, 0);
  const tech = after[2], product = after[1];
  assert.ok(tech.diameter > before[2].diameter);
  assert.ok(tech.diameter >= product.diameter * 2.4);
  assert.ok(Math.abs((tech.diameter / product.diameter) ** 2 - 6) < .01);
  assert.ok(Math.abs((tech.diameter / after[4].diameter) ** 2 - 3) < .01);
  assert.ok(product.x > before[1].x + 8);
  for (const [index, planet] of after.entries()) {
   if (planet.id !== 'a2') assert.ok(planet.x > before[index].x);
   assert.ok(planet.x >= planet.diameter / 2 && planet.x <= width - planet.diameter / 2);
   for (const other of after.slice(index + 1)) {
    assert.ok(Math.hypot(planet.x - other.x, planet.y - other.y) > (planet.diameter + other.diameter) / 2);
   }
  }
 }
});

test('planetas trocam de posição quando a liderança muda', () => {
 const atoms = [
  {id: 'a4', count: 1}, {id: 'a3', count: 2}, {id: 'a2', count: 6},
  {id: 'a1', count: 1}, {id: 'a0', count: 3},
 ];
 const innovationGrows = atoms.map(atom => atom.id === 'a0' ? {...atom, count: 7} : atom);
 for (const width of [320, 390, 1280]) {
  const before = constellationFrame(atoms, width, 740, 0, 0, 0);
  const after = constellationFrame(innovationGrows, width, 740, 0, 0, 0);
  assert.deepEqual(after.map(planet => planet.id), atoms.map(atom => atom.id));
  assert.equal(before[2].slot, 'a2');
  assert.equal(before[4].slot, 'a0');
  assert.equal(after[2].slot, 'a0');
  assert.equal(after[4].slot, 'a2');
  assert.ok(after[2].x > before[2].x);
  assert.ok(after[4].x < before[4].x);
  assert.ok(after[4].diameter > after[2].diameter);
  assert.deepEqual(after.filter(planet => planet.id !== 'a0' && planet.id !== 'a2').map(planet => planet.slot), ['a4', 'a3', 'a1']);
  const shuffled = constellationFrame([...innovationGrows].reverse(), width, 740, 0, 0, 0);
  for (const [index, planet] of shuffled.reverse().entries()) {
   const expected = after[index];
   assert.equal(planet.id, expected.id);
   assert.equal(planet.slot, expected.slot);
   assert.ok(Math.hypot(planet.x - expected.x, planet.y - expected.y) < .001);
  }
 }
});
