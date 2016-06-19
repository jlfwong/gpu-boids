#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform sampler2D boidData;
varying vec2 vTextureCoord;

// TODO(jlfwong): Is there any way to specify this from main.js instead?
// I guess I could do a regex replace before compilation...
// uniform float SQRT_N_BOIDS;
const float SQRT_N_BOIDS = 64.0;
const float N_BOIDS = SQRT_N_BOIDS * SQRT_N_BOIDS;

vec4 boidDataAtPos(float rowIndex, float colIndex) {

    // Texture coords are always between (0, 0) and (1, 1), so we normalize by
    // the width (which is equal to the height) of the texture.
    vec2 textureCoordsForIndex = vec2(
        colIndex / SQRT_N_BOIDS,
        rowIndex / SQRT_N_BOIDS
    );
    return texture2D(boidData, textureCoordsForIndex);
}

vec2 boidPosition(float rowIndex, float colIndex) {
    return boidDataAtPos(rowIndex, colIndex).rg;
}

vec2 boidVelocity(float rowIndex, float colIndex) {
    return boidDataAtPos(rowIndex, colIndex).ba;
}

vec2 attraction(vec2 thisPosition) {
    vec2 ret = vec2(0.0, 0.0);
    for (float i = 0.0; i < SQRT_N_BOIDS; i++) {
        for (float j = 0.0; j < SQRT_N_BOIDS; j++) {
            // TODO(jlfwong): Skip position of current boid
            ret += boidPosition(i, j);
        }
    }
    return ((ret / N_BOIDS) - thisPosition) / 10000.0;
}

void main() {
    vec4 thisData = texture2D(boidData, vTextureCoord);
    vec2 thisPosition = thisData.rg;
    vec2 thisVelocity = thisData.ba;

    gl_FragColor = vec4(
        thisPosition + thisVelocity,
        thisVelocity + attraction(thisPosition)
    );
}
