

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "@/components/pixel.module.css";
import Image from "next/image";

// A polished, high-performance snowfall animation page for Next.js (App Router)
// Inspired by alphardex's CodePen, implemented with canvas & requestAnimationFrame.
// Drop this file at: app/snow/page.tsx

export default function SnowPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const [selectedEmotion, setSelectedEmotion] = useState<string>('');

  // Controls - 모바일 최적화를 위해 고정값 사용
  const intensity = 1; // 모바일에서 성능을 위해 낮춤
  const wind = 0; // 바람 효과 비활성화
  const paused = false;

  const prefersReduced = useMemo(() =>
    typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  []);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 모바일 감지를 먼저 수행
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
    
    // 모바일에서 픽셀 비율 제한으로 성능 향상
    let dpr = isMobile ? 1 : Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    let width = 0;
    let height = 0;

    type Flake = {
      x: number;
      y: number;
      r: number; // radius (now used for font size)
      vy: number; // vertical speed
      vx: number; // base horizontal speed
      wobble: number; // phase for lateral sway
      wobbleSpeed: number; // sway speed
      opacity: number;
      word: string; // the falling word
    };

    const flakes: Flake[] = [];

    // Density of flakes per pixel^2 at base intensity 1. Tweaked for mobile perf.
    const BASE_DENSITY = isMobile ? 0.00008 : 0.00012; // 모바일에서 밀도 낮춤
    
    // 클릭 이벤트 핸들러
    const handleCanvasClick = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = (event.clientX - rect.left) * dpr;
      const clickY = (event.clientY - rect.top) * dpr;
      
      // 클릭한 위치와 가장 가까운 단어 찾기
      let closestFlake: Flake | null = null;
      let minDistance = Infinity;
      
      for (const flake of flakes) {
        const distance = Math.sqrt(
          Math.pow(clickX - flake.x * dpr, 2) + 
          Math.pow(clickY - flake.y * dpr, 2)
        );
        
        // 텍스트 영역 내에서 클릭했는지 확인 (대략적인 계산)
        const textRadius = flake.r * flake.word.length * 0.3;
        
        if (distance < textRadius && distance < minDistance) {
          minDistance = distance;
          closestFlake = flake;
        }
      }
      
      if (closestFlake) {
        handleEmotionSelect(closestFlake.word);
      }
    };
    
    // 감정 선택 처리
    const handleEmotionSelect = async (emotion: string) => {
      setSelectedEmotion(emotion);
      
      // localStorage에서 답변 데이터 가져오기
      const tempAnswerData = localStorage.getItem('temp_answer_data');
      if (tempAnswerData) {
        const answerData = JSON.parse(tempAnswerData);
        
        // API 호출하여 답변과 감정 저장
        try {
          const response = await fetch('/api/answer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...answerData,
              emotion: emotion
            }),
          });
          
          if (response.ok) {
            // 임시 데이터 삭제
            localStorage.removeItem('temp_answer_data');
            console.log('답변과 감정이 저장되었습니다:', emotion);
          } else {
            console.error('저장 실패');
          }
        } catch (error) {
          console.error('API 호출 실패:', error);
        }
      }

      // 2초 기다린 후 다음 페이지로 이동
      setTimeout(() => {
        window.location.href = '/list';
      }, 2000);
    };

    const rand = (min: number, max: number) => Math.random() * (max - min) + min;
    
    // 떨어질 단어들

    const words = [
      '기쁨',
      '사랑',
      '괴로움',
      '미움',
      '슬픔',
      '놀라움',
      '두려움',
      '화',
      '부끄러움',
      '바람',
      '감격',
      'Cute',
      '걱정',
      '가련',
      '끔찍해',
      '골남',
      '쑥스럼',
      '부럽다',
      'So So',
      '감동',
      '사랑해',
      '미안',
      '글썽',
      '두근',
      '괘씸',
      '창피',
      'Want',
      '메롱',
      '감탄',
      '예쁘다',
      '죄송',
      '구슬픔',
      '놀람',
      '긴장',
      '뜨끔뜨끔',
      '욕심',
      '어쩔티비',
      '좋다',
      '힘들어',
      '낙심',
      '몸서리',
      '부릅',
      '붉히다',
      '탐나',
      '바보',
      '든든',
      '갑갑',
      '못마땅',
      '동정',
      '어리둥절',
      '발끈',
      '수줍음',
      '염원',
      '애증',
      '들뜸',
      '반함',
      '거북해',
      '비웃음',
      '삐쭉',
      '어이없음',
      '덜덜',
      '분풀이',
      '희망',
      '좋겠네',
      '만족',
      '애정',
      '언짢음',
      '서러움',
      '울렁울렁',
      '불안',
      '썽남',
      '반가움',
      '귀찮아',
      '얄미움',
      '섭섭',
      '신기함',
      '소름',
      '씩씩',
      '소망',
      '뭐래',
      '뿌듯',
      'Lovely',
      '난처',
      '원망',
      '서운',
      '아찔',
      '투덜',
      '기대',
      '풉',
      '싱글벙글',
      '친밀감',
      '답답',
      '지긋지긋',
      '속상',
      '안절부절',
      '짜증',
      '미소',
      '황홀',
      '당황',
      '질림',
      '쓸쓸',
      '으스스',
      '퉁명',
      '갈망',
      '유쾌',
      '설렘',
      '번거로워',
      '아쉬움',
      '칭얼',
      '열망',
      '자랑',
      '떨림',
      '송구스럽',
      '거슬림',
      '안타까움',
      '초조',
      '흥분',
      '갈구',
      '재미',
      '지겨워',
      '꺼리다',
      '엉엉',
      '흥미',
      '고통',
      '꺼림칙',
      '우울',
      '흐뭇',
      '진저리',
      '외롭',
      '웃음',
      '몸부림',
      '토라짐',
      '처량',
      '불편',
      '빈정',
      '울적',
      '실망',
      '시무룩',
      '한숨',
      '업신여김',
      '삐죽'
    ];
    const getRandomWord = () => words[Math.floor(Math.random() * words.length)];

    function setCanvasSize() {
      const parent = canvas.parentElement || document.body;
      const rect = parent.getBoundingClientRect();
      width = Math.max(1, Math.floor(rect.width));
      height = Math.max(1, Math.floor(rect.height));
      dpr = isMobile ? 1 : Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function spawnFlake(spawnY = rand(-height, 0)) {
      // 모바일과 데스크톱에 따른 폰트 크기 조정
      const baseFontSize = isMobile ? [12, 20] : [16, 32];
      const fontSize = rand(baseFontSize[0], baseFontSize[1]);
      const speedY = rand(0.4, 1.1) * (0.8 + fontSize * 0.01);
      const op = rand(0.5, 1.0);
      const wob = rand(0, Math.PI * 2);
      const wobS = rand(0.003, 0.018);
      const baseVX = rand(-0.3, 0.3);
      return {
        x: rand(0, width),
        y: spawnY,
        r: fontSize,
        vy: speedY,
        vx: baseVX,
        wobble: wob,
        wobbleSpeed: wobS,
        opacity: op,
        word: getRandomWord(),
      } as Flake;
    }

    function repopulate() {
      const targetCount = Math.max(10, Math.floor(width * height * BASE_DENSITY * intensity));
      if (flakes.length > targetCount) {
        flakes.splice(targetCount);
      } else {
        while (flakes.length < targetCount) {
          flakes.push(spawnFlake(rand(-height, height)));
        }
      }
    }

    function drawFlake(f: Flake) {
      // 단어 텍스트 그리기
      if (!ctx) return;
      
      ctx.save();
      ctx.font = `${f.r}px "Pixel", monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // 텍스트에 그라디언트 효과 적용
      const gradient = ctx.createLinearGradient(f.x - f.r/2, f.y - f.r/2, f.x + f.r/2, f.y + f.r/2);
      gradient.addColorStop(0, `rgba(255, 255, 255, ${f.opacity})`);
      gradient.addColorStop(0.5, `rgba(200, 220, 255, ${f.opacity * 0.8})`);
      gradient.addColorStop(1, `rgba(150, 200, 255, ${f.opacity * 0.6})`);
      
      ctx.fillStyle = gradient;
      ctx.fillText(f.word, f.x, f.y);
      
      // 텍스트 그림자 효과
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      
      ctx.restore();
    }

    function tick() {
      if (paused || prefersReduced) return;
      rafRef.current = requestAnimationFrame(tick);

      ctx?.clearRect(0, 0, width, height);

      const windForce = wind * 0.6; // convert [-1,1] to drift speed
      
      // 모바일에서도 부드러운 애니메이션을 위해 프레임 제한 제거

      for (let i = 0; i < flakes.length; i++) {
        const f = flakes[i];
        // Update
        f.wobble += f.wobbleSpeed;
        f.x += f.vx + Math.cos(f.wobble) * 0.35 + windForce;
        f.y += f.vy;

        // Wrap/respawn (텍스트는 더 넓은 범위에서 wrap)
        if (f.y - f.r > height) {
          flakes[i] = spawnFlake(rand(-40, -5));
          continue;
        }
        const textWidth = f.r * f.word.length * 0.6; // 대략적인 텍스트 너비
        if (f.x + textWidth < 0) f.x = width + textWidth;
        else if (f.x - textWidth > width) f.x = -textWidth;

        // Draw
        drawFlake(f);
      }
    }

    function handleResize() {
      setCanvasSize();
      repopulate();
    }

    // Init
    setCanvasSize();
    repopulate();

    // Observe parent size for responsive canvas
    resizeObserverRef.current = new ResizeObserver(() => {
      handleResize();
    });
    const parent = canvas.parentElement || document.body;
    resizeObserverRef.current.observe(parent);

    // 클릭 이벤트 리스너 추가
    canvas.addEventListener('click', handleCanvasClick);

    // Animation start
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (resizeObserverRef.current) resizeObserverRef.current.disconnect();
      canvas.removeEventListener('click', handleCanvasClick);
    };
  }, [intensity, wind, paused, prefersReduced, selectedEmotion]);

  return (
    <main
      className="relative min-h-[100dvh] overflow-hidden bg-[#000A14]"
    >
      {/* Content Layer */}
      {/* <section className="relative z-10 flex h-[100dvh] flex-col items-center justify-center gap-6 px-6 text-center">
        <h1 className="text-4xl md:text-6xl font-semibold tracking-tight text-white/95 drop-shadow-sm">
          감정의 밤 ✨
        </h1>
        <div className="mt-2 flex flex-col sm:flex-row items-center gap-4 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10 backdrop-blur">
          <label className="flex items-center gap-3 text-white/80">
            <span className="text-sm w-16 text-left">밀도</span>
            <input
              className="accent-white/80"
              type="range"
              min={0.25}
              max={3}
              step={0.05}
              value={intensity}
              onChange={(e) => setIntensity(parseFloat(e.target.value))}
              aria-label="Snow intensity"
            />
            <span className="tabular-nums text-white/60 text-sm w-10 text-right">{intensity.toFixed(2)}x</span>
          </label>
          <label className="flex items-center gap-3 text-white/80">
            <span className="text-sm w-16 text-left">바람</span>
            <input
              className="accent-white/80"
              type="range"
              min={-1}
              max={1}
              step={0.01}
              value={wind}
              onChange={(e) => setWind(parseFloat(e.target.value))}
              aria-label="Wind"
            />
            <span className="tabular-nums text-white/60 text-sm w-10 text-right">{wind.toFixed(2)}</span>
          </label>
          <button
            onClick={() => setPaused((p) => !p)}
            className="rounded-xl bg-white/10 px-4 py-2 text-white/90 ring-1 ring-white/15 hover:bg-white/15"
          >
            {paused ? "재생" : "일시정지"}
          </button>
        </div>
        {prefersReduced && (
          <p className="text-xs text-white/60">
            시스템의 &quot;모션 줄이기&quot; 설정이 켜져 있어 애니메이션을 자동으로 일시정지했습니다.
          </p>
        )}
      </section> */}
      <div className={`${styles.container}`}>

        <div className={`${styles.pixel2} text-black`}>
          잠깐, 감정 하나만 건네주실래요?
          <br />
          말로 하기 어려운 마음도 괜찮아요.
        </div>
      </div>

      {/* Snow Layer - 클릭 가능하도록 수정 */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-0 cursor-pointer"
        aria-hidden
        style={{ 
          WebkitUserSelect: 'none',
          WebkitTouchCallout: 'none',
          WebkitTapHighlightColor: 'transparent'
        }}
      />
      
      {/* space.gif - 감정 선택 전에만 보이기 */}
      {!selectedEmotion && (
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-10">
          <Image src="/space.gif" alt="space" className="md:w-48 md:h-48 w-32 h-32" width={640} height={640} />
        </div>
      )}
      
      {/* 선택된 감정 표시 */}
      {selectedEmotion && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 border border-gray-800 rounded-lg p-4 bg-black/80">
          <div className="bg-black/80 text-white px-8 py-4 rounded-lg text-xl text-center">
            <p className="mb-4">선택한 감정:</p>
            <p className="text-xl font-bold">{selectedEmotion}</p>
            <p className="mt-4 text-xs text-gray-300 whitespace-nowrap">
              당신의 감정은 이곳에 잠시 머물다 자연스레 흘러갑니다. <br/>
              우리는 그 이야기를 붙잡지 않아요. <br/>
              당신은 그저 바라보고 보내주면 됩니다.
            </p>
          </div>
        </div>
      )}
    </main>
  );
}