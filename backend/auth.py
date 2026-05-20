from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
import bcrypt
from fastapi import HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from database import get_db, User, UserSettings
import os
import httpx

SECRET_KEY = os.getenv("SECRET_KEY", "vaani-ai-super-secret-key-change-in-production-2024")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24 * 7  # 7 days

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login", auto_error=False)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False


def hash_password(password: str) -> str:
    # rounds=10 is faster than default 12 while still secure for this use case
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt(rounds=10)).decode('utf-8')



def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception
    payload = decode_token(token)
    if not payload:
        raise credentials_exception
    user_id: int = payload.get("sub")
    if not user_id:
        raise credentials_exception
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise credentials_exception
    return user


async def verify_google_token(token: str) -> Optional[dict]:
    """Verify Google OAuth access_token via userinfo endpoint and return user info.
    Works with @react-oauth/google useGoogleLogin which returns an access_token."""
    try:
        async with httpx.AsyncClient() as client:
            # Primary: use access_token with userinfo endpoint
            response = await client.get(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {token}"}
            )
            if response.status_code == 200:
                data = response.json()
                return {
                    "google_id": data.get("sub"),
                    "email": data.get("email"),
                    "full_name": data.get("name"),
                    "avatar_url": data.get("picture"),
                    "is_verified": data.get("email_verified", False)
                }
            # Fallback: try tokeninfo for id_token flow
            response2 = await client.get(
                f"https://oauth2.googleapis.com/tokeninfo?id_token={token}"
            )
            if response2.status_code == 200:
                data = response2.json()
                return {
                    "google_id": data.get("sub"),
                    "email": data.get("email"),
                    "full_name": data.get("name"),
                    "avatar_url": data.get("picture"),
                    "is_verified": data.get("email_verified") == "true"
                }
    except Exception as e:
        print(f"Google token verification error: {e}")
    return None


def create_user_defaults(db: Session, user_id: int):
    """Create default settings for new user"""
    settings = UserSettings(user_id=user_id)
    db.add(settings)
    db.commit()
