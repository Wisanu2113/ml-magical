let handPose;
let video;
let hands = [];
let shaderTexture;
let theShader;
let trail = [];

// Maximum constants for shader
const MAX_PARTICLE_COUNT = 70;
const MAX_TRAIL_COUNT = 30;
var colorScheme = ["#E69F66", "#DF843A", "#D8690F", "#B1560D", "#8A430A"];
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
	uniform int particleCount;
	uniform vec3 particles[${MAX_PARTICLE_COUNT}];
	uniform vec3 colors[${MAX_PARTICLE_COUNT}];

	void main() {
			vec2 st = gl_FragCoord.xy / resolution.xy;  // Warning! This is causing non-uniform scaling.

			float r = 0.0;
			float g = 0.0;
			float b = 0.0;

			for (int i = 0; i < ${MAX_TRAIL_COUNT}; i++) {
				if (i < trailCount) {
					vec2 trailPos = trail[i];
					float value = float(i) / distance(st, trailPos.xy) * 0.00015;  // Multiplier may need to be adjusted if max trail count is tweaked.
					g += value * 0.5;
					b += value;
				}
			}

			float mult = 0.00005;
			
			for (int i = 0; i < ${MAX_PARTICLE_COUNT}; i++) {
				if (i < particleCount) {
					vec3 particle = particles[i];
					vec2 pos = particle.xy;
					float mass = particle.z;
					vec3 color = colors[i];

					r += color.r / distance(st, pos) * mult * mass;
					g += color.g / distance(st, pos) * mult * mass;
					b += color.b / distance(st, pos) * mult * mass;
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
  createCanvas(1600, 600, WEBGL);
  video = createCapture(VIDEO);
  video.size(800, 600);
  video.hide();

  // Initialize shader texture
  shaderTexture = createGraphics(800, 600, WEBGL);
  shaderTexture.noStroke();

  // Start detecting hands
  handPose.detectStart(video, gotHands);
}

function draw() {
  background(0);

  // Draw the webcam video
  texture(video);
  rect(0, -height / 2, 800, 600);

  // Process shader
  if (hands.length > 0) {
    let hand = hands[0]; // Process only the first hand
    for (let j = 0; j < hand.keypoints.length; j++) {
      let keypoint = hand.keypoints[j];
      trail.push([map(keypoint.x, 0, 640, 0, 1)+0.3, map(keypoint.y, 0, 480, 1, 0) + 0.6]);
    }

    // Trim the trail size
    while (trail.length > MAX_TRAIL_COUNT) {
      trail.shift();
    }

    // Render shader
    shaderTexture.shader(theShader);
    theShader.setUniform("resolution", [800, 600]);
    theShader.setUniform("trailCount", trail.length);
    theShader.setUniform("trail", flattenTrail(trail));

    shaderTexture.rect(0, 0, 800, 600);
    texture(shaderTexture);
    rect(-width / 2, -height / 2, 800, 600);
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
