#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform float height;
uniform float width;
uniform sampler2D boidData;

varying vec2 vTextureCoord;

void main() {
  gl_FragColor = texture2D(boidData, vec2(vTextureCoord.s, vTextureCoord.t));
}
