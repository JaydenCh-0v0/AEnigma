import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

/** 微缩 tilt-shift：上下虚化 + 暗角，中央清晰带像桌上模型。 */
const MiniShader = {
  uniforms: {
    tDiffuse: { value: null },
    uFocus: { value: 0.48 },
    uRange: { value: 0.22 },
    uBlur: { value: 1.35 },
    uVignette: { value: 0.42 },
    uRes: { value: new THREE.Vector2(1, 1) },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uFocus;
    uniform float uRange;
    uniform float uBlur;
    uniform float uVignette;
    uniform vec2 uRes;
    varying vec2 vUv;

    vec4 sampleBlur(vec2 uv, float amount) {
      vec2 px = amount / uRes;
      vec4 c = texture2D(tDiffuse, uv) * 0.2;
      c += texture2D(tDiffuse, uv + vec2( px.x, 0.0)) * 0.12;
      c += texture2D(tDiffuse, uv + vec2(-px.x, 0.0)) * 0.12;
      c += texture2D(tDiffuse, uv + vec2(0.0,  px.y)) * 0.12;
      c += texture2D(tDiffuse, uv + vec2(0.0, -px.y)) * 0.12;
      c += texture2D(tDiffuse, uv + vec2( px.x,  px.y)) * 0.08;
      c += texture2D(tDiffuse, uv + vec2(-px.x,  px.y)) * 0.08;
      c += texture2D(tDiffuse, uv + vec2( px.x, -px.y)) * 0.08;
      c += texture2D(tDiffuse, uv + vec2(-px.x, -px.y)) * 0.08;
      return c;
    }

    void main() {
      float dist = abs(vUv.y - uFocus);
      float blurAmt = smoothstep(uRange, uRange + 0.35, dist) * uBlur * 4.5;
      vec4 sharp = texture2D(tDiffuse, vUv);
      vec4 soft = sampleBlur(vUv, max(blurAmt, 0.001));
      float mixK = smoothstep(0.0, 1.0, blurAmt / 4.5);
      vec4 col = mix(sharp, soft, mixK);

      float r = length(vUv - 0.5);
      float vig = smoothstep(0.55, 1.15, r);
      col.rgb *= 1.0 - vig * uVignette;
      gl_FragColor = col;
    }
  `,
};

export function createPostFX(renderer, scene, camera, { lite = false } = {}) {
  const size = new THREE.Vector2();
  renderer.getSize(size);

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));

  const bloom = new UnrealBloomPass(size.clone(), lite ? 0.35 : 0.55, 0.4, 0.82);
  bloom.threshold = 0.78;
  bloom.strength = lite ? 0.35 : 0.55;
  bloom.radius = 0.45;
  composer.addPass(bloom);

  const mini = new ShaderPass(MiniShader);
  mini.uniforms.uRes.value.set(size.x * renderer.getPixelRatio(), size.y * renderer.getPixelRatio());
  if (lite) {
    mini.uniforms.uBlur.value = 0.85;
    mini.uniforms.uVignette.value = 0.32;
  }
  composer.addPass(mini);
  composer.addPass(new OutputPass());

  return {
    composer,
    bloom,
    mini,
    setNight(night) {
      bloom.strength = (lite ? 0.28 : 0.42) + night * (lite ? 0.35 : 0.55);
      bloom.threshold = 0.82 - night * 0.12;
    },
    setSize(w, h) {
      composer.setSize(w, h);
      const pr = renderer.getPixelRatio();
      mini.uniforms.uRes.value.set(w * pr, h * pr);
    },
    render() {
      composer.render();
    },
  };
}
