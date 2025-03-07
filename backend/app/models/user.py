from pydantic import EmailStr, Field
from typing import Optional
from datetime import datetime
from fastapi_camelcase import CamelModel

class UserBase(CamelModel):
    email: EmailStr
    name: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    user_id: str
    balance: float = 0
    created_at: datetime = Field(default_factory=datetime.now)

    class Config:
        from_attributes = True

class UserInDB(User):
    hashed_password: str

class Token(CamelModel):
    access_token: str
    token_type: str
    user: User

class TokenData(CamelModel):
    user_id: Optional[str] = None
