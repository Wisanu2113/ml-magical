

let handPose;
let video;
let hands = [];
let screen_width = 1024;
let screen_height = 768;

function preload() {

  handPose = ml5.handPose();
}

function setup() {
  createCanvas(screen_width, screen_height);

  video = createCapture(VIDEO);
  video.size(screen_width, screen_height);
  video.hide();

  handPose.detectStart(video, gotHands);
}

function draw() {

  image(video, 0, 0, width, height);
  // วาดกรอบ Canvas
 
  // เส้นขอบ Canvas
  noFill();
  stroke(0);  // สีดำ
  strokeWeight(4);  // ความหนาของเส้นขอบ
  rect(0, 0, width, height);

  for (let i = 0; i < hands.length; i++) {
    let hand = hands[i];

    // วาดเฉพาะปลายนิ้วชี้ (Index Finger Tip - keypoint 8)
    let indexTip = hand.keypoints[8]; 
    if (indexTip) {
      fill(0, 255, 0);
      noStroke();
      circle(indexTip.x, indexTip.y, 10);
    }
  }
}

// Callback function for when handPose outputs data
function gotHands(results) {
  // save the output to the hands variable
  hands = results;
}
