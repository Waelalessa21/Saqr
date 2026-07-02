import logging
import random
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token, get_current_user
from app.modules.auth.models import User
from app.modules.auth.schemas import (
    SignupRequest,
    LoginRequest,
    AuthResponse,
    UserOut,
    SignupPendingResponse,
    VerifyOtpRequest,
    ResendOtpRequest,
    MessageResponse,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])
logger = logging.getLogger(__name__)

OTP_MINUTES = 10


def _generate_otp() -> str:
    return f"{random.randint(100000, 999999)}"


def _set_otp(user: User) -> str:
    code = _generate_otp()
    user.otp_code = code
    user.otp_expires_at = datetime.now(timezone.utc) + timedelta(minutes=OTP_MINUTES)
    logger.info("OTP for %s: %s", user.email, code)
    print(f"[Saqr OTP] {user.email}: {code}", flush=True)
    return code


def _clear_otp(user: User) -> None:
    user.otp_code = None
    user.otp_expires_at = None


@router.post("/signup", response_model=SignupPendingResponse, status_code=201)
def signup(body: SignupRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="البريد مستخدم بالفعل",
        )

    user = User(
        name=body.name.strip(),
        email=body.email,
        hashed_password=hash_password(body.password),
        referral=body.referral,
        email_verified=False,
    )
    _set_otp(user)
    db.add(user)
    db.commit()

    return SignupPendingResponse(email=user.email)


@router.post("/verify-otp", response_model=AuthResponse)
def verify_otp(body: VerifyOtpRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="الحساب غير موجود")

    if user.email_verified:
        token = create_access_token({"sub": str(user.id)})
        return AuthResponse(token=token, user=UserOut.model_validate(user))

    code = body.code.strip()
    if not user.otp_code or user.otp_code != code:
        raise HTTPException(status_code=400, detail="رمز التحقق غير صحيح")

    if not user.otp_expires_at or user.otp_expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="انتهت صلاحية رمز التحقق")

    user.email_verified = True
    _clear_otp(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id)})
    return AuthResponse(token=token, user=UserOut.model_validate(user))


@router.post("/resend-otp", response_model=MessageResponse)
def resend_otp(body: ResendOtpRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="الحساب غير موجود")

    if user.email_verified:
        return MessageResponse(message="البريد مُفعّل بالفعل")

    _set_otp(user)
    db.commit()
    return MessageResponse(message="تم إرسال رمز جديد")


@router.post("/login", response_model=AuthResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="البريد أو كلمة المرور غير صحيحة",
        )

    if not user.email_verified:
        _set_otp(user)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="verify_email",
        )

    token = create_access_token({"sub": str(user.id)})
    return AuthResponse(token=token, user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return UserOut.model_validate(user)
