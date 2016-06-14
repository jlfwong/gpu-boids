var width = 100;
var height = 100;

var canvas = document.getElementById("mycanvas");
canvas.width = width;
canvas.height = height;
var gl = canvas.getContext("webgl");

// Enable textures to store their components as floats
gl.getExtension('OES_texture_float');

// Create the texture to be used as output
var texture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, texture);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

// Pixel format and data for the texture
gl.texImage2D(gl.TEXTURE_2D, // Target, matches bind above.
  0, // Level of detail.
  gl.RGBA, // Internal format.
  width, // Width - normalized to s.
  height, // Height - normalized to t.
  0, // Always 0 in OpenGL ES.
  gl.RGBA, // Format for each pixel.
  gl.FLOAT, // Data type for each chanel.
  null); // Image data in the described format, or null.
// Unbind the texture.
gl.bindTexture(gl.TEXTURE_2D, null);

// Create the framebuffer to make WebGL render its output
// to a texture instead of the canvas
var frameBuffer = gl.createFramebuffer();
gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
gl.framebufferTexture2D(gl.FRAMEBUFFER, // The target is always a FRAMEBUFFER.
  gl.COLOR_ATTACHMENT0, // We are providing the color buffer.
  gl.TEXTURE_2D, // This is a 2D image texture.
  texture, // The texture.
  0); // 0, we aren't using MIPMAPs
gl.bindFramebuffer(gl.FRAMEBUFFER, null);

// Ensure the framebuffer is ready
var message;
var value;

// Create the shaders and link them together into a program
var compileShader = function(gl, shaderSource, shaderType) {
  var shader = gl.createShader(shaderType);
  gl.shaderSource(shader, shaderSource);
  gl.compileShader(shader);

  var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (!success) {
    throw "Shader compile failed with:" + gl.getShaderInfoLog(shader);
  }

  return shader;
};

var vertexShaderSource = require('./standard-vertex-shader.glsl');
var vertexShader = compileShader(gl, vertexShaderSource, gl.VERTEX_SHADER);

var fragmentShaderSource = require('./boid-time-step.glsl');
var fragmentShader = compileShader(gl, fragmentShaderSource, gl.FRAGMENT_SHADER);

var program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);
gl.deleteShader(vertexShader);
gl.deleteShader(fragmentShader);
gl.useProgram(program);

// Set up data
// Data is formatted as (x, y, z, s, t) where (x,y,z) is position, and (s,t) are texture coords
// The vertex data is set up to be used in conjunction with gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4):
// This defines 4 vertices in an order that results in drawing a square using 2 triangles.
var standardVertices = new Float32Array([-1.0, 1.0, 0.0, 0.0, 1.0, // upper left
  -1.0, -1.0, 0.0, 0.0, 0.0, // lower left
  1.0, 1.0, 0.0, 1.0, 1.0, // upper right
  1.0, -1.0, 0.0, 1.0, 0.0
]); // lower right
var vertexDataBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vertexDataBuffer);
gl.bufferData(gl.ARRAY_BUFFER, standardVertices, gl.STATIC_DRAW);

// Set up vertex attributes to be used during rendering
var getAttribLocation = function(gl, program, name) {
  var attributeLocation = gl.getAttribLocation(program, name);
  if (attributeLocation === -1) {
    alert('Can not find attribute ' + name + '.');
  }
  return attributeLocation;
};
var getUniformLocation = function(gl, program, name) {
  var uniformLocation = gl.getUniformLocation(program, name);
  if (uniformLocation === -1) {
    alert('Can not find uniform ' + name + '.');
  }
  return uniformLocation;
};

// Set up attributes (used in vertex shader)
var positionHandle = getAttribLocation(gl, program, "position");
var textureCoordHandle = getAttribLocation(gl, program, "textureCoord");
gl.enableVertexAttribArray(positionHandle);
gl.enableVertexAttribArray(textureCoordHandle);
gl.vertexAttribPointer(positionHandle, 3, gl.FLOAT, gl.FALSE, 5 * 4, 0);
gl.vertexAttribPointer(textureCoordHandle, 2, gl.FLOAT, gl.FALSE, 5 * 4, 3 * 4);

// Set up uniforms (used in fragment shader)
var widthHandle = getUniformLocation(gl, program, "width");
var heightHandle = getUniformLocation(gl, program, "height");
gl.uniform1f(widthHandle, width);
gl.uniform1f(heightHandle, height);

// Render the triangle strip, causing the data pipeline to run
gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
gl.deleteProgram(program);

// Read data out of the rendered buffer
var buffer = new Float32Array(4 * width * height);
gl.readPixels(0, 0, width, height, gl.RGBA, gl.FLOAT, buffer);
console.log(buffer);
