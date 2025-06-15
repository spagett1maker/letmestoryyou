et syllable_1_1;
let syllable_2_6 = false;
let syllable_3_5 = [];
let syllable_1_5;
let syllable_2_5;
let syllable_1_4;

window.hasLoadedSketch = true;

function preload() {
  // ✅ 로컬 sound.mp3 파일 사용
  syllable_1_1 = loadSound("/sing.mp3");
  window.soundOut = syllable_1_1;
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1); // 모바일 고해상도 대응
  angleMode(DEGREES);
  syllable_1_1.amp(0.6);
  syllable_1_4 = new p5.FFT();
  syllable_1_5 = syllable_1_4.analyze();
  for (let i = 0; i < syllable_1_5.length; i++) {
    syllable_3_5[i] = {
      x: map(i, 0, syllable_1_5.length, 0, width / 2 - 20),
      theta: random(0, 360)
    };
  }
  window.soundOut = {
    stop: () => {
      syllable_1_1.stop();
      syllable_2_6 = false;
    }
  };
}

function draw() {
  translate(width / 2, height / 2);
  checkPlay();
  background(18, 18, 18, 10);
  soundProcess();
}

function soundProcess() {
  syllable_1_5 = syllable_1_4.analyze();
  syllable_2_5 = syllable_1_4.waveform();
  for (let i = 0; i < syllable_1_5.length; i += 10) {
    syllable_3_5[i].theta =
      syllable_3_5[i].theta - syllable_1_5[i] / 50 - syllable_2_5[i] * 100;
    for (let j = 0; j < 10; j++) {
      stroke(
        100 + 105 * abs(sin(frameCount / 20 + syllable_3_5[i].theta + syllable_1_5[i] / 50)),
        200 + 65 * abs(sin(frameCount / 20 + syllable_3_5[i].x + syllable_1_5[i] / 50)),
        200 + 95 * abs(sin(frameCount / 20 + syllable_3_5[i].x + syllable_1_5[i] / 50)),
        255
      );
      point(
        randomGaussian(0, syllable_1_5[i] / 10) +
          cos(frameCount / 10) * syllable_3_5[i].x * sin(syllable_3_5[i].theta) +
          syllable_3_5[i].x * cos(syllable_3_5[i].theta) * cos(syllable_2_5[i] * 10 + syllable_1_5[i] / 2),
        randomGaussian(0, syllable_1_5[i] / 10) +
          syllable_3_5[i].x * sin(syllable_3_5[i].theta)
      );
    }
  }
}

function checkPlay() {
  if (syllable_2_6) {
    if (!syllable_1_1.isPlaying()) {
      syllable_1_1.play();
    } else {
      syllable_1_1.pause();
    }
  }
}

function mousePressed() {
  // ✅ iOS 대응: AudioContext resume
  if (getAudioContext().state !== "running") {
    getAudioContext().resume();
  }
  syllable_2_6 = !syllable_2_6;
  if (syllable_2_6 && !syllable_1_1.isPlaying()) {
    syllable_1_1.play();
  } else if (!syllable_2_6 && syllable_1_1.isPlaying()) {
    syllable_1_1.pause();
  }
}

// 모바일 터치 대응
function touchStarted() {
  mousePressed();
  return false; // 모바일에서 스크롤 방지
}

function keyPressed() {
  syllable_1_1.stop();
  setup();
  draw();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
