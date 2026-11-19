import logoUrl from '../../proposta-visual/assets/logo-citi-simbolo.png';

export async function createBrandObject(THREE) {
  const image = new Image();
  image.src = logoUrl;
  await image.decode();

  const canvas = document.createElement('canvas');
  canvas.width = 240;
  canvas.height = 86;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(image, 0, 0, 165, 85);
  ctx.font = '700 41px system-ui';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#f1fff8';
  ctx.fillText('/all', 165, 47);

  const { width, height } = canvas;
  const alpha = ctx.getImageData(0, 0, width, height).data;
  const pixelsToWorld = 4.25 / width;
  const depth = .26;
  const vertices = [];
  const solid = (x, y) => x >= 0 && y >= 0 && x < width && y < height && alpha[(y * width + x) * 4 + 3] > 127;
  function wall(x1, y1, x2, y2) {
    const a = [(x1 - width / 2) * pixelsToWorld, (height / 2 - y1) * pixelsToWorld];
    const b = [(x2 - width / 2) * pixelsToWorld, (height / 2 - y2) * pixelsToWorld];
    const front = depth / 2;
    vertices.push(...a, -front, ...a, front, ...b, front, ...a, -front, ...b, front, ...b, -front);
  }
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!solid(x, y)) continue;
      if (!solid(x - 1, y)) wall(x, y + 1, x, y);
      if (!solid(x + 1, y)) wall(x + 1, y, x + 1, y + 1);
      if (!solid(x, y - 1)) wall(x, y, x + 1, y);
      if (!solid(x, y + 1)) wall(x + 1, y + 1, x, y + 1);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const faces = new THREE.PlaneGeometry(width * pixelsToWorld, height * pixelsToWorld);
  const faceMaterial = new THREE.MeshStandardMaterial({ map:texture, alphaTest:.5, side:THREE.DoubleSide, metalness:.13, roughness:.31 });
  const sides = new THREE.BufferGeometry();
  sides.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  sides.computeVertexNormals();
  const metal = new THREE.MeshStandardMaterial({
    color: '#38ba86', metalness: .48, roughness: .24, side: THREE.DoubleSide,
    emissive: '#06291d', emissiveIntensity: .7,
  });
  const group = new THREE.Group();
  for (const z of [-depth / 2, depth / 2]) {
    const face = new THREE.Mesh(faces, faceMaterial);
    face.position.z = z;
    group.add(face);
  }
  group.add(new THREE.Mesh(sides, metal));
  return { group, resources: [texture, faces, faceMaterial, sides, metal] };
}
