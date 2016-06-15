import standardVertexShaderSource from './standard-vertex-shader.glsl';
import wrapGlDebug from './wrap-gl-debug.js';

/**
 * A class for simplifying GPGPU using WebGL by providing sensible defaults.
 *
 * Example usage:
 *
 *    const canvas = document.getElementById("mycanvas");
 *    const gpgpu = new GPGPU(canvas);
 *    const vertexShader = gpgpu.getStandardVertexShader();
 *
 *    // Inside the fragment shader, vTextureCoord.s and vTextureCoord.t,
 *    // in conjunction with width and height will allow you to calculate
 *    // the x and y coordinate of the pixel being output:
 *    //    float x = floor(width*vTextureCoord.s)
 *    //    float y = floor(height*vTextureCoord.t)
 *    const fragmentShader = gpgpu.compileFragmentShader(...);
 *    const program = gpgpu.compileProgram(vertexShader, fragmentShader);
 *
 *    gpgpu.useStandardGeometry();
 *
 *    // No input textures, render directly to canvas
 *    gpgpu.standardRender(width, height, program);
 *
 */
export default class GPGPU {
  constructor(canvas) {
    this._canvas = canvas;
    this._gl = canvas.getContext("webgl");
    // Uncomment to get stack traces for GL library call failures.
    // this._gl = wrapGlDebug(this._gl);
    this._gl.getExtension("OES_texture_float");
  }

  /**
   * Make a texture to be used as a data input or output.
   *
   * If you wish to use it as an output, you'll need to make an associated
   * framebuffer using makeFramebuffer.
   */
  makeTexture(width, height, dataType=gl.FLOAT, data=null) {
    const gl = this._gl;

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // Pixel format and data for the texture
    gl.texImage2D(gl.TEXTURE_2D, // Target, matches bind above.
      0,        // Level of detail.
      gl.RGBA,  // Internal format.
      width,    // Width - normalized to s.
      height,   // Height - normalized to t.
      0,        // Always 0 in OpenGL ES.
      gl.RGBA,  // Format for each pixel.
      gl.FLOAT, // Data type for each chanel.
      null);    // Image data in the described format, or null.
n
    // Unbind the texture.
    gl.bindTexture(gl.TEXTURE_2D, null);

    return texture;
  }

  makeFramebuffer(texture) {
    const gl = this._gl;

    const frameBuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, // The target is always a FRAMEBUFFER.
      gl.COLOR_ATTACHMENT0, // We are providing the color buffer.
      gl.TEXTURE_2D, // This is a 2D image texture.
      texture, // The texture.
      0); // 0, we aren't using MIPMAPs

    // Revert to using the default framebuffer
    // TODO(jlfwong): This should really revert to using the previous
    // framebuffer, not the default one.
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  compileShader(shaderSource, shaderType) {
    const gl = this._gl;

    const shader = gl.createShader(shaderType);
    gl.shaderSource(shader, shaderSource);
    gl.compileShader(shader);

    const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (!success) {
      throw "Shader compile failed with:" + gl.getShaderInfoLog(shader);
    }

    return shader;
  }

  compileVertexShader(shaderSource) {
    const gl = this._gl;
    return this.compileShader(shaderSource, gl.VERTEX_SHADER);
  }

  compileFragmentShader(shaderSource) {
    const gl = this._gl;
    return this.compileShader(shaderSource, gl.FRAGMENT_SHADER);
  }

  compileProgram(vertexShader, fragmentShader) {
    const gl = this._gl;
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    /*
    // TODO(jlfwong): Provide some way of freeing shaders
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    */

    return program;
  }

  /**
   * Returns a simple vertex shader which makes texture coordinates available as
   * a varying quantity in the fragment shader as vTextureCoord.
   *
   * To be used in conjunction with useStandardGeomtry().
   */
  getStandardVertexShader() {
    return this.compileVertexShader(standardVertexShaderSource);
  }

  /**
   * gl.getAttribLocation without silent failure.
   */
  getAttribLocation(program, name) {
    const gl = this._gl;

    var attributeLocation = gl.getAttribLocation(program, name);
    if (attributeLocation === -1) {
      alert('Can not find attribute ' + name + '.');
    }
    return attributeLocation;
  }

  /**
   * gl.getUniformLocation without silent failure.
   */
  getUniformLocation(program, name) {
    const gl = this._gl;

    var uniformLocation = gl.getUniformLocation(program, name);
    if (uniformLocation === -1) {
      alert('Can not find uniform ' + name + '.');
    }
    return uniformLocation;
  }

  /**
   * Set up the standard geometry to be used in conjunction with the standard
   * vertex shader returned by getStandardVertexShader, and to be drawn using 
   * gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4).
   *
   * This geometry exactly covers the standard viewport from (-1, -1) to (1, 1),
   * and has corresponding texture coordinates from (0, 0) to (0, 1).
   *
   * This allows the fragment shader to be called once per pixel in the target
   * texture, with the vTextureCoord set in the standard vertex shader allowing
   * the fragment shader to be aware of the (x, y) coordinate of the fragment
   * it's outputting.
   */
  useStandardGeometry(program) {
    const gl = this._gl;

    // Data is formatted as (x, y, z, s, t) where (x,y,z) is position, and (s,t)
    // are texture coords The vertex data is set up to be used in conjunction
    // with gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4): This defines 4 vertices in
    // an order that results in drawing a square using 2 triangles.
    const standardVertices = new Float32Array([
      -1.0,  1.0, 0.0, 0.0, 0.0, // upper left
      -1.0, -1.0, 0.0, 0.0, 1.0, // lower left
      1.0,   1.0, 0.0, 1.0, 0.0, // upper right
      1.0,  -1.0, 0.0, 1.0, 1.0  // lower right
    ]); 

    const vertexDataBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexDataBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, standardVertices, gl.STATIC_DRAW);

    // Set up vertex attributes for use in the standard vertex shader
    // This makes the following attributes available in the vertex shader:
    //  attribute vec3 position
    //  attribute vec2 textureCoord
    const positionHandle = this.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(positionHandle);
    gl.vertexAttribPointer(positionHandle,
                           3, // position is a vec3
                           gl.FLOAT,
                           gl.FALSE,
                           5 * 4, // Every vertex has 5 float components,
                                  // and each float is 4 bytes
                           0 // Within each vertex, the byte offset to
                             // the position is 0 (the first 3 floats 
                             // for each vertex represent the position)
                           );

    const textureCoordHandle = this.getAttribLocation(program, "textureCoord");
    gl.enableVertexAttribArray(textureCoordHandle);
    gl.vertexAttribPointer(textureCoordHandle,
                           2, // textureCoord is a vec2
                           gl.FLOAT,
                           gl.FALSE,
                           5 * 4, // Every vertex has 5 float components
                           3 * 4 // Within each vertex, the byte offset
                                 // to the position is 12 (following the first
                                 // 3 float, dedicated to position).
                           );
  }

  /**
   * Set the values of unfiroms in the given program.
   * Note that in the case of textures, this may over-write any or all previous
   * textures set.
   *
   * Every time a texture is set, any textures set in previous calls to
   * setUniforms may be over-written.
   *
   * In particular, if you do this:
   *
   *  setUniforms(program, {tex1: someTexture});
   *  setUniforms(program, {tex2: someOtherTexture});
   *
   * Then tex1 and tex2 will both refer to someOtherTexture in the shaders.
   *
   * TODO(jlfwong): This weirdness is fixable if we keep a map of texture names
   * to their texture ID (i.e. remember that tex1 is gl.TEXTURE0). Would then
   * need a way of garbage collecting them or resetting the entire state. Eugh.
   */
  setUniforms(program, uniformMap) {
    const gl = this._gl;

    let textureId = 0;

    for (const key in uniformMap) {
      if (!uniformMap.hasOwnProperty(key)) {
        continue;
      }
      // TODO(jlfwong): Cache the uniform locations?
      const handle = this.getUniformLocation(program, key);
      const value = uniformMap[key];

      if (value instanceof WebGLTexture) {
        gl.activeTexture(gl[`TEXTURE${textureId}`]);
        gl.bindTexture(gl.TEXTURED_2D, value);
        gl.uniform1i(handle, textureId);
        textureId++;
      } else {
        // TODO(jlfwong): Support uniform types other than 1f
        gl.uniform1f(handle, value);
      }
    }
  }

  standardRender(program, uniforms, framebuffer=null) {
    const gl = this._gl;

    gl.useProgram(program);

    this.setUniforms(uniforms);

    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

    // Render triangle strips for the 4 vertices defined in useStandardGeometry
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
};

export default GPGPU;
