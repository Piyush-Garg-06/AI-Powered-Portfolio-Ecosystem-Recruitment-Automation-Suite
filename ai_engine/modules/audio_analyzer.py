import re
import numpy as np

try:
    import librosa
    HAS_LIBROSA = True
except ImportError:
    print("librosa not installed, using fallback for audio analysis")
    HAS_LIBROSA = False

def analyze_vocal_telemetry(audio_path: str, transcript: str, duration_sec: float = None) -> dict:
    """
    Loads candidate's audio answer (.wav), measures pause/silence duration, 
    speech energy, WPM, filler words, and calculates a delivery score.
    """
    # Initialize defaults
    silence_ratio = 0.12 # fallback average silence ratio
    energy_confidence = 0.085 # fallback energy confidence
    total_duration = duration_sec or 15.0

    if HAS_LIBROSA:
        try:
            # Load audio file using librosa
            y, sr = librosa.load(audio_path, sr=None)
            
            # Calculate duration if not provided
            audio_dur = librosa.get_duration(y=y, sr=sr)
            if not duration_sec or duration_sec <= 0:
                total_duration = audio_dur
            else:
                total_duration = duration_sec

            if total_duration > 0:
                # 1. Measure pauses/silence using librosa.effects.split
                # Split detects non-silent intervals. top_db=25 marks silence threshold.
                intervals = librosa.effects.split(y, top_db=25)
                
                # Non-silent duration is the sum of interval lengths converted to seconds
                active_samples = sum(end - start for start, end in intervals)
                active_duration = float(active_samples) / sr
                silence_duration = max(0.0, total_duration - active_duration)
                silence_ratio = min(1.0, silence_duration / total_duration)

                # 2. Compute average RMS energy as a measure of speech confidence
                rms_frames = librosa.feature.rms(y=y)
                energy_confidence = float(np.mean(rms_frames))
        except Exception as e:
            print(f"Error processing audio in librosa: {e}")

    # 3. Transcript-based metrics: WPM and filler words
    words = []

    is_empty = (not transcript) or "no spoken response" in transcript.lower() or "no response recorded" in transcript.lower() or transcript.strip() == ""
    
    if transcript and not is_empty:
        words = re.findall(r'\b[a-zA-Z\']+\b', transcript.lower())
    
    total_words = len(words)

    # WPM calculation
    if total_duration <= 0 or is_empty:
        wpm = 0.0
    else:
        wpm = float(total_words) / (total_duration / 60.0)

    # Ideal WPM is 120-150. Deduct for deviation
    ideal_wpm_diff = 0.0
    if wpm < 120.0:
        ideal_wpm_diff = 120.0 - wpm
    elif wpm > 150.0:
        ideal_wpm_diff = wpm - 150.0

    # Filler words count
    target_fillers = ["um", "uh", "like", "basically", "actually", "literally"]
    filler_count = sum(1 for w in words if w in target_fillers)

    # 4. Speech Delivery Score formula
    # Start at 100, deduct for fillers, WPM deviation, and excessive silence
    if is_empty:
        delivery_score = 0.0
    else:
        delivery_score = 100.0 - (filler_count * 4.0) - (ideal_wpm_diff * 0.5) - (silence_ratio * 30.0)
        delivery_score = max(0.0, min(100.0, delivery_score))

    return {
        "wpm": round(wpm, 2),
        "silence_ratio": round(silence_ratio, 4),
        "energy_confidence": round(energy_confidence, 4),
        "speech_delivery_score": round(delivery_score, 2)
    }
