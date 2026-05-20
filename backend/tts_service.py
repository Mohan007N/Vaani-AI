import asyncio
import edge_tts
import os
import uuid
import tempfile
from pathlib import Path
from typing import Optional

AUDIO_DIR = Path("audio_files")
AUDIO_DIR.mkdir(exist_ok=True)

# Complete Indian language voice mapping for edge-tts
VOICE_MAP = {
    "en-IN": {
        "male": "en-IN-PrabhatNeural",
        "female": "en-IN-NeerjaNeural",
        "name": "English (India)"
    },
    "hi-IN": {
        "male": "hi-IN-MadhurNeural",
        "female": "hi-IN-SwaraNeural",
        "name": "Hindi"
    },
    "ta-IN": {
        "male": "ta-IN-ValluvarNeural",
        "female": "ta-IN-PallaviNeural",
        "name": "Tamil"
    },
    "te-IN": {
        "male": "te-IN-MohanNeural",
        "female": "te-IN-ShrutiNeural",
        "name": "Telugu"
    },
    "mr-IN": {
        "male": "mr-IN-ManoharNeural",
        "female": "mr-IN-AarohiNeural",
        "name": "Marathi"
    },
    "kn-IN": {
        "male": "kn-IN-GaganNeural",
        "female": "kn-IN-SapnaNeural",
        "name": "Kannada"
    },
    "ml-IN": {
        "male": "ml-IN-MidhunNeural",
        "female": "ml-IN-SobhanaNeural",
        "name": "Malayalam"
    },
    "bn-IN": {
        "male": "bn-IN-BashkarNeural",
        "female": "bn-IN-TanishaaNeural",
        "name": "Bengali"
    },
    "gu-IN": {
        "male": "gu-IN-NiranjanNeural",
        "female": "gu-IN-DhwaniNeural",
        "name": "Gujarati"
    },
    "pa-IN": {
        "male": "pa-IN-OjasvNeural",
        "female": "pa-IN-VaaniNeural",
        "name": "Punjabi"
    },
    "ur-PK": {
        "male": "ur-PK-AsadNeural",
        "female": "ur-PK-UzmaNeural",
        "name": "Urdu"
    },
    "or-IN": {
        "male": "or-IN-SubasNeural",
        "female": "or-IN-SubasNeural",
        "name": "Odia"
    },
    "en-US": {
        "male": "en-US-GuyNeural",
        "female": "en-US-AriaNeural",
        "name": "English (US)"
    },
    "en-GB": {
        "male": "en-GB-RyanNeural",
        "female": "en-GB-SoniaNeural",
        "name": "English (UK)"
    },
}

def get_flag(lang_code: str) -> str:
    flags = {
        "en-IN": "🇮🇳", "hi-IN": "🇮🇳", "ta-IN": "🇮🇳", "te-IN": "🇮🇳",
        "mr-IN": "🇮🇳", "kn-IN": "🇮🇳", "ml-IN": "🇮🇳", "bn-IN": "🇮🇳",
        "gu-IN": "🇮🇳", "pa-IN": "🇮🇳", "ur-PK": "🇵🇰", "or-IN": "🇮🇳",
        "en-US": "🇺🇸", "en-GB": "🇬🇧"
    }
    return flags.get(lang_code, "🌐")


LANGUAGE_INFO = {
    lang: {
        "code": lang,
        "name": info["name"],
        "male_voice": info["male"],
        "female_voice": info["female"],
        "flag": get_flag(lang)
    }
    for lang, info in VOICE_MAP.items()
}

# Google Translate language codes mapping
TRANSLATE_LANG_CODES = {
    "en-IN": "en", "en-US": "en", "en-GB": "en",
    "hi-IN": "hi", "ta-IN": "ta", "te-IN": "te",
    "mr-IN": "mr", "kn-IN": "kn", "ml-IN": "ml",
    "bn-IN": "bn", "gu-IN": "gu", "pa-IN": "pa",
    "ur-PK": "ur", "or-IN": "or",
}


def speed_to_rate(speed: float) -> str:
    """Convert speed float (0.5-2.0) to edge-tts rate string"""
    percent = int((speed - 1.0) * 100)
    if percent >= 0:
        return f"+{percent}%"
    return f"{percent}%"


def pitch_to_hz(pitch: float) -> str:
    """Convert pitch float (-10 to +10) to edge-tts pitch string"""
    hz = int(pitch * 10)
    if hz >= 0:
        return f"+{hz}Hz"
    return f"{hz}Hz"


async def translate_text(text: str, source_lang: str, target_lang: str) -> str:
    """Translate text using Google Translate free API"""
    import httpx
    src = TRANSLATE_LANG_CODES.get(source_lang, "auto")
    tgt = TRANSLATE_LANG_CODES.get(target_lang, "en")
    
    if src == tgt:
        return text
    
    try:
        url = "https://translate.googleapis.com/translate_a/single"
        params = {
            "client": "gtx",
            "sl": src,
            "tl": tgt,
            "dt": "t",
            "q": text,
        }
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(url, params=params)
            if resp.status_code == 200:
                data = resp.json()
                translated = ""
                for sentence in data[0]:
                    if sentence[0]:
                        translated += sentence[0]
                return translated
    except Exception as e:
        print(f"Translation error: {e}")
    
    return text  # fallback to original


async def generate_speech(
    text: str,
    language: str,
    voice_type: str,
    voice_name: Optional[str] = None,
    speed: float = 1.0,
    pitch: float = 0.0,
    user_id: Optional[int] = None
) -> dict:
    """Generate speech using edge-tts"""
    try:
        # Get voice name
        if voice_name:
            voice = voice_name
        elif language in VOICE_MAP:
            voice = VOICE_MAP[language].get(voice_type, VOICE_MAP[language]["female"])
        else:
            voice = "en-IN-NeerjaNeural"

        rate = speed_to_rate(speed)
        pitch_str = pitch_to_hz(pitch)
        
        # Generate unique filename
        filename = f"{uuid.uuid4()}.mp3"
        filepath = AUDIO_DIR / filename
        
        # Generate audio using edge-tts 7.x API
        communicate = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch_str)
        await communicate.save(str(filepath))
        
        # Get duration
        duration = await get_audio_duration(str(filepath))
        
        return {
            "success": True,
            "file_path": str(filepath),
            "filename": filename,
            "duration": duration,
            "voice_used": voice,
            "message": "Speech generated successfully"
        }
    except Exception as e:
        return {
            "success": False,
            "file_path": None,
            "filename": None,
            "duration": 0,
            "voice_used": None,
            "message": f"Error generating speech: {str(e)}"
        }


async def get_audio_duration(filepath: str) -> float:
    """Get audio duration in seconds"""
    try:
        from pydub import AudioSegment
        audio = AudioSegment.from_file(filepath)
        return len(audio) / 1000.0
    except Exception:
        return 0.0


async def list_available_voices() -> list:
    """List all available edge-tts voices"""
    try:
        voices = await edge_tts.list_voices()
        indian_voices = [v for v in voices if any(
            lang in v["ShortName"] for lang in ["hi-IN", "ta-IN", "te-IN", "mr-IN", "kn-IN", "ml-IN", "bn-IN", "gu-IN", "pa-IN", "en-IN"]
        )]
        return indian_voices
    except Exception:
        return []
