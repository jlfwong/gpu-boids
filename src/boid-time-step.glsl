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

vec4 boidDataAtIndex(float boidIndex) {
    float rowIndex = floor(boidIndex / SQRT_N_BOIDS);
    float colIndex = mod(floor(boidIndex), floor(SQRT_N_BOIDS));

    // Texture coords are always between (0, 0) and (1, 1), so we normalize by
    // the width (which is equal to the height) of the texture.
    vec2 textureCoords = vec2(
        colIndex / SQRT_N_BOIDS,
        rowIndex / SQRT_N_BOIDS
    );
    return texture2D(boidData, textureCoords);
}

vec2 boidPosition(float boidIndex) {
    return boidDataAtIndex(boidIndex).rg;
}

vec2 boidVelocity(float boidIndex) {
    return boidDataAtIndex(boidIndex).ba;
}

vec2 attraction() {
    float x = vTextureCoord.s * SQRT_N_BOIDS;
    float y = vTextureCoord.t * SQRT_N_BOIDS;

    float thisBoidIndex = y * SQRT_N_BOIDS + x;
    vec2 thisBoidPosition = boidPosition(thisBoidIndex);

    vec2 ret = vec2(0.0, 0.0);
    for (float i = 0.0; i < N_BOIDS; i++) {
        if (floor(i) == floor(thisBoidIndex)) {
            continue;
        }
        ret += boidPosition(i) - thisBoidPosition;
    }
    return (ret / (N_BOIDS - 1.0)) / 10000.0;
}

void main() {
    vec4 thisData = texture2D(boidData, vTextureCoord);
    vec2 thisPosition = thisData.rg;
    vec2 thisVelocity = thisData.ba;

    gl_FragColor = vec4(
        thisPosition + thisVelocity,
        thisVelocity + attraction()
    );
}
