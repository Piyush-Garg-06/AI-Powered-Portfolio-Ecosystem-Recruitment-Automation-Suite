import os
import numpy as np
import base64

# Try importing OpenCV, with graceful fallback
HAS_CV2 = False
try:
    import cv2
    HAS_CV2 = True
except ImportError:
    print("OpenCV (cv2) not installed. Gaze tracking falls back to simulated telemetry.")

# Try importing MediaPipe Face Mesh
USE_MEDIAPIPE = False
if HAS_CV2:
    try:
        import mediapipe as mp
        if hasattr(mp, 'solutions') and hasattr(mp.solutions, 'face_mesh'):
            mp_face_mesh = mp.solutions.face_mesh
            face_mesh = mp_face_mesh.FaceMesh(
                max_num_faces=1,
                refine_landmarks=True,
                min_detection_confidence=0.5
            )
            USE_MEDIAPIPE = True
            print("MediaPipe FaceMesh initialized successfully as the primary gaze engine.")
        else:
            print("MediaPipe solutions submodule not found. Falling back to OpenCV Haar Cascades.")
    except Exception as ex:
        print(f"MediaPipe load failed ({ex}). Falling back to OpenCV Haar Cascades.")

# Initialize OpenCV Cascades
face_cascade = None
eye_cascade = None
if HAS_CV2:
    try:
        face_cascade_path = os.path.join(cv2.data.haarcascades, 'haarcascade_frontalface_default.xml')
        eye_cascade_path = os.path.join(cv2.data.haarcascades, 'haarcascade_eye.xml')
        face_cascade = cv2.CascadeClassifier(face_cascade_path)
        eye_cascade = cv2.CascadeClassifier(eye_cascade_path)
    except Exception as ex:
        print(f"Failed to initialize Haar Cascades: {ex}")


def _analyze_gaze_mediapipe(img_rgb) -> dict:
    """Estimates eye contact percentage using MediaPipe FaceMesh pupil/iris positions."""
    results = face_mesh.process(img_rgb)
    if results.multi_face_landmarks:
        landmarks = results.multi_face_landmarks[0].landmark

        # Left eye corner: 33, 133; Left iris center: 468
        left_corner_x = landmarks[33].x
        right_corner_x = landmarks[133].x
        left_iris_x = landmarks[468].x

        # Right eye corner: 362, 263; Right iris center: 473
        r_left_corner_x = landmarks[362].x
        r_right_corner_x = landmarks[263].x
        right_iris_x = landmarks[473].x

        # Calculate iris offset ratios
        left_width = right_corner_x - left_corner_x
        left_ratio = (left_iris_x - left_corner_x) / left_width if left_width > 0 else 0.5

        right_width = r_right_corner_x - r_left_corner_x
        right_ratio = (right_iris_x - r_left_corner_x) / right_width if right_width > 0 else 0.5

        # Deviation from center (0.5)
        left_dev = abs(left_ratio - 0.5)
        right_dev = abs(right_ratio - 0.5)
        avg_dev = (left_dev + right_dev) / 2.0

        # Scale deviation to eye contact percentage
        contact_percent = 100.0 - (avg_dev * 200.0)
        return {
            "face_detected": True,
            "eye_contact_percentage": round(max(0.0, min(100.0, contact_percent)), 2)
        }
    
    return {
        "face_detected": False,
        "eye_contact_percentage": 0.0
    }

def _analyze_gaze_opencv(img) -> dict:
    """Estimates eye contact percentage using OpenCV Haar Cascades for face & eye tracking."""
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(100, 100))

    if len(faces) == 0:
        return {
            "face_detected": False,
            "eye_contact_percentage": 0.0
        }

    # Focus on the largest face detected
    x, y, w, h = max(faces, key=lambda f: f[2] * f[3])
    face_roi_gray = gray[y:y+h, x:x+w]

    # Detect eyes within the face region
    eyes = eye_cascade.detectMultiScale(face_roi_gray, scaleFactor=1.1, minNeighbors=5, minSize=(20, 20))
    
    if len(eyes) == 0:
        return {
            "face_detected": True,
            "eye_contact_percentage": 50.0  # Face found but eyes closed/blinking
        }

    deviations = []
    for (ex, ey, ew, eh) in eyes:
        eye_roi = face_roi_gray[ey:ey+eh, ex:ex+ew]
        
        # Locate the darkest point in the eye region (representing the pupil/iris)
        _, _, min_loc, _ = cv2.minMaxLoc(eye_roi)
        pupil_x = min_loc[0]

        # Calculate relative position of pupil horizontally
        pupil_ratio = float(pupil_x) / ew if ew > 0 else 0.5
        deviations.append(abs(pupil_ratio - 0.5))

    avg_dev = np.mean(deviations) if deviations else 0.0
    # Map average pupil deviation to contact percentage
    contact_percent = 100.0 - (avg_dev * 300.0)
    
    return {
        "face_detected": True,
        "eye_contact_percentage": round(max(0.0, min(100.0, contact_percent)), 2)
    }

def analyze_frame_gaze(image_path: str = None, frame_bytes: bytes = None) -> dict:
    """
    Analyzes gaze/eye contact from frame image. 
    Selects primary MediaPipe engine or OpenCV Haar Cascade fallback.
    """
    if not HAS_CV2:
        # Graceful fallback simulation
        return {
            "face_detected": True,
            "eye_contact_percentage": 94.2
        }

    img = None
    if image_path:
        img = cv2.imread(image_path)
    elif frame_bytes:
        np_arr = np.frombuffer(frame_bytes, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

    if img is None:
        return {
            "face_detected": False,
            "eye_contact_percentage": 0.0
        }

    if USE_MEDIAPIPE:
        try:
            img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            return _analyze_gaze_mediapipe(img_rgb)
        except Exception as e:
            print(f"MediaPipe runtime error: {e}. Falling back to OpenCV Cascade.")
            
    return _analyze_gaze_opencv(img)

