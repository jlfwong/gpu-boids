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

gpgpu.useStandardGeometry(program);

gpgpu.standardRender(program, {
  width: WIDTH,
  height: HEIGHT
});

/*
// Read data out of the rendered buffer
var buffer = new Float32Array(4 * width * height);
gl.readPixels(0, 0, width, height, gl.RGBA, gl.FLOAT, buffer);
console.log(buffer);
*/
