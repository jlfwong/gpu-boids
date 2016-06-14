#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform float height;
uniform float width;

varying vec2 vTextureCoord;

vec4 computeElement(float s, float t) {
  float i = floor(width*s);
  float j = floor(height*t);
  return vec4(s, t, 0, 1);
}

void main() {
  gl_FragColor = computeElement(vTextureCoord.s, vTextureCoord.t);
}
