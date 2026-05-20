from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


# Auth Schemas
class UserRegister(BaseModel):
    email: EmailStr
    username: str
    full_name: Optional[str] = None
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class GoogleAuthRequest(BaseModel):
    token: str


class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict


class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    full_name: Optional[str]
    avatar_url: Optional[str]
    plan: str
    voice_credits: int
    is_verified: bool
    created_at: datetime

    class Config:
        from_attributes = True


# TTS Schemas
class TTSRequest(BaseModel):
    text: str
    language: str
    voice_type: str  # male, female, custom
    voice_name: Optional[str] = None
    speed: float = 1.0
    pitch: float = 0.0
    title: Optional[str] = None
    save_history: bool = True


class TTSResponse(BaseModel):
    success: bool
    audio_url: Optional[str]
    duration: Optional[float]
    history_id: Optional[int]
    message: str


# History Schemas
class HistoryResponse(BaseModel):
    id: int
    title: Optional[str]
    text_input: str
    language: str
    voice_type: str
    voice_name: Optional[str]
    speed: float
    pitch: float
    audio_file_path: Optional[str]
    duration_seconds: Optional[float]
    character_count: Optional[int]
    is_favorite: bool
    created_at: datetime

    class Config:
        from_attributes = True


# Settings Schema
class SettingsUpdate(BaseModel):
    default_language: Optional[str] = None
    default_voice_type: Optional[str] = None
    default_speed: Optional[float] = None
    default_pitch: Optional[float] = None
    theme: Optional[str] = None
    notifications_enabled: Optional[bool] = None
    auto_save_history: Optional[bool] = None
