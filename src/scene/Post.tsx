import { useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { SSAOPass } from 'three/examples/jsm/postprocessing/SSAOPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { VignetteShader } from 'three/examples/jsm/shaders/VignetteShader.js';
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js';

const GRADE_SHADER = {
  uniforms: {
    tDiffuse: { value: null },
    time: { value: 0 },
    contrast: { value: 1.06 },
    saturation: { value: 1.04 },
    tint: { value: new THREE.Vector3(1.015, 1.0, 0.985) },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float time;
    uniform float contrast;
    uniform float saturation;
    uniform vec3 tint;
    varying vec2 vUv;

    float rand(vec2 co) {
      return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
    }

    void main() {
      vec4 c = texture2D(tDiffuse, vUv);
      c.rgb = (c.rgb - 0.5) * contrast + 0.5;
      float l = dot(c.rgb, vec3(0.299, 0.587, 0.114));
      c.rgb = mix(vec3(l), c.rgb, saturation);
      c.rgb *= tint;
      float grain = rand(vUv * vec2(1920.0, 1080.0) + time) - 0.5;
      c.rgb += grain * 0.01;
      gl_FragColor = c;
    }
  `,
};

/**
 * 실내 장면의 후처리.
 * 기본(균형) 모드: 블룸·비네트·컬러그레이드·SMAA만 사용해 장면을 1회만 렌더링한다.
 * `?quality=high`일 때만 SSAO·보케를 추가한다(장면 추가 렌더링 → 고사양 전용).
 */
export function Post() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const small = size.width < 900;
  const high = !small && new URLSearchParams(window.location.search).get('quality') === 'high';

  const composer = useMemo(() => {
    const c = new EffectComposer(gl);
    c.addPass(new RenderPass(scene, camera));

    if (high) {
      const ssao = new SSAOPass(scene, camera, size.width, size.height);
      ssao.kernelRadius = 0.32;
      ssao.minDistance = 0.0008;
      ssao.maxDistance = 0.08;
      ssao.output = SSAOPass.OUTPUT.Default;
      c.addPass(ssao);

      const bokeh = new BokehPass(scene, camera, {
        focus: 4.2,
        aperture: 0.00055,
        maxblur: 0.006,
      });
      c.addPass(bokeh);
    }

    const bloom = new UnrealBloomPass(
      new THREE.Vector2(size.width, size.height),
      high ? 0.1 : 0.055,
      0.6,
      0.95
    );
    c.addPass(bloom);

    const vignette = new ShaderPass(VignetteShader);
    vignette.uniforms.offset.value = 1.04;
    vignette.uniforms.darkness.value = 0.3;
    c.addPass(vignette);
    const grade = new ShaderPass(GRADE_SHADER);
    c.addPass(grade);
    c.addPass(new SMAAPass());
    return { composer: c, grade };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl, scene, camera, small, high]);

  useEffect(() => {
    composer.composer.setSize(size.width, size.height);
  }, [composer, size]);

  useFrame((state) => {
    composer.grade.uniforms.time.value = state.clock.elapsedTime;
    composer.composer.render();
  }, 1);

  return null;
}
