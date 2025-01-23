let handPose;
let video;
let hands = [];
let shaderTexture;
let theShader;
let trail = [];

// Maximum constants for shader
const MAX_PARTICLE_COUNT = 70;
const MAX_TRAIL_COUNT = 30;

let vertShader = `
  precision highp float;

  attribute vec3 aPosition;

  void main() {
    vec4 positionVec4 = vec4(aPosition, 1.0);
    positionVec4.xy = positionVec4.xy * 2.0 - 1.0;
    gl_Position = positionVec4;
  }
`;

let fragShader = `
  precision highp float;

  uniform vec2 resolution;
  uniform int trailCount;
  uniform vec2 trail[${MAX_TRAIL_COUNT}];

  void main() {
    vec2 st = gl_FragCoord.xy / resolution.xy;

    float r = 0.0;
    float g = 0.0;
    float b = 0.0;

    for (int i = 0; i < ${MAX_TRAIL_COUNT}; i++) {
      if (i < trailCount) {
        vec2 trailPos = trail[i];
        float value = 1.0 / distance(st, trailPos.xy) * 0.002;
        g += value * 0.5;
        b += value;
      }
    }

    gl_FragColor = vec4(r, g, b, 1.0);
  }
`;

function preload() {
  // Load the handPose model and shader
  handPose = ml5.handPose();
  theShader = new p5.Shader(this.renderer, vertShader, fragShader);
}

function setup() {
  createCanvas(640, 480, WEBGL);
  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();

  // Initialize shader texture
  shaderTexture = createGraphics(640, 480, WEBGL);
  shaderTexture.noStroke();

  // Start detecting hands
  handPose.detectStart(video, gotHands);
}

function draw() {
  background(0);

  // Draw the webcam video
  texture(video);
  rect(-width / 2, -height / 2, width, height);

  // Process shader
  if (hands.length > 0) {
    let hand = hands[0]; // Process only the first hand
    for (let j = 0; j < hand.keypoints.length; j++) {
      let keypoint = hand.keypoints[j];
      trail.push([map(keypoint.x, 0, width, 0, 1), map(keypoint.y, 0, height, 1, 0)]);
    }

    // Trim the trail size
    while (trail.length > MAX_TRAIL_COUNT) {
      trail.shift();
    }

    // Render shader
    shaderTexture.shader(theShader);
    theShader.setUniform("resolution", [width, height]);
    theShader.setUniform("trailCount", trail.length);
    theShader.setUniform("trail", flattenTrail(trail));

    shaderTexture.rect(0, 0, width, height);
    texture(shaderTexture);
    rect(-width / 2, -height / 2, width, height);
  }
}

// Callback function for when handPose outputs data
function gotHands(results) {
  hands = results;
}

// Utility function to flatten trail array
function flattenTrail(trail) {
  let flat = [];
  for (let i = 0; i < trail.length; i++) {
    flat.push(trail[i][0], trail[i][1]);
  }
  return flat;
}
