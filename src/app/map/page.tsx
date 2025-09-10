'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { AfterimagePass } from 'three/examples/jsm/postprocessing/AfterimagePass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'

const PARTICLE_COUNT = 30000; // 2배 증가
const SPARK_COUNT = 4000;     // 2배 증가
const STAR_COUNT = 7000;

export default function MorphingShapes() {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const composerRef = useRef<EffectComposer | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const particlesRef = useRef<THREE.Points | null>(null)
  const sparklesRef = useRef<THREE.Points | null>(null)
  const starsRef = useRef<THREE.Points | null>(null)
  const clockRef = useRef(new THREE.Clock())
  const currentPatternRef = useRef(0)
  const isTransRef = useRef(false)
  const progRef = useRef(0)
  const morphSpeed = 0.03
  
  // 감정 데이터 상태 (감정명과 개수, 또는 sentiment 분류와 개수)
  const [emotionData, setEmotionData] = useState<{ [key: string]: number }>({})
  
  // 감정별 색상 매핑 (동적으로 감정을 분류)
  const getEmotionColor = useCallback((emotion: string): number[] => {
    const emotionLower = emotion.toLowerCase();
    
    // sentiment 기반 분류 (API에서 positive/negative로 분류된 경우)
    if (emotionLower === 'positive') {
      // 긍정적 sentiment - 밝은 노란색, 초록색, 주황색 계열
      return [[0xFFD700, 0xFFA500, 0xFFE135], [0x32CD32, 0x90EE90, 0x7CFC00], [0xFF8C00, 0xFFA500, 0xFFB347]][Math.floor(Math.random() * 3)];
    }
    
    if (emotionLower === 'negative') {
      // 부정적 sentiment - 빨간색, 진한 파란색, 보라색 계열
      return [[0xFF0000, 0xDC143C, 0xB22222], [0x0000CD, 0x4169E1, 0x1E90FF], [0x8B008B, 0x9932CC, 0x8A2BE2]][Math.floor(Math.random() * 3)];
    }
    
    // 긍정적 감정들 - 따뜻한 색상
    const positiveEmotions = ['기쁨', '사랑', '만족', '감격', '들뜸', '반가움', '뿌듯', '유쾌', '행복', '좋다', '싱글벙글', '흐뭇', '웃음', '재미', '흥미', '설렘', '친밀감', '희망', '갈망', '소망', '꿈', 'lovely', 'cute', 'want'];
    if (positiveEmotions.some(pos => emotionLower.includes(pos.toLowerCase()))) {
      return [[0xFFD700, 0xFFA500, 0xFFB347], [0xFF69B4, 0xFF1493, 0xFF6B6B], [0x98FB98, 0x90EE90, 0x7CFC00], 
              [0xFF7F50, 0xFF4500, 0xFF6347], [0xDDA0DD, 0xBA55D3, 0x9370DB], [0x20B2AA, 0x48D1CC, 0x40E0D0]][Math.floor(Math.random() * 6)];
    }
    
    // 부정적 감정들 - 차가운/어두운 색상  
    const negativeEmotions = ['슬픔', '미움', '두려움', '화', '걱정', '외롭', '불안', '괴로움', '우울', '속상', '짜증', '분풀이', '썽남', '씩씩', '투덜', '퉁명', '칭얼', '분노', '아픔'];
    if (negativeEmotions.some(neg => emotionLower.includes(neg.toLowerCase()))) {
      return [[0x4682B4, 0x5F9EA0, 0x708090], [0x8B0000, 0xB22222, 0xDC143C], [0x2F4F4F, 0x696969, 0x778899], 
              [0xFF4500, 0xFF6347, 0xCD5C5C], [0x9370DB, 0x8A2BE2, 0x9932CC], [0x6A5ACD, 0x483D8B, 0x4B0082]][Math.floor(Math.random() * 6)];
    }
    
    // 중성적 감정들 - 부드러운 색상
    const neutralEmotions = ['놀라움', '신기함', '궁금', '어리둥절', '어이없음', '당황', 'so so'];
    if (neutralEmotions.some(neu => emotionLower.includes(neu.toLowerCase()))) {
      return [[0xE6E6FA, 0xD8BFD8, 0xDDA0DD], [0xB0E0E6, 0xADD8E6, 0x87CEFA], [0xF5DEB3, 0xDEB887, 0xD2B48C]][Math.floor(Math.random() * 3)];
    }
    
    // 기본값 (알 수 없는 감정)
    return [0xFFFFFF, 0xF0F8FF, 0xE6E6FA];
  }, []);

  const normalise = (points: THREE.Vector3[], size: number): THREE.Vector3[] => {
    if (points.length === 0) return [];
    const box = new THREE.Box3().setFromPoints(points);
    const maxDim = Math.max(...box.getSize(new THREE.Vector3()).toArray()) || 1;
    const centre = box.getCenter(new THREE.Vector3());
    return points.map(p => p.clone().sub(centre).multiplyScalar(size / maxDim));
  }

  // const torusKnot = (n: number): THREE.Vector3[] => {
  //   const geometry = new THREE.TorusKnotGeometry(10, 3, 200, 16, 2, 3);
  //   const points: THREE.Vector3[] = [];
  //   const positionAttribute = geometry.attributes.position;
  //   for (let i = 0; i < positionAttribute.count; i++) {
  //     points.push(new THREE.Vector3().fromBufferAttribute(positionAttribute, i));
  //   }
  //   const result: THREE.Vector3[] = [];
  //   for (let i = 0; i < n; i++) {
  //     result.push(points[i % points.length].clone());
  //   }
  //   return normalise(result, 50);
  // }

  // const halvorsen = (n: number): THREE.Vector3[] => {
  //   const pts: THREE.Vector3[] = [];
  //   let x = 0.1, y = 0, z = 0;
  //   const a = 1.89;
  //   const dt = 0.005;
  //   for (let i = 0; i < n * 25; i++) {
  //     const dx = -a * x - 4 * y - 4 * z - y * y;
  //     const dy = -a * y - 4 * z - 4 * x - z * z;
  //     const dz = -a * z - 4 * x - 4 * y - x * x;
  //     x += dx * dt;
  //     y += dy * dt;
  //     z += dz * dt;
  //     if (i > 200 && i % 25 === 0) {
  //       pts.push(new THREE.Vector3(x, y, z));
  //     }
  //     if (pts.length >= n) break;
  //   }
  //   while(pts.length < n) pts.push(pts[Math.floor(Math.random()*pts.length)].clone());
  //   return normalise(pts, 60);
  // }


  // const dualHelix = (n: number): THREE.Vector3[] => {
  //   const pts: THREE.Vector3[] = [];
  //   const turns = 5;
  //   const radius = 15;
  //   const height = 40;
  //   for (let i = 0; i < n; i++) {
  //     const isSecondHelix = i % 2 === 0;
  //     const angle = (i / n) * Math.PI * 2 * turns;
  //     const y = (i / n) * height - height / 2;
  //     const r = radius + (isSecondHelix ? 5 : -5);
  //     const x = Math.cos(angle) * r;
  //     const z = Math.sin(angle) * r;
  //     pts.push(new THREE.Vector3(x, y, z));
  //   }
  //   return normalise(pts, 60);
  // }

  // const deJong = (n: number): THREE.Vector3[] => {
  //   const pts: THREE.Vector3[] = [];
  //   let x = 0.1, y = 0.1;
  //   const a = 1.4, b = -2.3, c = 2.4, d = -2.1;
  //   for (let i = 0; i < n; i++) {
  //     const xn = Math.sin(a * y) - Math.cos(b * x);
  //     const yn = Math.sin(c * x) - Math.cos(d * y);
  //     x = xn;
  //     y = yn;
  //     const z = Math.sin(x * y * 0.5);
  //     pts.push(new THREE.Vector3(x, y, z));
  //   }
  //   return normalise(pts, 55);
  // }



  // Lorenz + sinusoidal forcing (네가 올린 수식) → 하나의 패턴 함수
  // x' = σ(-x + y) + κ sin(y/5) sin(z/5)
  // y' = - x z + ρ x - y + κ sin(x/5) sin(z/5)
  // z' = x y - β z + κ cos(y/5) cos(x/5)
  const lorenzSinForcing = (n: number): THREE.Vector3[] => {
    const pts: THREE.Vector3[] = [];
    // 초기값은 보기 좋게 약간 치우치게
    let x = -0.5, y = 0.1, z = 0.6;

    // 파라미터(원하면 조절 가능)
    const sigma = 1;     // σ
    const rho   = 30;     // ρ
    const beta  = 8/3;    // β
    const kappa = 200;    // κ : 외력 세기

    // 적분/샘플 파라미터 - 더 긴 시간 동안 계산하여 더 넓은 궤도 탐색
    const dt = 0.01;     // 스텝
    const every = 1;    // 매 스텝마다 샘플링
    const warmup = 100;  // 워밍업 더 감소
    const totalTime = n * every * 30 + warmup * every; // 20배 더 긴 시간 계산

    for (let i = 0; i < totalTime; i++) {
      const dx = sigma * (-x + y) + kappa * Math.sin(y / 5) * Math.sin(z / 5);
      const dy = -x * z + rho * x - y + kappa * Math.sin(x / 5) * Math.sin(z / 5);
      const dz = x * y - beta * z + kappa * Math.cos(y / 5) * Math.cos(x / 5);

      x += dx * dt;
      y += dy * dt;
      z += dz * dt;

      // warmup 이후부터 매 every번째마다 샘플 저장
      if (i > warmup * every && i % every === 0) {
        pts.push(new THREE.Vector3(x, y, z));
        if (pts.length >= n) break;
      }
    }

    // 부족하면 복제해서 채우기(네 다른 패턴과 동일한 처리)
    while (pts.length < n) pts.push(pts[(Math.random() * pts.length) | 0].clone());
    return normalise(pts, 100); // 더 넓은 범위
  };



  //const PATTERNS = [torusKnot, halvorsen, dualHelix, deJong, lorenzSinForcing];
  const PATTERNS = [lorenzSinForcing];

  // 감정 데이터 가져오기 함수
  const fetchEmotions = useCallback(async () => {
    try {
      const response = await fetch('/api/emotions');
      if (response.ok) {
        const data = await response.json();
        console.log('감정 데이터 로드됨:', data);
        
        // 감정 데이터와 sentiment 데이터를 모두 처리
        const processedData: { [key: string]: number } = {};
        
        // 기존 감정 데이터 처리
        if (data.emotions) {
          Object.assign(processedData, data.emotions);
        }
        
        // sentiment 데이터 처리 (positive/negative 분류)
        if (data.sentiments) {
          Object.assign(processedData, data.sentiments);
        }
        
        // 만약 다른 형태의 데이터 구조라면 여기서 처리
        if (data.sentiment_analysis) {
          Object.assign(processedData, data.sentiment_analysis);
        }
        
        console.log('처리된 감정 데이터:', processedData);
        setEmotionData(processedData);
      }
    } catch (error) {
      console.error('감정 데이터 가져오기 실패:', error);
    }
  }, []);

  // 초기 로드 및 10초마다 자동 업데이트
  useEffect(() => {
    // 초기 로드
    fetchEmotions();
    
    // 10초마다 업데이트
    const interval = setInterval(fetchEmotions, 10000);
    
    // 클린업
    return () => clearInterval(interval);
  }, [fetchEmotions]);

  // 감정 데이터가 로드되면 파티클에 색상 적용
  useEffect(() => {
    if (particlesRef.current && Object.keys(emotionData).length > 0) {
      console.log('파티클에 색상 적용 중...', emotionData);
      applyEmotionColors(particlesRef.current, emotionData);
    }
  }, [emotionData, getEmotionColor]);


  const createStars = (): THREE.Points => {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(STAR_COUNT * 3);
    const col = new Float32Array(STAR_COUNT * 3);
    const size = new Float32Array(STAR_COUNT);
    const rnd = new Float32Array(STAR_COUNT);
    const R = 900;
    
    for (let i = 0; i < STAR_COUNT; i++) {
      const i3 = i * 3;
      const θ = Math.random() * 2 * Math.PI;
      const φ = Math.acos(2 * Math.random() - 1);
      const r = R * Math.cbrt(Math.random());
      
      pos[i3] = r * Math.sin(φ) * Math.cos(θ);
      pos[i3 + 1] = r * Math.sin(φ) * Math.sin(θ);
      pos[i3 + 2] = r * Math.cos(φ);
      
      const c = new THREE.Color().setHSL(Math.random() * 0.6, 0.3 + 0.3 * Math.random(), 0.55 + 0.35 * Math.random());
      col[i3] = c.r;
      col[i3 + 1] = c.g;
      col[i3 + 2] = c.b;
      
      size[i] = 0.25 + Math.pow(Math.random(), 4) * 2.1;
      rnd[i] = Math.random() * Math.PI * 2;
    }
    
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    geo.setAttribute("size", new THREE.BufferAttribute(size, 1));
    geo.setAttribute("random", new THREE.BufferAttribute(rnd, 1));
    
    const mat = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 } },
      vertexShader: `
        attribute float size;
        attribute float random;
        varying vec3 vColor;
        varying float vRnd;
        void main(){
          vColor=color;
          vRnd=random;
          vec4 mv=modelViewMatrix*vec4(position,1.);
          gl_PointSize=size*(250./-mv.z);
          gl_Position=projectionMatrix*mv;
        }`,
      fragmentShader: `
        uniform float time;
        varying vec3 vColor;
        varying float vRnd;
        void main(){
          vec2 uv=gl_PointCoord-.5;
          float d=length(uv);
          float a=1.-smoothstep(.4,.5,d);
          a*=.7+.3*sin(time*(.6+vRnd*.3)+vRnd*5.);
          if(a<.02)discard;
          gl_FragColor=vec4(vColor,a);
        }`,
      transparent: true,
      depthWrite: false,
      vertexColors: true,
      blending: THREE.AdditiveBlending
    });
    
    return new THREE.Points(geo, mat);
  }

  const makeParticles = (count: number): THREE.Points => {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const size = new Float32Array(count);
    const rnd = new Float32Array(count * 3);
    
    // 모든 파티클을 기본 흰색으로 초기화하고 size, random 속성 설정
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      col[i3] = 1.0;     // r
      col[i3 + 1] = 1.0; // g
      col[i3 + 2] = 1.0; // b
      
      size[i] = 0.7 + Math.random() * 1.1;
      rnd[i3] = Math.random() * 10;
      rnd[i3 + 1] = Math.random() * Math.PI * 2;
      rnd[i3 + 2] = 0.5 + 0.5 * Math.random();
    }
    
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    geo.setAttribute("size", new THREE.BufferAttribute(size, 1));
    geo.setAttribute("random", new THREE.BufferAttribute(rnd, 3));
    
    const mat = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 } },
      vertexShader: `
        uniform float time;
        attribute float size;
        attribute vec3 random;
        varying vec3 vCol;
        varying float vR;
        void main(){
          vCol=color;
          vR=random.z;
          vec3 p=position;
          float t=time*.25*random.z;
          float ax=t+random.y, ay=t*.75+random.x;
          float amp=(.6+sin(random.x+t*.6)*.3)*random.z;
          p.x+=sin(ax+p.y*.06+random.x*.1)*amp;
          p.y+=cos(ay+p.z*.06+random.y*.1)*amp;
          p.z+=sin(ax*.85+p.x*.06+random.z*.1)*amp;
          vec4 mv=modelViewMatrix*vec4(p,1.);
          float pulse=.9+.1*sin(time*1.15+random.y);
          gl_PointSize=size*pulse*(350./-mv.z);
          gl_Position=projectionMatrix*mv;
        }`,
      fragmentShader: `
        uniform float time;
        varying vec3 vCol;
        varying float vR;

        void main() {
          vec2 uv = gl_PointCoord - 0.5;
          float d = length(uv);
          
          float core = smoothstep(0.05, 0.0, d);
          float angle = atan(uv.y, uv.x);
          float flare = pow(max(0.0, sin(angle * 6.0 + time * 2.0 * vR)), 4.0);
          flare *= smoothstep(0.5, 0.0, d);
          float glow = smoothstep(0.4, 0.1, d);
          
          float alpha = core * 1.0 + flare * 0.5 + glow * 0.2;
          
          // 색상 변경 없이 원래 색상 사용
          vec3 color = vCol;
          vec3 finalColor = mix(color, vec3(1.0, 0.95, 0.9), core);
          finalColor = mix(finalColor, color, flare * 0.5 + glow * 0.5);

          if (alpha < 0.01) discard;
          
          gl_FragColor = vec4(finalColor, alpha);
        }`,
      transparent: true,
      depthWrite: false,
      vertexColors: true,
      blending: THREE.AdditiveBlending
    });
    
    return new THREE.Points(geo, mat);
  }

  // shape 파티클에 감정 색상 적용하는 함수
  const applyEmotionColors = (particles: THREE.Points, emotionData: { [key: string]: number }) => {
    if (!particles || !particles.geometry) return;
    
    const colorAttribute = particles.geometry.attributes.color as THREE.BufferAttribute;
    const colors = colorAttribute.array as Float32Array;
    const particleCount = colors.length / 3;
    
    console.log('파티클 개수:', particleCount, '감정 데이터:', emotionData);
    
    // 이미 색상이 적용된 파티클은 유지하고, 새로운 파티클만 흰색으로 설정
    // 초기에만 모든 파티클을 흰색으로 설정
    if (!particles.userData.colorsInitialized) {
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        colors[i3] = 1.0;     // r
        colors[i3 + 1] = 1.0; // g
        colors[i3 + 2] = 1.0; // b
      }
      particles.userData.colorsInitialized = true;
    }
    
    // 테스트: 처음 100개 파티클을 빨간색으로 설정
    for (let i = 0; i < Math.min(100, particleCount); i++) {
      const i3 = i * 3;
      colors[i3] = 1.0;     // r
      colors[i3 + 1] = 0.0; // g
      colors[i3 + 2] = 0.0; // b
    }
    
    // 이미 적용된 감정 파티클 추적
    if (!particles.userData.appliedEmotions) {
      particles.userData.appliedEmotions = new Set();
    }
    
    // 새로운 감정 데이터만 처리
    const emotionEntries = Object.entries(emotionData);
    const sizeAttribute = particles.geometry.attributes.size as THREE.BufferAttribute;
    const sizes = sizeAttribute.array as Float32Array;
    
    // 현재까지 적용된 총 감정 수 계산
    const totalEmotionsInData = emotionEntries.reduce((sum, [, count]) => sum + count, 0);
    const currentAppliedCount = particles.userData.appliedEmotions.size;
    
    // 새로운 감정이 있는 경우에만 처리
    if (totalEmotionsInData > currentAppliedCount) {
      const newEmotionsToAdd = totalEmotionsInData - currentAppliedCount;
      let added = 0;
      
      emotionEntries.forEach(([emotion, emotionCount]) => {
        for (let j = 0; j < emotionCount && added < newEmotionsToAdd; j++) {
          // 아직 사용되지 않은 파티클 인덱스 찾기
          let randomIndex;
          let attempts = 0;
          do {
            randomIndex = Math.floor(Math.random() * (particleCount - 100)) + 100;
            attempts++;
          } while (particles.userData.appliedEmotions.has(randomIndex) && attempts < 100);
          
          if (attempts >= 100) break;
          
          particles.userData.appliedEmotions.add(randomIndex);
          
          // 감정 색상 적용
          const i3 = randomIndex * 3;
          const emotionColorSet = getEmotionColor(emotion);
          const colorHex = emotionColorSet[Math.floor(Math.random() * emotionColorSet.length)];
          const c = new THREE.Color(colorHex);
          
          colors[i3] = c.r;
          colors[i3 + 1] = c.g;
          colors[i3 + 2] = c.b;
          
          // 감정 파티클의 크기를 3.0으로 고정
          sizes[randomIndex] = 10.0;
          
          added++;
        }
      });
      
      // 속성 업데이트
      sizeAttribute.needsUpdate = true;
    }
    
    console.log('색상 적용된 파티클 수:', particles.userData.appliedEmotions.size + 100);
    colorAttribute.needsUpdate = true;
  }

  const createSparkles = (count: number): THREE.Points => {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const size = new Float32Array(count);
    const rnd = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      size[i] = 0.5 + Math.random() * 0.8;
      rnd[i * 3] = Math.random() * 10;
      rnd[i * 3 + 1] = Math.random() * Math.PI * 2;
      rnd[i * 3 + 2] = 0.5 + 0.5 * Math.random();
    }
    
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(size, 1));
    geo.setAttribute('random', new THREE.BufferAttribute(rnd, 3));

    const mat = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 } },
      vertexShader: `
        uniform float time;
        attribute float size;
        attribute vec3 random;
        void main() {
          vec3 p = position;
          float t = time * 0.25 * random.z;
          float ax = t + random.y, ay = t * 0.75 + random.x;
          float amp = (0.6 + sin(random.x + t * 0.6) * 0.3) * random.z;
          p.x += sin(ax + p.y * 0.06 + random.x * 0.1) * amp;
          p.y += cos(ay + p.z * 0.06 + random.y * 0.1) * amp;
          p.z += sin(ax * 0.85 + p.x * 0.06 + random.z * 0.1) * amp;
          vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }`,
      fragmentShader: `
        uniform float time;
        void main() {
          float d = length(gl_PointCoord - vec2(0.5));
          float alpha = 1.0 - smoothstep(0.4, 0.5, d);
          if (alpha < 0.01) discard;
          gl_FragColor = vec4(1.0, 1.0, 1.0, alpha);
        }`,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    return new THREE.Points(geo, mat);
  }

  const applyPattern = (i: number) => {
    if (!particlesRef.current || !sparklesRef.current) return;
    
    const pts = PATTERNS[i](PARTICLE_COUNT);
    const particleArr = particlesRef.current.geometry.attributes.position.array as Float32Array;
    const sparkleArr = sparklesRef.current.geometry.attributes.position.array as Float32Array;
    
    for (let j = 0; j < PARTICLE_COUNT; j++) {
      const idx = j * 3;
      const p = pts[j] || new THREE.Vector3();
      particleArr[idx] = p.x;
      particleArr[idx + 1] = p.y;
      particleArr[idx + 2] = p.z;
      if (j < SPARK_COUNT) {
        sparkleArr[idx] = p.x;
        sparkleArr[idx + 1] = p.y;
        sparkleArr[idx + 2] = p.z;
      }
    }
    
    particlesRef.current.geometry.attributes.position.needsUpdate = true;
    sparklesRef.current.geometry.attributes.position.needsUpdate = true;
  }

  const beginMorph = () => {
    if (!particlesRef.current || !sparklesRef.current) return;
    
    isTransRef.current = true;
    progRef.current = 0;
    const next = (currentPatternRef.current + 1) % PATTERNS.length;
    const fromPts = (particlesRef.current.geometry.attributes.position.array as Float32Array).slice();
    const toPts = PATTERNS[next](PARTICLE_COUNT);
    
    const to = new Float32Array(PARTICLE_COUNT * 3);
    if (toPts.length > 0) {
      for (let j = 0; j < PARTICLE_COUNT; j++) {
        const idx = j * 3;
        const p = toPts[j];
        to[idx] = p.x;
        to[idx + 1] = p.y;
        to[idx + 2] = p.z;
      }
      particlesRef.current.userData = { from: fromPts, to, next };
      sparklesRef.current.userData = { from: fromPts, to, next };
    }
  }


  const animate = () => {
    requestAnimationFrame(animate);
    clockRef.current.getDelta();
    const t = clockRef.current.getElapsedTime();

    if (controlsRef.current) controlsRef.current.update();

    if (particlesRef.current) (particlesRef.current.material as THREE.ShaderMaterial).uniforms.time.value = t;
    if (sparklesRef.current) (sparklesRef.current.material as THREE.ShaderMaterial).uniforms.time.value = t;
    if (starsRef.current) (starsRef.current.material as THREE.ShaderMaterial).uniforms.time.value = t;

    if (isTransRef.current && particlesRef.current && sparklesRef.current) {
      progRef.current += morphSpeed;
      const eased = progRef.current >= 1 ? 1 : 1 - Math.pow(1 - progRef.current, 3);
      const { from, to } = particlesRef.current.userData;
      if (to) {
        const particleArr = particlesRef.current.geometry.attributes.position.array as Float32Array;
        const sparkleArr = sparklesRef.current.geometry.attributes.position.array as Float32Array;
        for (let i = 0; i < particleArr.length; i++) {
          const val = from[i] + (to[i] - from[i]) * eased;
          particleArr[i] = val;
          if (i < sparkleArr.length) {
            sparkleArr[i] = val;
          }
        }
        particlesRef.current.geometry.attributes.position.needsUpdate = true;
        sparklesRef.current.geometry.attributes.position.needsUpdate = true;
      }
      if (progRef.current >= 1) {
        currentPatternRef.current = particlesRef.current.userData.next;
        isTransRef.current = false;
      }
    }

    if (composerRef.current) composerRef.current.render();
  }

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    sceneRef.current = new THREE.Scene();
    sceneRef.current.fog = new THREE.FogExp2(0x050203, 0.012);

    // Camera setup
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2500);
    camera.position.set(0, 0, 80);

    // Renderer setup
    rendererRef.current = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    rendererRef.current.setPixelRatio(window.devicePixelRatio);
    rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    containerRef.current.appendChild(rendererRef.current.domElement);

    // Controls setup
    controlsRef.current = new OrbitControls(camera, rendererRef.current.domElement);
    controlsRef.current.enableDamping = true;
    controlsRef.current.dampingFactor = 0.05;
    controlsRef.current.screenSpacePanning = false;
    controlsRef.current.minDistance = 20;
    controlsRef.current.maxDistance = 200;
    controlsRef.current.target.set(0, 0, 0);
    controlsRef.current.autoRotate = true;
    controlsRef.current.autoRotateSpeed = 0.5;

    // Create objects
    starsRef.current = createStars();
    sceneRef.current.add(starsRef.current);

    // shape 파티클 시스템 생성
    particlesRef.current = makeParticles(PARTICLE_COUNT);
    sparklesRef.current = createSparkles(SPARK_COUNT);
    sceneRef.current.add(particlesRef.current);
    sceneRef.current.add(sparklesRef.current);

    // Post-processing setup
    composerRef.current = new EffectComposer(rendererRef.current);
    composerRef.current.addPass(new RenderPass(sceneRef.current, camera));
    composerRef.current.addPass(new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.45, 0.5, 0.85));
    const after = new AfterimagePass();
    after.uniforms.damp.value = 0.92;
    composerRef.current.addPass(after);
    composerRef.current.addPass(new OutputPass());

    applyPattern(currentPatternRef.current);

    // Resize handler
    const handleResize = () => {
      if (!rendererRef.current || !composerRef.current) return;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
      composerRef.current.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    // Start animation
    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (containerRef.current && rendererRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, []);

  const handleMorphClick = () => {
    if (!isTransRef.current) {
      beginMorph();
    }
  };

  return (
    <>
      <style jsx>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: "Inter", sans-serif;
          overflow: hidden;
          background: #040307; 
          background-image:
            radial-gradient(circle at 50% 35%, #1d1431 0%, transparent 65%),
            linear-gradient(180deg, #000000 0%, #070012 100%);
          color: #eee;
        }
        
        .container {
          position: fixed;
          inset: 0;
        }
        
        .vignette {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 9;
          background: radial-gradient(circle at center, rgba(0,0,0,0) 65%, rgba(0,0,0,.5) 100%);
        }
        
        canvas {
          display: block;
          width: 100%;
          height: 100%;
        }

        .instructions {
          position: fixed;
          left: 24px;
          bottom: 24px;
          transform: none;
          padding: 10px 20px;
          font-size: 12px;
          text-align: left;
          pointer-events: none;
          color: #d0b0ff;
          background: rgba(18, 15, 40, 0.25);
          border: 1px solid rgba(122, 70, 255, 0.28);
          border-radius: 12px;
          backdrop-filter: blur(12px);
          z-index: 10;
          box-shadow: 0 4px 20px rgba(0,0,0,.45);
        }

        .morphButton {
          position: fixed;
          left: 50%;
          bottom: 24px;
          transform: translateX(-50%);
          padding: 12px 30px;
          font-size: 14px;
          font-weight: 500;
          color: rgba(230, 220, 255, 0.9);
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 50px;
          backdrop-filter: blur(10px) saturate(180%);
          -webkit-backdrop-filter: blur(10px) saturate(180%);
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
          cursor: pointer;
          z-index: 10;
          transition: all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          text-shadow: 0 1px 2px rgba(0,0,0,0.2);
        }

        .morphButton:hover {
          background: rgba(255, 255, 255, 0.15);
          transform: translateX(-50%) scale(1.05);
          box-shadow: 0 12px 40px 0 rgba(0, 0, 0, 0.45);
          color: white;
        }

        .morphButton:active {
          transform: translateX(-50%) scale(0.98);
        }
      `}</style>
      
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500&display=swap" rel="stylesheet" />
      
      <div className="container" ref={containerRef}></div>
      <div className="vignette"></div>
      <div className="instructions">
        <div className="mb-3 text-white text-xs">
          <div className="mb-4 pb-4">자유롭게 움직여보세요</div>
          <div className="text-[18px] opacity-80">            
            <div className="text-[14px] opacity-70">
              <div className="mb-0.5">🟢 긍정적 감정</div>
              <div className="mb-0.5">🔴 부정적 감정</div>
              <div>🔵 중립적 감정</div>
            </div>
          </div>
        </div>
      </div>
      {/* <button className="morphButton" onClick={handleMorphClick}>
        Morph Shape
      </button> */}
    </>
  )
}
