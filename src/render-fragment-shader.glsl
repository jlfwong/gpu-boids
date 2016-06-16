#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

void main() {
  // Render boids as solid black
  gl_FragColor = vec4(0, 0, 0, 1);
}
