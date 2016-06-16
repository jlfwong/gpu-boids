attribute vec2 boidCoord;
uniform sampler2D boidData;

void main() {
  vec4 thisBoidData = texture2D(boidData, boidCoord);

  // red component is x position
  // green component is y position
  // blue component is x speed
  // alpha component is y speed
  //
  // For rendering purposes, we don't care about speed
  gl_Position = vec4(thisBoidData.r, thisBoidData.g, 0, 1);

  gl_PointSize = 3.0;
}
