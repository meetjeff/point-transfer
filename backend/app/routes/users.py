from fastapi import APIRouter, Depends, HTTPException, status
from typing import List

from app.models.user import User
from app.models.transaction import Transaction
from app.database.db import get_db, users_db, transactions_db
from app.utils.auth import get_current_user

router = APIRouter()

@router.get("/me", response_model=User)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """獲取當前用戶信息"""
    return current_user

@router.get("/me/transactions", response_model=List[Transaction])
async def get_current_user_transactions(current_user: User = Depends(get_current_user)):
    """獲取當前用戶的交易歷史"""
    user_transactions = []

    # 查找所有與當前用戶相關的交易
    for tx in transactions_db.values():
        if tx["sender_id"] == current_user.user_id or tx["receiver_id"] == current_user.user_id:
            user_transactions.append(Transaction(**tx))

    # 按時間倒序排序
    user_transactions.sort(key=lambda x: x.created_at, reverse=True)

    return user_transactions
