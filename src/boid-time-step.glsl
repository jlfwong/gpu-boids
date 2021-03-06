#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform sampler2D boidData;
varying vec2 vTextureCoord;

// SQRT_N_BOIDS is injected into the fragment shader before compilation
const int SQRT_N_BOIDS = $SQRT_N_BOIDS$;
const int N_BOIDS = SQRT_N_BOIDS * SQRT_N_BOIDS;

vec4 boidDataAtPos(int rowIndex, int colIndex) {

    // Texture coords are always between (0, 0) and (1, 1), so we normalize by
    // the width (which is equal to the height) of the texture.
    vec2 textureCoordsForIndex = vec2(
        float(colIndex) / float(SQRT_N_BOIDS),
        float(rowIndex) / float(SQRT_N_BOIDS)
    );
    return texture2D(boidData, textureCoordsForIndex);
}

vec2 boidPosition(int rowIndex, int colIndex) {
    return boidDataAtPos(rowIndex, colIndex).rg;
}

vec2 boidVelocity(int rowIndex, int colIndex) {
    return boidDataAtPos(rowIndex, colIndex).ba;
}

const float ATTRACTION_RADIUS = 0.1;

vec2 attraction(vec2 thisPosition) {
    int thisRowIndex = int(vTextureCoord.s * float(SQRT_N_BOIDS));
    int thisColIndex = int(vTextureCoord.t * float(SQRT_N_BOIDS));

    vec2 ret = vec2(0.0, 0.0);
    int neighbourCount = 0;
    for (int i = 0; i < 1; i++) {
        for (int j = 0; j < int(SQRT_N_BOIDS); j++) {
            if (i == thisRowIndex && j == thisColIndex) {
                continue;
            }
            vec2 boidPos = boidPosition(i, j);
            vec2 gap = boidPos - thisPosition;

            if (length(gap) < ATTRACTION_RADIUS) {
                neighbourCount += 1;
                ret += gap;
            }
        }
    }
    return (ret / float(neighbourCount)) / 50.0;
}

vec2 alignment(vec2 thisPosition, vec2 thisVelocity) {
    int thisRowIndex = int(vTextureCoord.s * float(SQRT_N_BOIDS));
    int thisColIndex = int(vTextureCoord.t * float(SQRT_N_BOIDS));

    vec2 ret = vec2(0.0, 0.0);
    int neighbourCount = 0;
    for (int i = 0; i < 1; i++) {
        for (int j = 0; j < int(SQRT_N_BOIDS); j++) {
            if (i == thisRowIndex && j == thisColIndex) {
                continue;
            }
            vec2 boidVel = boidVelocity(i, j);
            vec2 gap = thisVelocity - boidVel;

            if (length(gap) < ATTRACTION_RADIUS) {
                neighbourCount += 1;
                ret += gap;
            }
        }
    }
    return (ret / float(neighbourCount)) / 100.0;
}

const float REPULSION_RADIUS = 0.1;

float gt(float a, float b, float t, float f) {
    // (a > b) ? t : f
    return mix(f, t, clamp(sign(a - b), 0.0, 1.0));
}

vec2 wallFear(vec2 thisPosition) {
    return vec2(
        (gt(-1.0, thisPosition.x,  1.0, 0.0) +
         gt(thisPosition.x, 1.0,  -1.0, 0.0)),
        (gt(-1.0, thisPosition.y,  1.0, 0.0) +
         gt(thisPosition.y, 1.0,  -1.0, 0.0))
    ) / 10000.0;
}

void main() {
    vec4 thisData = texture2D(boidData, vTextureCoord);
    vec2 thisPosition = thisData.rg;
    vec2 thisVelocity = thisData.ba;

    vec2 newVelocity = (thisVelocity
                        + attraction(thisPosition)
                        + alignment(thisPosition, thisVelocity)
                        + wallFear(thisPosition));

    // Cap speed at 0.01 units/tick
    float speed = min(length(newVelocity), 0.01);
    newVelocity = newVelocity * (speed / length(newVelocity));

    gl_FragColor = vec4(thisPosition + thisVelocity, newVelocity);
}
