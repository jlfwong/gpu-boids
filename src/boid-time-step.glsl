#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform sampler2D boidData;

varying vec2 vTextureCoord;

void main() {
  vec4 thisData = texture2D(boidData, vTextureCoord);
  vec2 thisPosition = thisData.xy;
  vec2 thisVelocity = thisData.zw;

  gl_FragColor = vec4(thisPosition, thisVelocity);
}
