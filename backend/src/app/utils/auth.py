from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext

from app.database.db import get_db, users_db
from app.models.user import User, TokenData

# 認證配置
SECRET_KEY = "your-secret-key-for-jwt-please-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24小時

# 密碼處理
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
# 使用 login 端點進行 Swagger UI 認證
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def verify_password(plain_password, hashed_password):
    """驗證密碼"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    """生成密碼哈希"""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """創建JWT訪問令牌"""
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

    return encoded_jwt

def decode_access_token(token: str):
    """解碼JWT訪問令牌"""
    try:
        print(f"解析令牌: {token[:10]}...（已截断）")
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        # 從JWT中獲取用戶標識和數據
        user_id: str = payload.get("sub")
        user_email: str = payload.get("email")  # 添加獲取email

        print(f"解析到用戶ID: {user_id}, Email: {user_email}")

        if user_id is None or user_email is None:
            print("缺少用戶ID或Email")
            return None, None, None

        # 檢查是否有用戶數據
        user_data = payload.get("user")
        if user_data:
            print(f"從令牌中找到用戶數據")
            return TokenData(user_id=user_id), user_email, user_data

        return TokenData(user_id=user_id), user_email, None
    except JWTError as e:
        print(f"JWT解析錯誤: {str(e)}")
        return None, None, None

async def get_current_user(token: str = Depends(oauth2_scheme)):
    """獲取當前已認證用戶"""
    print(f"嘗試獲取當前用戶，令牌長度: {len(token) if token else 0}")
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="認證失敗",
        headers={"WWW-Authenticate": "Bearer"},
    )

    token_data, user_email, user_data = decode_access_token(token)
    if token_data is None or user_email is None:
        print("令牌解析失敗，認證失敗")
        raise credentials_exception

    # 從數據庫中獲取用戶數據
    user = users_db.get(user_email)
    print(f"通過Email查找用戶: {user_email}, 結果: {'找到' if user else '未找到'}")
    if user is None:
        print("未找到用戶，認證失敗")
        raise credentials_exception

    print(f"獲取到最新的用戶餘額: {user.get('balance', 0)}")
    return User(**user)
