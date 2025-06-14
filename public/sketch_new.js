let particles = [];

// function setup() {
//   createCanvas(windowWidth, windowHeight);
//   angleMode(DEGREES);

//   for (let i = 0; i < 64; i++) {
//     particles[i] = {
//       x: map(i, 0, 64, 0, width / 2 - 20),
//       theta: random(0, 360)
//     };
//   }
// }

function setup() {
  createCanvas(windowWidth, windowHeight);
  angleMode(DEGREES);
  // syllable_1_4 = new p5.FFT();
  // syllable_1_5 = syllable_1_4.analyze();
  for (let i = 0; i < syllable_1_5.length; i++) {
    syllable_3_5[i] = {
      x: map(i, 0, syllable_1_5.length, 0, width / 2 - 20),
      theta: random(0, 360)
    };
  }
}

function draw() {
  translate(width / 2, height / 2);

  background(
    105 * abs(cos(frameCount / 50)),
    165 * abs(cos(frameCount / 50)),
    195 * abs(cos(frameCount / 50)),
    10
  );

  for (let i = 0; i < particles.length; i += 10) {
    particles[i].theta -= 0.5;

    for (let j = 0; j < 10; j++) {
      stroke(
        100 + 105 * abs(sin(frameCount / 20 + particles[i].theta)),
        200 + 65 * abs(sin(frameCount / 20 + particles[i].x)),
        200 + 95 * abs(sin(frameCount / 20 + particles[i].x)),
        255
      );
      point(
        randomGaussian(0, 5) +
          cos(frameCount / 10) * particles[i].x * sin(particles[i].theta) +
          particles[i].x * cos(particles[i].theta),
        randomGaussian(0, 5) +
          particles[i].x * sin(particles[i].theta)
      );
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
