attribute vec3 position;
attribute vec2 textureCoord;

varying highp vec2 vTextureCoord;

void main() {
  gl_Position = vec4(position, 1.0);
  vTextureCoord = textureCoord;
}
