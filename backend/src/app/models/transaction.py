from pydantic import Field, EmailStr
from typing import Optional
from datetime import datetime
from fastapi_camelcase import CamelModel

class TransactionBase(CamelModel):
    amount: float
    note: Optional[str] = None

class TransactionCreate(TransactionBase):
    receiver_email: Optional[EmailStr] = None

class TransactionInDB(TransactionBase):
    transaction_id: str
    sender_id: str
    sender_email: EmailStr
    sender_name: str
    receiver_id: Optional[str] = None
    receiver_email: Optional[EmailStr] = None
    receiver_name: Optional[str] = None
    status: str = "pending"  # pending, completed, cancelled
    created_at: datetime = Field(default_factory=datetime.now)
    expires_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

class Transaction(TransactionInDB):
    class Config:
        from_attributes = True

class TransactionResponse(Transaction):
    pass
