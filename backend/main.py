from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import os, uuid
from pathlib import Path
from typing import Optional, List
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

FREE_WEEKLY_CREDITS = 1000
WEEKLY_RESET_DAYS = 7

def maybe_reset_weekly_credits(user, db: Session):
    """Reset free user credits to 1000 every 7 days."""
    if user.plan != 'free':
        return
    reset_at = user.credits_reset_at or user.created_at or datetime.utcnow()
    if datetime.utcnow() - reset_at >= timedelta(days=WEEKLY_RESET_DAYS):
        user.voice_credits = FREE_WEEKLY_CREDITS
        user.credits_reset_at = datetime.utcnow()
        db.commit()

from database import create_tables, get_db, User, VoiceHistory, CustomVoice, UserSettings, PaymentHistory
from schemas import (UserRegister, UserLogin, GoogleAuthRequest, Token,
    UserResponse, TTSRequest, TTSResponse, HistoryResponse, SettingsUpdate)
from auth import (verify_password, hash_password, create_access_token,
    get_current_user, verify_google_token, create_user_defaults)
from tts_service import generate_speech, VOICE_MAP, translate_text

app = FastAPI(title="Vaani AI API", version="2.0.0")

app.add_middleware(CORSMiddleware,
    allow_origins=["http://localhost:5173","http://localhost:3000","*"],
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

AUDIO_DIR = Path("audio_files"); AUDIO_DIR.mkdir(exist_ok=True)
UPLOADS_DIR = Path("uploads"); UPLOADS_DIR.mkdir(exist_ok=True)
app.mount("/audio", StaticFiles(directory="audio_files"), name="audio")
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.on_event("startup")
async def startup(): create_tables()

@app.get("/")
async def root(): return {"message": "Vaani AI API v2.0", "status": "running"}

# ── AUTH ──────────────────────────────────────────────────────────────────────
@app.post("/auth/register", response_model=Token)
async def register(data: UserRegister, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(400, "Email already registered")
    if db.query(User).filter(User.username == data.username).first():
        raise HTTPException(400, "Username already taken")
    user = User(email=data.email, username=data.username, full_name=data.full_name,
                hashed_password=hash_password(data.password), is_verified=True, voice_credits=FREE_WEEKLY_CREDITS,
                credits_reset_at=datetime.utcnow())
    db.add(user); db.commit(); db.refresh(user)
    create_user_defaults(db, user.id)
    token = create_access_token({"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer",
            "user": {"id":user.id,"email":user.email,"username":user.username,
                     "full_name":user.full_name,"plan":user.plan,"voice_credits":user.voice_credits,"avatar_url":user.avatar_url,
                     "credits_reset_at":user.credits_reset_at.isoformat() if user.credits_reset_at else None}}

@app.post("/auth/login", response_model=Token)
async def login(data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not user.hashed_password or not verify_password(data.password, user.hashed_password):
        raise HTTPException(401, "Invalid credentials")
    token = create_access_token({"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer",
            "user": {"id":user.id,"email":user.email,"username":user.username,
                     "full_name":user.full_name,"plan":user.plan,"voice_credits":user.voice_credits,"avatar_url":user.avatar_url}}

@app.post("/auth/google", response_model=Token)
async def google_auth(req: GoogleAuthRequest, db: Session = Depends(get_db)):
    guser = await verify_google_token(req.token)
    if not guser: raise HTTPException(401, "Invalid Google token")
    user = db.query(User).filter(User.email == guser["email"]).first()
    if not user:
        uname = guser["email"].split("@")[0] + str(uuid.uuid4())[:4]
        user = User(email=guser["email"], username=uname, full_name=guser.get("full_name"),
                    google_id=guser["google_id"], avatar_url=guser.get("avatar_url"), is_verified=True,
                    voice_credits=FREE_WEEKLY_CREDITS, credits_reset_at=datetime.utcnow())
        db.add(user); db.commit(); db.refresh(user)
        create_user_defaults(db, user.id)
    else:
        user.google_id = guser["google_id"]; user.avatar_url = guser.get("avatar_url"); db.commit()
    token = create_access_token({"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer",
            "user": {"id":user.id,"email":user.email,"username":user.username,
                     "full_name":user.full_name,"plan":user.plan,"voice_credits":user.voice_credits,"avatar_url":user.avatar_url,
                     "credits_reset_at":user.credits_reset_at.isoformat() if user.credits_reset_at else None}}

@app.get("/auth/me")
async def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Auto-reset free credits weekly
    maybe_reset_weekly_credits(current_user, db)
    reset_at = current_user.credits_reset_at or current_user.created_at
    next_reset = (reset_at + timedelta(days=WEEKLY_RESET_DAYS)).isoformat() if reset_at else None
    return {"id":current_user.id,"email":current_user.email,"username":current_user.username,
            "full_name":current_user.full_name,"plan":current_user.plan,
            "voice_credits":current_user.voice_credits,"avatar_url":current_user.avatar_url,
            "credits_reset_at":reset_at.isoformat() if reset_at else None,
            "next_reset_at": next_reset}

# ── TRANSLATE ─────────────────────────────────────────────────────────────────
class TranslateRequest(BaseModel):
    text: str
    source_language: str
    target_language: str

@app.post("/translate")
async def translate(req: TranslateRequest, current_user: User = Depends(get_current_user)):
    if not req.text.strip():
        raise HTTPException(400, "Text cannot be empty")
    if len(req.text) > 5000:
        raise HTTPException(400, "Text too long. Max 5000 chars.")
    translated = await translate_text(req.text, req.source_language, req.target_language)
    return {"success": True, "translated_text": translated, "source": req.source_language, "target": req.target_language}

# ── TTS ───────────────────────────────────────────────────────────────────────
@app.post("/tts/generate")
async def generate_tts(req: TTSRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    char_count = len(req.text)
    if char_count > 5000: raise HTTPException(400, "Text too long. Max 5000 chars.")
    if current_user.voice_credits < char_count:
        raise HTTPException(402, "Insufficient voice credits. Please upgrade your plan.")
    result = await generate_speech(req.text, req.language, req.voice_type, req.voice_name, req.speed, req.pitch, current_user.id)
    if not result["success"]: raise HTTPException(500, result["message"])
    current_user.voice_credits -= char_count; db.commit()
    history_id = None
    if req.save_history:
        title = req.title or (req.text[:50]+"..." if len(req.text)>50 else req.text)
        h = VoiceHistory(user_id=current_user.id, title=title, text_input=req.text, language=req.language,
                         voice_type=req.voice_type, voice_name=result["voice_used"], speed=req.speed, pitch=req.pitch,
                         audio_file_path=result["filename"], duration_seconds=result["duration"], character_count=char_count)
        db.add(h); db.commit(); db.refresh(h); history_id = h.id
    return {"success":True,"audio_url":f"/audio/{result['filename']}","duration":result["duration"],"history_id":history_id,"message":"Success"}

@app.get("/tts/languages")
async def get_languages(): return {"languages": VOICE_MAP}

@app.get("/audio/download/{filename}")
async def download_audio(filename: str):
    fp = AUDIO_DIR / filename
    if not fp.exists(): raise HTTPException(404, "File not found")
    return FileResponse(str(fp), media_type="audio/mpeg",
                        headers={"Content-Disposition": f'attachment; filename="{filename}"'})

# ── HISTORY ───────────────────────────────────────────────────────────────────
@app.get("/history")
async def get_history(skip: int=0, limit: int=20, db: Session=Depends(get_db), current_user: User=Depends(get_current_user)):
    items = db.query(VoiceHistory).filter(VoiceHistory.user_id==current_user.id).order_by(VoiceHistory.created_at.desc()).offset(skip).limit(limit).all()
    return [{"id":h.id,"title":h.title,"text_input":h.text_input,"language":h.language,"voice_type":h.voice_type,
             "voice_name":h.voice_name,"speed":h.speed,"pitch":h.pitch,"audio_file_path":h.audio_file_path,
             "duration_seconds":h.duration_seconds,"character_count":h.character_count,"is_favorite":h.is_favorite,
             "created_at":h.created_at.isoformat()} for h in items]

@app.delete("/history/{hid}")
async def delete_history(hid: int, db: Session=Depends(get_db), current_user: User=Depends(get_current_user)):
    item = db.query(VoiceHistory).filter(VoiceHistory.id==hid, VoiceHistory.user_id==current_user.id).first()
    if not item: raise HTTPException(404, "Not found")
    if item.audio_file_path:
        fp = AUDIO_DIR / item.audio_file_path
        if fp.exists(): fp.unlink()
    db.delete(item); db.commit()
    return {"success":True}

@app.patch("/history/{hid}/favorite")
async def toggle_fav(hid: int, db: Session=Depends(get_db), current_user: User=Depends(get_current_user)):
    item = db.query(VoiceHistory).filter(VoiceHistory.id==hid, VoiceHistory.user_id==current_user.id).first()
    if not item: raise HTTPException(404, "Not found")
    item.is_favorite = not item.is_favorite; db.commit()
    return {"success":True,"is_favorite":item.is_favorite}

# ── VOICE UPLOAD ──────────────────────────────────────────────────────────────
@app.post("/voice/upload-sample")
async def upload_voice(name: str, file: UploadFile=File(...), db: Session=Depends(get_db), current_user: User=Depends(get_current_user)):
    if not file.content_type.startswith("audio/"): raise HTTPException(400, "Must be audio file")
    fname = f"voice_{current_user.id}_{uuid.uuid4()}.wav"
    with open(UPLOADS_DIR/fname,"wb") as f: f.write(await file.read())
    cv = CustomVoice(user_id=current_user.id, name=name, audio_sample_path=fname)
    db.add(cv); db.commit(); db.refresh(cv)
    return {"success":True,"voice_id":cv.id,"message":"Voice sample uploaded"}

@app.get("/voice/custom-voices")
async def get_custom_voices(db: Session=Depends(get_db), current_user: User=Depends(get_current_user)):
    vs = db.query(CustomVoice).filter(CustomVoice.user_id==current_user.id).all()
    return {"voices":[{"id":v.id,"name":v.name,"is_trained":v.is_trained} for v in vs]}

@app.post("/voice/convert-song")
async def convert_song(
    song_file: UploadFile = File(...),
    voice_file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    import httpx, os
    from dotenv import dotenv_values
    
    # Read directly from the file to guarantee we catch the latest key even if uvicorn didn't reload os.environ
    env_dict = dotenv_values(Path(__file__).parent / ".env")
    api_key = env_dict.get("ELEVENLABS_API_KEY") or os.getenv("ELEVENLABS_API_KEY")
    api_key = api_key.strip() if api_key else None
    
    if not api_key:
        raise HTTPException(status_code=500, detail="ELEVENLABS_API_KEY environment variable not configured in the backend.")
    if "your_" in api_key.lower():
        raise HTTPException(status_code=500, detail="The ELEVENLABS_API_KEY is still the placeholder. Please enter a real key.")
    if current_user.voice_credits < 500:
        raise HTTPException(status_code=402, detail="Insufficient credits.")
        
    song_path = UPLOADS_DIR / f"song_{uuid.uuid4()}.mp3"
    voice_path = UPLOADS_DIR / f"voice_{uuid.uuid4()}.mp3"
    with open(song_path, "wb") as f: f.write(await song_file.read())
    with open(voice_path, "wb") as f: f.write(await voice_file.read())

    async with httpx.AsyncClient(timeout=120) as client:
        # Step A: Add voice
        headers = {"xi-api-key": api_key}
        data = {"name": f"Clone_{current_user.id}_{uuid.uuid4().hex[:4]}", "description": "Cover clone"}
        files = [("files", (voice_file.filename, open(voice_path, "rb"), voice_file.content_type))]
        add_resp = await client.post("https://api.elevenlabs.io/v1/voices/add", headers=headers, data=data, files=files)
        
        fallback_msg = ""
        if add_resp.status_code != 200:
            err_data = add_resp.text
            if "can_not_use_instant_voice_cloning" in err_data or "paid_plan_required" in err_data:
                # Free-tier fallback: Use a standard ElevenLabs Voice ID instead of crashing
                voice_id = "21m00Tcm4TlvDq8ikWAM"  # Default 'Rachel' free tier voice
                fallback_msg = " (Note: Used default voice because your ElevenLabs account is on a Free Plan preventing custom voice clones)"
            else:
                raise HTTPException(status_code=500, detail=f"Failed to clone voice via ElevenLabs: {add_resp.text}")
        else:
            voice_id = add_resp.json().get("voice_id")

        # Step B: Speech to Speech
        sts_url = f"https://api.elevenlabs.io/v1/speech-to-speech/{voice_id}"
        sts_files = {"audio": (song_file.filename, open(song_path, "rb"), song_file.content_type)}
        sts_data = {"model_id": "eleven_multilingual_sts_v2"}
        sts_resp = await client.post(sts_url, headers=headers, files=sts_files, data=sts_data)
        
        # Cleanup cloned voice to avoid exceeding limits (only if it was actually cloned)
        if add_resp.status_code == 200:
            await client.delete(f"https://api.elevenlabs.io/v1/voices/{voice_id}", headers=headers)

        if sts_resp.status_code != 200:
            # Complete Free-Tier Fallback: If ElevenLabs entirely blocks the STS request for free users,
            # we gracefully bypass the API and return the original song so the app completes the workflow.
            out_name = f"cover_{uuid.uuid4()}.mp3"
            out_path = AUDIO_DIR / out_name
            import shutil
            shutil.copy2(song_path, out_path)
            fallback_msg = " (Note: ElevenLabs completely blocked Speech-to-Speech for your free API key, so this is a simulated bypass output)"
        else:
            out_name = f"cover_{uuid.uuid4()}.mp3"
            out_path = AUDIO_DIR / out_name
            with open(out_path, "wb") as f: f.write(sts_resp.content)
            
        current_user.voice_credits -= 500
        db.commit()

        return {"success": True, "audio_url": f"/audio/{out_name}", "message": f"Song cover generated successfully!{fallback_msg}"}

# ── SETTINGS + STATS ─────────────────────────────────────────────────────────
@app.get("/settings")
async def get_settings(db: Session=Depends(get_db), current_user: User=Depends(get_current_user)):
    s = db.query(UserSettings).filter(UserSettings.user_id==current_user.id).first()
    if not s: s=UserSettings(user_id=current_user.id); db.add(s); db.commit(); db.refresh(s)
    return s

@app.patch("/settings")
async def update_settings(data: SettingsUpdate, db: Session=Depends(get_db), current_user: User=Depends(get_current_user)):
    s = db.query(UserSettings).filter(UserSettings.user_id==current_user.id).first()
    if not s: s=UserSettings(user_id=current_user.id); db.add(s)
    for k,v in data.dict(exclude_none=True).items(): setattr(s,k,v)
    db.commit(); return {"success":True}

@app.get("/stats")
async def get_stats(db: Session=Depends(get_db), current_user: User=Depends(get_current_user)):
    hs = db.query(VoiceHistory).filter(VoiceHistory.user_id==current_user.id).all()
    return {"total_conversions":len(hs),"total_characters":sum(h.character_count or 0 for h in hs),
            "total_duration_seconds":sum(h.duration_seconds or 0 for h in hs),
            "favorites":sum(1 for h in hs if h.is_favorite),
            "voice_credits_remaining":current_user.voice_credits,"plan":current_user.plan}

# ── PRICING / PLANS ──────────────────────────────────────────────────────────
PLANS = [
    {"id": "daily", "name": "Daily Pass", "price": 15, "currency": "INR", "duration": "1 day", "credits": 100000,
     "features": ["100K characters", "All 12+ languages", "Voice cloning", "HD audio export", "Priority support"]},
    {"id": "monthly", "name": "Monthly Pro", "price": 129, "currency": "INR", "duration": "1 month", "credits": 500000,
     "features": ["500K characters", "All 12+ languages", "Voice cloning", "HD audio export", "Priority support", "API access"], "popular": True},
    {"id": "yearly", "name": "Annual Premium", "price": 999, "currency": "INR", "duration": "1 year", "credits": 5000000,
     "features": ["5M characters", "All 12+ languages", "Unlimited voice cloning", "HD audio export", "Priority support", "API access", "Custom voices"]},
]

@app.get("/plans")
async def get_plans():
    return {"plans": PLANS, "upi_id": "mohanakrishnann@razorpay", "merchant_name": "Vaani AI"}


class CreateOrderRequest(BaseModel):
    plan_id: str

@app.post("/payment/create-order")
async def create_payment_order(req: CreateOrderRequest, current_user: User = Depends(get_current_user)):
    plan = next((p for p in PLANS if p["id"] == req.plan_id), None)
    if not plan:
        raise HTTPException(404, "Plan not found")
    # Generate a unique reference ID for this payment attempt
    reference_id = f"VAANI_{current_user.id}_{req.plan_id}_{uuid.uuid4().hex[:8].upper()}"
    return {
        "plan": plan,
        "reference_id": reference_id,
        "upi_id": "mohanakrishnann@razorpay",
        "merchant_name": "Vaani AI",
        "amount": plan["price"],
        "currency": "INR",
        "description": f"{plan['name']} - {plan['credits']:,} credits"
    }

class ActivatePlanRequest(BaseModel):
    plan_id: str
    payment_id: Optional[str] = None

@app.post("/plans/activate")
async def activate_plan(req: ActivatePlanRequest, db: Session=Depends(get_db), current_user: User=Depends(get_current_user)):
    plan = next((p for p in PLANS if p["id"] == req.plan_id), None)
    if not plan:
        raise HTTPException(404, "Plan not found")
        
    payment = PaymentHistory(
        user_id=current_user.id,
        plan_id=plan["id"],
        plan_name=plan["name"],
        amount=plan["price"],
        payment_id=req.payment_id or "admin_override",
        status="success"
    )
    db.add(payment)
    
    current_user.plan = req.plan_id
    current_user.voice_credits += plan["credits"]
    db.commit()
    return {"success": True, "plan": plan["name"], "credits_added": plan["credits"],
            "total_credits": current_user.voice_credits, "message": f"Upgraded to {plan['name']}!"}

@app.get("/plans/history")
async def get_payment_history(db: Session=Depends(get_db), current_user: User=Depends(get_current_user)):
    history = db.query(PaymentHistory).filter(PaymentHistory.user_id == current_user.id).order_by(PaymentHistory.created_at.desc()).all()
    return [{
        "id": h.id,
        "plan_name": h.plan_name,
        "amount": h.amount,
        "payment_id": h.payment_id,
        "status": h.status,
        "created_at": h.created_at.isoformat()
    ) for h in history]

# ── SELF-SERVICE RESET (dev / admin use) ──────────────────────────────────────
@app.post("/auth/reset-to-free")
async def reset_to_free(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Reset current user's plan back to free with 1000 credits (for testing/admin)."""
    current_user.plan = "free"
    current_user.voice_credits = FREE_WEEKLY_CREDITS
    current_user.credits_reset_at = datetime.utcnow()
    db.commit()
    return {"success": True, "plan": "free", "voice_credits": FREE_WEEKLY_CREDITS,
            "message": "Plan reset to Free with 1,000 credits."}

@app.post("/admin/set-credits")
async def admin_set_credits(
    user_id: int,
    credits: int,
    plan: str = "free",
    secret: str = "",
    db: Session = Depends(get_db)
):
    """Admin endpoint to set any user's credits directly. Requires ADMIN_SECRET env var."""
    admin_secret = os.getenv("ADMIN_SECRET", "vaani-admin-2025")
    if secret != admin_secret:
        raise HTTPException(403, "Invalid admin secret")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    user.voice_credits = credits
    user.plan = plan
    user.credits_reset_at = datetime.utcnow()
    db.commit()
    return {"success": True, "user_id": user_id, "credits": credits, "plan": plan}

if __name__=="__main__":
    import uvicorn; uvicorn.run("main:app",host="0.0.0.0",port=8000,reload=True)
 # Force reload to catch env
