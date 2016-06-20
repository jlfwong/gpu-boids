import Stats from 'stats.js';

import GPGPU from './gpgpu.js';
import boidTimeStepFragmentShaderSource from './boid-time-step.glsl';
import renderVertexShaderSource from './render-vertex-shader.glsl';
import renderFragmentShaderSource from './render-fragment-shader.glsl';

const stats = new Stats();
stats.showPanel(0);
document.body.appendChild(stats.dom);

const WIDTH = window.innerWidth;
const HEIGHT = window.innerHeight;

const canvas = document.getElementById("mycanvas");

canvas.width = WIDTH;
canvas.height = HEIGHT;

const gl = canvas.getContext("webgl");
const gpgpu = new GPGPU(gl);

const SQRT_N_BOIDS = 256;
const N_BOIDS = SQRT_N_BOIDS * SQRT_N_BOIDS;

// We'll represent each boid by a tuple of floats (x, y, vx, vy), where (x, y)
// is the position of the boids, and (vx, vy) is the velocity of the boid.
const initialBoidData = new Float32Array(4 * N_BOIDS);

for (let i = 0; i < N_BOIDS; i++) {
  const pos = i * 4;
  initialBoidData[pos + 0] = 2 * Math.random() - 1;
  initialBoidData[pos + 1] = 2 * Math.random() - 1;
  initialBoidData[pos + 2] = 0;
  initialBoidData[pos + 3] = 0;
}

// To calculate each time step, we'll use one texture as input, and one texture
// as output. To calculate teh next time step without needing to allocate new
// textures or copy lots of memory, we'll simply flip which one is the input and
// and which is the output.
let boidsTextureIn = gpgpu.makeTexture(SQRT_N_BOIDS, SQRT_N_BOIDS,
                                       initialBoidData);
let boidsTextureOut = gpgpu.makeTexture(SQRT_N_BOIDS, SQRT_N_BOIDS);

let boidsFramebufferIn = gpgpu.makeFramebuffer(boidsTextureIn);
let boidsFramebufferOut = gpgpu.makeFramebuffer(boidsTextureOut);

// Construct the GLSL program to calculate the next time step for the boids
const standardVertexShader = gpgpu.getStandardVertexShader();
const boidTimeStepFragmentShader = gpgpu.compileFragmentShader(
                                      boidTimeStepFragmentShaderSource.replace(
                                        "$SQRT_N_BOIDS$",
                                        "" + SQRT_N_BOIDS));
const boidTimeStepProgram = gpgpu.compileProgram(standardVertexShader,
                                                 boidTimeStepFragmentShader);

// To render the boids, we'll use a vertex buffer where each vertex is
// represented by the (x, y) coordinate of the pixel data associated with each
// boid in the boid state texture.
//
// The vertex shader can then convert this coordinate into the texture into the
// boid's coordinates by looking it up in the texture data.
//
// That information is then passed to the fragment shader.
const renderVertexShader = gpgpu.compileVertexShader(renderVertexShaderSource);
const renderFragmentShader = gpgpu.compileFragmentShader(renderFragmentShaderSource);
const renderProgram = gpgpu.compileProgram(renderVertexShader, renderFragmentShader);
const boidCoordHandle = gpgpu.getAttribLocation(renderProgram, "boidCoord");

// TODO(jlfwong): Could make this much smaller by using a different data type,
// and also by generating the coordinates from the index in the shader instead
// of here. Not sure how much it matters.
const renderVertexData = new Float32Array(2 * N_BOIDS);
const renderVertexBuffer = gl.createBuffer();

for (let i = 0; i < N_BOIDS; i++) {
  const pos = i * 2;
  // We divide both coordinates by SQRT_N_BOIDS to get coordinates between (0,
  // 0) and (1, 1), which is the coordinate range that textures use.
  renderVertexData[pos + 0] = (i % SQRT_N_BOIDS) / SQRT_N_BOIDS;
  renderVertexData[pos + 1] = Math.floor(i / SQRT_N_BOIDS) / SQRT_N_BOIDS;
}

const render = () => {
  gl.viewport(0, 0, WIDTH, HEIGHT);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.useProgram(renderProgram);
  gpgpu.setUniforms(renderProgram, {
    boidData: boidsTextureOut
  });

  // TODO(jlfwong): Is there any way to avoid doing this every time? To construct
  // the buffer once and re-use it when needed?
  gl.bindBuffer(gl.ARRAY_BUFFER, renderVertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, renderVertexData, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(boidCoordHandle);
  gl.vertexAttribPointer(boidCoordHandle,
                         2, // boidCoordHandle is a vec2
                         gl.FLOAT,
                         gl.FALSE,
                         2 * 4, // Every vertex has 2 float components
                         0 // boidCoord is the only attribute in the array buffer
                         );
  gl.drawArrays(gl.GL_POINTS, 0, N_BOIDS);
};

const step = () => {
  gl.viewport(0, 0, SQRT_N_BOIDS, SQRT_N_BOIDS);
  gpgpu.useStandardGeometry(boidTimeStepProgram);
  gpgpu.standardRender(boidTimeStepProgram, {
    boidData: boidsTextureIn,
    SQRT_N_BOIDS: SQRT_N_BOIDS
  }, boidsFramebufferOut);

  // Swap input and output
  [boidsTextureIn, boidsTextureOut] = [boidsTextureOut, boidsTextureIn];
  [boidsFramebufferIn, boidsFramebufferOut] = [boidsFramebufferOut,
                                               boidsFramebufferIn]
};

const tick = () => {
  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);

  stats.begin();
  step();
  render();
  stats.end();
  requestAnimationFrame(tick);
};

tick();

/*
// Read data out of the rendered buffer
var buffer = new Float32Array(4 * width * height);
gl.readPixels(0, 0, width, height, gl.RGBA, gl.FLOAT, buffer);
console.log(buffer);
*/
