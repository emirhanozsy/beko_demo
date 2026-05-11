try:
    import depthai as dai
    import cv2
    import time
    import os
    import threading
    from datetime import datetime
    from fastapi import FastAPI, Response
    from fastapi.responses import StreamingResponse
    from pydantic import BaseModel
    import uvicorn
    from fastapi.middleware.cors import CORSMiddleware
    from ultralytics import YOLO
except Exception as e:
    print(f"CRITICAL IMPORT ERROR: {e}", flush=True)
    import sys
    sys.exit(1)

print("🚀 Beko Vision AI Backend Başlatılıyor...", flush=True)

# ===================== AYARLAR =====================
CAMERA_IP = "192.168.0.68"
MODEL_PATH = "best_v3.pt"
SAVE_DIR = "saved_frames"

FOCUS_INITIAL = 120
EXP_TIME_INITIAL = 20000
ISO_INITIAL = 500

if not os.path.exists(SAVE_DIR):
    os.makedirs(SAVE_DIR)

app = FastAPI()

# CORS settings for the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global state
class CameraState:
    def __init__(self):
        self.focus = FOCUS_INITIAL
        self.exp_time = EXP_TIME_INITIAL
        self.iso = ISO_INITIAL
        self.brightness = 0
        self.contrast = 0
        self.saturation = 0
        self.sharpness = 1
        self.fps = 0
        self.latest_frame = None
        self.running = True
        self.q_ctrl = None

state = CameraState()

class ControlUpdate(BaseModel):
    focus: int = None
    exp_time: int = None
    iso: int = None
    brightness: int = None
    contrast: int = None
    saturation: int = None
    sharpness: int = None

def camera_thread():
    global state
    print(f"Model yükleniyor: {MODEL_PATH}...", flush=True)
    model = YOLO(MODEL_PATH)

    device_info = dai.DeviceInfo(CAMERA_IP)
    device = dai.Device(device_info)
    print(f"✅ OAK-D Bağlantısı kuruldu: {CAMERA_IP}", flush=True)

    pipeline = dai.Pipeline(device)
    cam = pipeline.create(dai.node.Camera)
    cam.build(boardSocket=dai.CameraBoardSocket.CAM_A)

    cam.initialControl.setManualExposure(state.exp_time, state.iso)
    cam.initialControl.setManualFocus(state.focus)
    cam.initialControl.setManualWhiteBalance(3792)
    # Yeni parametreler
    cam.initialControl.setBrightness(state.brightness)
    cam.initialControl.setContrast(state.contrast)
    cam.initialControl.setSaturation(state.saturation)
    cam.initialControl.setSharpness(state.sharpness)

    video_enc = pipeline.create(dai.node.VideoEncoder)
    video_enc.setDefaultProfilePreset(30, dai.VideoEncoderProperties.Profile.MJPEG)
    video_enc.setQuality(80)

    cam_out = cam.requestOutput(size=(3840, 2160), type=dai.ImgFrame.Type.NV12, fps=30)
    cam_out.link(video_enc.input)

    q_stream = video_enc.bitstream.createOutputQueue(maxSize=4, blocking=False)
    state.q_ctrl = cam.inputControl.createInputQueue(maxSize=4, blocking=False)

    print(f"Bağlanılıyor: {CAMERA_IP}...", flush=True)
    pipeline.start()

    frame_count = 0
    inference_count = 0
    start_time = time.time()
    latest_results = []

    try:
        while state.running:
            in_encoded = q_stream.tryGet()
            if in_encoded is not None:
                frame_count += 1
                raw_frame = cv2.imdecode(in_encoded.getData(), cv2.IMREAD_COLOR)
                
                # Kasma sorununu çözmek için 1080p'ye küçült
                raw_frame = cv2.resize(raw_frame, (1920, 1080))
                
                # 30 FPS akışta saniyede 5 kez detection yapmak için her 6 karede bir yap
                if frame_count % 6 == 0:
                    results = model(raw_frame, stream=True, verbose=False, imgsz=640)
                    latest_results = list(results)
                    inference_count += 1

                # Sonuçları çiz (her karede son detection sonuçlarını kullan)
                display_frame = raw_frame.copy()
                for r in latest_results:
                    display_frame = r.plot()

                # FPS Calculation
                if time.time() - start_time >= 1.0:
                    state.fps = frame_count
                    print(f"DEBUG: FPS: {frame_count}, Inference: {inference_count}", flush=True)
                    frame_count = 0
                    inference_count = 0
                    start_time = time.time()

                # Encode to JPEG for streaming
                _, jpeg = cv2.imencode('.jpg', display_frame)
                state.latest_frame = jpeg.tobytes()

    finally:
        device.close()

@app.get("/video_feed")
async def video_feed():
    def generate():
        while state.running:
            if state.latest_frame is not None:
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + state.latest_frame + b'\r\n')
            time.sleep(0.03)  # ~30 FPS

    return StreamingResponse(generate(), media_type="multipart/x-mixed-replace; boundary=frame")

@app.get("/status")
async def get_status():
    return {
        "focus": state.focus,
        "exp_time": state.exp_time,
        "iso": state.iso,
        "brightness": state.brightness,
        "contrast": state.contrast,
        "saturation": state.saturation,
        "sharpness": state.sharpness,
        "fps": state.fps
    }

@app.post("/control")
async def update_control(update: ControlUpdate):
    if state.q_ctrl is None:
        return {"error": "Camera not initialized"}

    ctrl = dai.CameraControl()
    if update.focus is not None:
        state.focus = update.focus
        ctrl.setManualFocus(state.focus)
    if update.exp_time is not None or update.iso is not None:
        if update.exp_time is not None: state.exp_time = update.exp_time
        if update.iso is not None: state.iso = update.iso
        ctrl.setManualExposure(state.exp_time, state.iso)
    
    if update.brightness is not None:
        state.brightness = update.brightness
        ctrl.setBrightness(state.brightness)
    if update.contrast is not None:
        state.contrast = update.contrast
        ctrl.setContrast(state.contrast)
    if update.saturation is not None:
        state.saturation = update.saturation
        ctrl.setSaturation(state.saturation)
    if update.sharpness is not None:
        state.sharpness = update.sharpness
        ctrl.setSharpness(state.sharpness)
    
    state.q_ctrl.send(ctrl)
    return {"status": "ok", "current": {
        "focus": state.focus, 
        "exp_time": state.exp_time, 
        "iso": state.iso,
        "brightness": state.brightness,
        "contrast": state.contrast,
        "saturation": state.saturation,
        "sharpness": state.sharpness
    }}

@app.post("/capture")
async def capture_frame():
    if state.latest_frame is None:
        return {"error": "No frame available"}
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"capture_{timestamp}.jpg"
    path = os.path.join(SAVE_DIR, filename)
    
    with open(path, "wb") as f:
        f.write(state.latest_frame)
    
    return {"status": "saved", "path": path, "filename": filename}

if __name__ == "__main__":
    t = threading.Thread(target=camera_thread, daemon=True)
    t.start()
    uvicorn.run(app, host="0.0.0.0", port=8000)
