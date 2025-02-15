import cv2
import asyncio
import websockets
import mediapipe as mp
import threading
import speech_recognition as sr

# กำหนดไลบรารีสำหรับ HandPose
mp_hands = mp.solutions.hands
mp_drawing = mp.solutions.drawing_utils

WS_URL = "ws://localhost:3001"

# ฟังก์ชันสำหรับส่งข้อมูลผ่าน WebSocket
async def send_gesture(gesture):
    try:
        async with websockets.connect(WS_URL) as websocket:
            await websocket.send(f'{{"event": "hands", "gesture": "{gesture}"}}')
            print(f"✅ Sent: {gesture}")
    except Exception as e:
        print(f"❌ WebSocket Error: {e}")

# ฟังก์ชันตรวจจับ Hand Pose จาก landmarks
def detect_hand_pose(landmarks):
    if landmarks is None or len(landmarks) < 21:
        return "Unknown"
    
    # กำหนดตำแหน่ง tip ของนิ้วที่ต้องตรวจสอบ
    tips = [4, 8, 12, 16, 20]
    fold_status = []

    for i in range(5):
        if landmarks[tips[i]].y < landmarks[tips[i] - 2].y:
            fold_status.append(1)  # นิ้วยกขึ้น
        else:
            fold_status.append(0)  # นิ้วหุบลง

    num_fingers = sum(fold_status)
    
    if num_fingers == 1:
        return "1"
    elif num_fingers == 2:
        return "2"
    elif num_fingers == 3:
        return "3"
    elif num_fingers == 4:
        return "4"
    elif num_fingers == 5:
        return "5"
    elif num_fingers == 0:
        return "Fist"
    else:
        return "Unknown"

# ฟังก์ชันสำหรับตรวจจับเสียงคำว่า "คิดถึง"
def listen_for_keyword():
    recognizer = sr.Recognizer()
    microphone = sr.Microphone()
    
    # ปรับระดับเสียงรบกวนเริ่มต้น
    with microphone as source:
        recognizer.adjust_for_ambient_noise(source)
    
    while True:
        try:
            with microphone as source:
                print("กำลังฟังเสียง... รอฟังคำว่า 'คิดถึง'")
                audio = recognizer.listen(source, phrase_time_limit=5)
            try:
                # ใช้ recognize_google โดยระบุภาษาไทย (th-TH)
                text = recognizer.recognize_google(audio, language='th-TH')
                print("ตรวจจับเสียง:", text)
                if "คิดถึง" in text:
                    asyncio.run(send_gesture("miss"))

            except sr.UnknownValueError:
                print("ไม่เข้าใจเสียงที่ได้")
            except sr.RequestError as e:
                print("ไม่สามารถร้องขอผลลัพธ์ได้; {0}".format(e))
        except Exception as e:
            print("เกิดข้อผิดพลาดในการฟังเสียง:", e)

# เริ่ม thread สำหรับตรวจจับเสียง (daemon จะปิดพร้อมกับโปรแกรมหลัก)
voice_thread = threading.Thread(target=listen_for_keyword, daemon=True)
voice_thread.start()

# เริ่มต้นการจับภาพวิดีโอสำหรับ HandPose
cap = cv2.VideoCapture(0)
last_gesture = None

with mp_hands.Hands(min_detection_confidence=0.7, min_tracking_confidence=0.7) as hands:
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        
        frame = cv2.flip(frame, 1)
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = hands.process(rgb_frame)

        gesture = "Unknown"
        if results.multi_hand_landmarks:
            for hand_landmarks in results.multi_hand_landmarks:
                if hand_landmarks is not None and len(hand_landmarks.landmark) >= 21:
                    mp_drawing.draw_landmarks(frame, hand_landmarks, mp_hands.HAND_CONNECTIONS)
                    gesture = detect_hand_pose(hand_landmarks.landmark)

        cv2.putText(frame, f"Gesture: {gesture}", (50, 50), 
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        
        # ส่งข้อมูลผ่าน WebSocketเมื่อ gesture เปลี่ยนแปลง
        if gesture != last_gesture:
            asyncio.run(send_gesture(gesture))
            last_gesture = gesture

        cv2.imshow('Hand Tracking', frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

cap.release()
cv2.destroyAllWindows()
