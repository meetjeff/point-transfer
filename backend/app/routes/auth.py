import uuid
from datetime import timedelta, datetime
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel

from app.models.user import User, UserCreate, UserInDB, Token
from app.database.db import get_db, users_db
from app.utils.auth import verify_password, get_password_hash, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES


router = APIRouter()

# 為 Swagger UI 認證創建的簡化令牌模型
class OAuth2Token(BaseModel):
    access_token: str
    token_type: str

@router.post("/register", response_model=User, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate):
    """Register a new user"""
    # Check if email already exists
    if user_data.email in users_db:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This email has already been registered"
        )

    # Create new user
    user_id = str(uuid.uuid4())
    hashed_password = get_password_hash(user_data.password)

    user_in_db = UserInDB(
        user_id=user_id,
        email=user_data.email,
        name=user_data.name,
        hashed_password=hashed_password,
        balance=100  # New users get 100 points initial balance
    )

    # Store user data using email as key
    users_db[user_data.email] = user_in_db.dict()

    return User(**users_db[user_data.email])

@router.post("/login", response_model=OAuth2Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """用戶登錄 - 符合 OAuth2 規範的令牌返回"""
    email = form_data.username
    # 直接使用email作為key查找用戶
    user = users_db.get(email)

    # 输出调试信息
    print(f"Login attempt: {email}, {form_data.password}")
    print(f"Found user: {user}")

    # Validate user and password
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email or password is incorrect",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 準備用戶數據（移除敏感信息）
    user_data = {
        "user_id": user["user_id"],
        "email": user["email"],
        "name": user["name"],
        "balance": user["balance"],
        "created_at": user["created_at"].isoformat() if isinstance(user["created_at"], datetime) else user["created_at"]
    }

    # Create access token with user data and email
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={
            "sub": user["user_id"],
            "email": user["email"],  # 將email也包含在JWT中
            "user": user_data
        },
        expires_delta=access_token_expires
    )

    # 返回符合 OAuth2 規範的令牌信息
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }
