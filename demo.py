import depthai as dai
import cv2
import time
import os
from datetime import datetime
try:
    from ultralytics import YOLO
except ImportError:
    print("Hata: 'ultralytics' kütüphanesi bulunamadı. Lütfen 'pip install ultralytics' komutu ile yükleyin.")
    exit()

# ===================== AYARLAR =====================
CAMERA_IP = "192.168.0.68"
MODEL_PATH = "best_v3.pt"
SAVE_DIR = "saved_frames"

FOCUS_INITIAL = 120
EXP_TIME_INITIAL = 20000
ISO_INITIAL = 500

FOCUS_STEP = 5
EXP_STEP = 1000
ISO_STEP = 50
DISPLAY_SCALE = 0.4
# ==================================================

if not os.path.exists(SAVE_DIR):
    os.makedirs(SAVE_DIR)

print(f"Model yükleniyor: {MODEL_PATH}...")
model = YOLO(MODEL_PATH)

device_info = dai.DeviceInfo(CAMERA_IP)
device = dai.Device(device_info)

pipeline = dai.Pipeline(device)
cam = pipeline.create(dai.node.Camera)
cam.build(boardSocket=dai.CameraBoardSocket.CAM_A)

cam.initialControl.setManualExposure(EXP_TIME_INITIAL, ISO_INITIAL)
cam.initialControl.setManualFocus(FOCUS_INITIAL)
cam.initialControl.setManualWhiteBalance(3792)

video_enc = pipeline.create(dai.node.VideoEncoder)
video_enc.setDefaultProfilePreset(30, dai.VideoEncoderProperties.Profile.MJPEG)
video_enc.setQuality(80)

cam_out = cam.requestOutput(size=(3840, 2160), type=dai.ImgFrame.Type.NV12, fps=30)
cam_out.link(video_enc.input)

q_stream = video_enc.bitstream.createOutputQueue(maxSize=4, blocking=False)
q_ctrl = cam.inputControl.createInputQueue(maxSize=4, blocking=False)

print(f"Bağlanılıyor: {CAMERA_IP}...")
pipeline.start()

focus = FOCUS_INITIAL
exp_time = EXP_TIME_INITIAL
iso = ISO_INITIAL
fps_text = "0"
frame_count = 0
start_time = time.time()

try:
    while pipeline.isRunning():
        in_encoded = q_stream.tryGet()

        if in_encoded is not None:
            # Orijinal temiz görüntü (RAW)
            raw_frame = cv2.imdecode(in_encoded.getData(), cv2.IMREAD_COLOR)
            
            # Üzerine çizim yapılacak kopya (Display)
            display_frame = raw_frame.copy()
            
            # Real-Time Detect (Host-Side)
            results = model(raw_frame, stream=True, verbose=False, imgsz=640)
            for r in results:
                display_frame = r.plot() # Çizimleri kopyaya ekle

            # FPS
            frame_count += 1
            if time.time() - start_time >= 1.0:
                fps_text = str(frame_count)
                frame_count = 0
                start_time = time.time()

            # Ekranda göstermek için ölçeklendir
            dh, dw = int(display_frame.shape[0] * DISPLAY_SCALE), int(display_frame.shape[1] * DISPLAY_SCALE)
            display = cv2.resize(display_frame, (dw, dh), interpolation=cv2.INTER_AREA)

            # Bilgi Paneli (Ekrana yazılan bilgiler de kaydedilmez)
            info = [f"FPS: {fps_text}", f"Focus: {focus}", f"Exp: {exp_time}us", f"ISO: {iso}"]
            for i, text in enumerate(info):
                y = 30 + (i * 30)
                cv2.putText(display, text, (15, y), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 0), 3)
                cv2.putText(display, text, (15, y), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)

            cv2.imshow("OAK-D + YOLOv8 (Clean Save)", display)

        key = cv2.waitKey(1)
        if key == ord('q'): break
        elif key in (ord('+'), ord('=')):
            focus = min(255, focus + FOCUS_STEP)
            ctrl = dai.CameraControl(); ctrl.setManualFocus(focus); q_ctrl.send(ctrl)
        elif key == ord('-'):
            focus = max(0, focus - FOCUS_STEP)
            ctrl = dai.CameraControl(); ctrl.setManualFocus(focus); q_ctrl.send(ctrl)
        elif key in (ord('e'), ord('E')):
            exp_time = min(33000, exp_time + EXP_STEP)
            ctrl = dai.CameraControl(); ctrl.setManualExposure(exp_time, iso); q_ctrl.send(ctrl)
        elif key in (ord('d'), ord('D')):
            exp_time = max(1, exp_time - EXP_STEP)
            ctrl = dai.CameraControl(); ctrl.setManualExposure(exp_time, iso); q_ctrl.send(ctrl)
        elif key in (ord('s'), ord('S')):
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"raw_capture_{timestamp}.jpg"
            path = os.path.join(SAVE_DIR, filename)
            # Kayıt için temiz kopyayı (raw_frame) kullanıyoruz
            cv2.imwrite(path, raw_frame)
            print(f"[TEMİZ FOTOĞRAF KAYDEDİLDİ] -> {path}")

finally:
    device.close()
    cv2.destroyAllWindows()
