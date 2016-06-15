import GPGPU from './gpgpu.js';
import boidTimeStepFragmentShaderSource from './boid-time-step.glsl';

const N = 400;
const WIDTH = N;
const HEIGHT = N;

const canvas = document.getElementById("mycanvas");

canvas.width = WIDTH;
canvas.height = HEIGHT;

const gpgpu = new GPGPU(canvas);

const vertexShader = gpgpu.getStandardVertexShader();
const boidTimeStepFragmentShader = gpgpu.compileFragmentShader(
                                        boidTimeStepFragmentShaderSource);

const program = gpgpu.compileProgram(vertexShader, boidTimeStepFragmentShader);

const initialBoidData = new Float32Array(4 * WIDTH * HEIGHT);

for (let i = 0; i < HEIGHT; i++) {
  for (let j = 0; j < WIDTH; j++) {
    const pos = 4 * (i * HEIGHT + j);
    initialBoidData[pos + 0] = Math.floor(j / 10) % 2 == 0 ? 1 : 0;
    initialBoidData[pos + 1] = 0;
    initialBoidData[pos + 2] = 0;
    initialBoidData[pos + 3] = 1.0;
  }
}

const boidsTextureA = gpgpu.makeTexture(WIDTH, HEIGHT, initialBoidData);

gpgpu.useStandardGeometry(program);
gpgpu.standardRender(program, {
  width: WIDTH,
  height: HEIGHT,
  boidData: boidsTextureA
});

/*
// Read data out of the rendered buffer
var buffer = new Float32Array(4 * width * height);
gl.readPixels(0, 0, width, height, gl.RGBA, gl.FLOAT, buffer);
console.log(buffer);
*/
