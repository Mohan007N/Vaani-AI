from sqlalchemy import create_engine, Column, Integer, String, DateTime, Boolean, Text, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os

DATABASE_URL = "sqlite:///./vaani.db"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=True)
    hashed_password = Column(String, nullable=True)
    google_id = Column(String, unique=True, nullable=True)
    avatar_url = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    plan = Column(String, default="free")  # free, daily, monthly, yearly
    voice_credits = Column(Integer, default=1000)
    credits_reset_at = Column(DateTime, default=datetime.utcnow)  # weekly reset tracker
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class VoiceHistory(Base):
    __tablename__ = "voice_history"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    title = Column(String, nullable=True)
    text_input = Column(Text, nullable=False)
    language = Column(String, nullable=False)
    voice_type = Column(String, nullable=False)  # male, female, custom
    voice_name = Column(String, nullable=True)
    speed = Column(Float, default=1.0)
    pitch = Column(Float, default=1.0)
    audio_file_path = Column(String, nullable=True)
    duration_seconds = Column(Float, nullable=True)
    character_count = Column(Integer, nullable=True)
    is_favorite = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class CustomVoice(Base):
    __tablename__ = "custom_voices"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    audio_sample_path = Column(String, nullable=True)
    is_trained = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class UserSettings(Base):
    __tablename__ = "user_settings"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, unique=True, nullable=False)
    default_language = Column(String, default="en-IN")
    default_voice_type = Column(String, default="female")
    default_speed = Column(Float, default=1.0)
    default_pitch = Column(Float, default=0)
    theme = Column(String, default="dark")
    notifications_enabled = Column(Boolean, default=True)
    auto_save_history = Column(Boolean, default=True)


class PaymentHistory(Base):
    __tablename__ = "payment_history"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    plan_id = Column(String, nullable=False)
    plan_name = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    payment_id = Column(String, nullable=False)
    status = Column(String, default="success")
    created_at = Column(DateTime, default=datetime.utcnow)

def create_tables():
    Base.metadata.create_all(bind=engine)
    # Add credits_reset_at column if it doesn't exist (SQLite migration)
    try:
        from sqlalchemy import text
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE users ADD COLUMN credits_reset_at DATETIME"))
            conn.commit()
    except Exception:
        pass  # Column already exists


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
