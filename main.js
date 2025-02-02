let handPose;
let video;
let hands = [];
let graphics = [];
let currentGraphicIndex = 0;

let previousHandState = "open"; // สถานะมือก่อนหน้า (เริ่มต้นเป็นแบมือ)
let canChangeGraphic = true; // ควบคุมการเปลี่ยนกราฟิก
let delay = 500; // Delay in milliseconds
let lastChangeTime = 0;

function preload() {
  // โหลดโมเดล handPose
  handPose = ml5.handPose();
}

function setup() {
  createCanvas(640, 480);
  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();

  handPose.detectStart(video, gotHands);

  // กำหนดกราฟิกต่างๆ
  graphics = [graphic1, graphic2, graphic3, graphic4, graphic5];
}

function draw() {
  image(video, 0, 0, width, height);

  hands.forEach(hand => {
    let fingertips = [4, 8, 12, 16, 20].map(idx => hand.keypoints[idx]); // ปลายนิ้ว
    let palmBase = hand.keypoints[0]; // จุดฐานฝ่ามือ
   
    
    console.log("ฐานฝ่ามือ" + JSON.stringify(palmBase));
    console.log("ปลายนิ้ว" + fingertips.map(f => JSON.stringify(f)).join(", "));
    console.log("มือกำอยู่หรือไม่" + isHandClosed(fingertips, palmBase));

    // เช็คสถานะมือกำหรือไม่
    if (isHandClosed(fingertips, palmBase)) {
      handleHandClosed();
    } else {
      handleHandOpen();
    }
  });

  // แสดงผลกราฟิกที่เลือก
  graphics[currentGraphicIndex]();
}

// ฟังก์ชันเมื่อมือกำ
function handleHandClosed() {
  let currentTime = millis();
  if (canChangeGraphic && currentTime - lastChangeTime > delay) {
    currentGraphicIndex = (currentGraphicIndex + 1) % graphics.length;
    canChangeGraphic = false; // ป้องกันการเปลี่ยนหลายครั้งติดกัน
    lastChangeTime = currentTime;
  }
  previousHandState = "closed";
}

// ฟังก์ชันเมื่อมือเปิด
function handleHandOpen() {
  if (previousHandState === "closed") {
    canChangeGraphic = true; // รีเซ็ตให้เปลี่ยนกราฟิกได้อีกครั้ง
  }
  previousHandState = "open";
}

// ตรวจสอบว่ามือกำอยู่หรือไม่
function isHandClosed(fingertips, palmBase) {
  return fingertips.every(finger => finger.y > palmBase.y - 60); // เช็คว่านิ้วอยู่ใกล้ฐานมือ
}

// ฟังก์ชันกราฟิกตัวอย่าง
function graphic1() { background(255, 0, 0); } // สีแดง
function graphic2() { background(0, 255, 0); } // สีเขียว
function graphic3() { background(0, 0, 255); } // สีน้ำเงิน
function graphic4() { background(255, 255, 0); } // สีเหลือง
function graphic5() { background(255, 0, 255); } // สีม่วง

function gotHands(results) {
  hands = results;
}
