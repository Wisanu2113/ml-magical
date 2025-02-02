import cv2
import asyncio
import websockets
import mediapipe as mp

mp_hands = mp.solutions.hands
mp_drawing = mp.solutions.drawing_utils

# WebSocket URL ของเซิร์ฟเวอร์ของคุณ
WS_URL = "ws://localhost:3002"

async def send_gesture(gesture):
    try:
        async with websockets.connect(WS_URL) as websocket:
            await websocket.send(gesture)
            print(f"Sent: {gesture}")
    except Exception as e:
        print(f"WebSocket Error: {e}")
        await asyncio.sleep(1)  # ลองใหม่หลังจากดีเลย์

def detect_hand_pose(landmarks):
    if landmarks is None or len(landmarks) < 21:
        return None
    
    tips = [4, 8, 12, 16, 20]  # หัวนิ้วมือทั้งหมด
    finger_fold_status = []
    
    for tip in tips[1:]:  # ไม่รวมหัวแม่มือ (4)
        if tip >= len(landmarks) or tip - 2 >= len(landmarks):
            return None  # ป้องกัน IndexError
        
        if landmarks[tip].y > landmarks[tip - 2].y:
            finger_fold_status.append(True)
        else:
            finger_fold_status.append(False)
    
    if all(finger_fold_status):
        return "fist"
    elif not any(finger_fold_status):
        return "open_hand"
    return None

cap = cv2.VideoCapture(0)
last_gesture = None  # เก็บท่าทางล่าสุด

with mp_hands.Hands(min_detection_confidence=0.7, min_tracking_confidence=0.7) as hands:
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        
        frame = cv2.flip(frame, 1)
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = hands.process(rgb_frame)
        
        if results.multi_hand_landmarks:
            for hand_landmarks in results.multi_hand_landmarks:
                if hand_landmarks is not None and len(hand_landmarks.landmark) >= 21:
                    mp_drawing.draw_landmarks(frame, hand_landmarks, mp_hands.HAND_CONNECTIONS)
                    gesture = detect_hand_pose(hand_landmarks.landmark)
                    
                    if gesture and gesture != last_gesture:
                        asyncio.run(send_gesture(gesture))  # ส่งค่า gesture ไปยัง WebSocket
                        last_gesture = gesture  # อัพเดทท่าทางล่าสุด
                        cv2.putText(frame, gesture, (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        
        cv2.imshow('Hand Tracking', frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

cap.release()
cv2.destroyAllWindows()
