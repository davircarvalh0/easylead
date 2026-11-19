const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

export function particleCloud(surfaceCount = 5200, bandCount = 4600, haloCount = 650) {
  const positions = [];
  const strengths = [];
  let seed = 91237;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  function point(latitude, angle, radius, strength) {
    const ring = Math.sqrt(1 - latitude * latitude) * radius;
    const x = Math.cos(angle) * ring;
    const y = latitude * radius;
    positions.push(x, y * .985 + x * .17, Math.sin(angle) * ring);
    strengths.push(strength);
  }
  for (let i = 0; i < surfaceCount; i++) {
    const latitude = 1 - 2 * (i + .5) / surfaceCount;
    point(latitude, i * GOLDEN_ANGLE, .995 + random() * .016, .28 + random() * .67);
  }
  for (let i = 0; i < bandCount; i++) {
    const angle = random() * Math.PI * 2;
    const latitude = (random() + random() + random() - 1.5) * .235 + Math.sin(angle * 2) * .055;
    point(latitude, angle, 1 + (random() - .5) * .085, .45 + random() * .55);
  }
  for (let i = 0; i < haloCount; i++) {
    point(random() * 2 - 1, random() * Math.PI * 2, 1.035 + random() ** 2 * .28, .08 + random() * .26);
  }
  return { positions: new Float32Array(positions), strengths: new Float32Array(strengths) };
}

export function createParticleGeometry(THREE) {
  const {positions, strengths} = particleCloud();
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('strength', new THREE.BufferAttribute(strengths, 1));
  return geometry;
}

export function createParticleMaterial(THREE, color, pixelRatio) {
  return new THREE.ShaderMaterial({
    uniforms: { tint: { value: new THREE.Color(color) }, pixelRatio: { value: pixelRatio }, immersion: { value: 0 },
      pointer: {value:new THREE.Vector2()}, response: {value:0},
      pulseOrigin: {value:new THREE.Vector2()}, pulseAge: {value:2}, pulseSign: {value:1} },
    vertexShader: `
      attribute float strength;
      uniform float pixelRatio;
      uniform float immersion;
      uniform vec2 pointer;
      uniform float response;
      uniform vec2 pulseOrigin;
      uniform float pulseAge;
      uniform float pulseSign;
      varying float flash;
      varying float energy;
      varying float opacity;
      void main() {
        vec3 normal = normalize(mat3(modelViewMatrix) * position);
        float face = smoothstep(-.12, .52, normal.z);
        vec2 local = normal.xy - pointer;
        float attract = exp(-dot(local,local)*7.) * face * response;
        float distanceToPulse = length(normal.xy - pulseOrigin);
        float ring = distanceToPulse - pulseAge * 2.25;
        float wave = exp(-ring*ring*65. - pulseAge*2.45) * face;
        float flutter = sin(strength*41. + pulseAge*10.) * .45 + .55;
        vec3 displaced = position * (1. + attract*.050 + pulseSign*wave*(.06+flutter*.10));
        vec4 eye = modelViewMatrix * vec4(displaced, 1.0);
        flash = attract*.52 + wave*(.3+flutter*.55);
        float lit = max(0., dot(normal, normalize(vec3(-.75, .28, .8))));
        float edge = pow(1. - abs(normal.z), 2.3);
        float behind = mix(mix(.19, 1., smoothstep(-.19, .35, normal.z)), .94, immersion);
        float zoom = length(modelViewMatrix[0].xyz) / max(.15, -eye.z);
        energy = clamp(.16 + lit * .67 + edge * .42 + immersion * .31, 0., 1.);
        opacity = strength * behind * (.38 + lit * .32 + edge * .51 + immersion * .47);
        gl_PointSize = pixelRatio * clamp(.9 + zoom * 16. + edge * .32 + immersion * .55, .85, 3.4);
        gl_Position = projectionMatrix * eye;
      }`,
    fragmentShader: `
      uniform vec3 tint;
      varying float flash;
      varying float energy;
      varying float opacity;
      void main() {
        float r = length(gl_PointCoord - .5);
        if (r > .48) discard;
        vec3 highlight = mix(tint, vec3(1., .97, .79), clamp(pow(energy, 4.) * .73 + flash * .42,0.,.95));
        gl_FragColor = vec4(highlight * (.52 + energy * .65), (opacity + flash*.48) * (1. - smoothstep(.19, .49, r)));
        #include <colorspace_fragment>
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
}

const fallbackCloud = particleCloud(1300, 950, 200);
export function paintParticleGlobe(canvas, color) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const center = canvas.width / 2;
  const radius = center * .78;
  const {positions, strengths} = fallbackCloud;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < strengths.length; i++) {
    const [x,y,z] = positions.subarray(i*3,i*3+3);
    const light = Math.max(0, -.66*x+.25*y+.68*z);
    const edge = (1-Math.min(1,Math.abs(z))) ** 2;
    ctx.globalAlpha = Math.min(.98,strengths[i]*(z<-.13?.27:.93)*(.44+light*.37+edge*.54));
    ctx.fillStyle = light+edge>.95 ? '#fff3c4' : color;
    const size = .85 + edge*.6;
    ctx.fillRect(center+x*radius,center-y*radius,size,size);
  }
  ctx.globalAlpha=1;
}
