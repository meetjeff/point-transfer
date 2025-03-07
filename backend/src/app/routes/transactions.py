import uuid
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List

from app.models.user import User
from app.models.transaction import Transaction, TransactionCreate, TransactionResponse
from app.database.db import get_db, users_db, transactions_db
from app.utils.auth import get_current_user, get_password_hash

router = APIRouter()

@router.get("/", response_model=List[Transaction])
async def get_transactions(current_user: User = Depends(get_current_user)):
    """獲取交易列表"""
    user_transactions = []

    for tx in transactions_db.values():
        if tx.get("sender_id") == current_user.user_id or tx.get("receiver_id") == current_user.user_id:
            user_transactions.append(Transaction(**tx))

    return user_transactions

@router.get("/{transaction_id}", response_model=Transaction)
async def get_transaction(transaction_id: str):
    """獲取指定交易詳情"""
    if transaction_id not in transactions_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="交易不存在"
        )

    return Transaction(**transactions_db[transaction_id])

@router.post("/prepare", response_model=Transaction, status_code=status.HTTP_201_CREATED)
async def prepare_transaction(
    transaction_data: TransactionCreate,
    current_user: User = Depends(get_current_user)
):
    """準備交易 (創建待接收的交易)"""
    # 檢查餘額是否充足
    user = users_db.get(current_user.email)
    if not user or user["balance"] < transaction_data.amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="餘額不足"
        )

    # 檢查交易金額是否有效
    if transaction_data.amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="交易金額必須大於0"
        )

    # 如果提供了接收方email，則檢查接收方用戶是否存在
    receiver_id = None
    receiver_name = None
    receiver_email = transaction_data.receiver_email

    if receiver_email:
        # 直接使用email作為key查找接收方用戶
        receiver = users_db.get(receiver_email)
        if not receiver:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"未找到接收方用戶: {receiver_email}"
            )
        receiver_id = receiver["user_id"]
        receiver_name = receiver["name"]

    # 創建交易
    transaction_id = str(uuid.uuid4())

    # 設置過期時間（30分鐘）
    expires_at = datetime.now() + timedelta(minutes=30)

    new_transaction = {
        "transaction_id": transaction_id,
        "amount": transaction_data.amount,
        "note": transaction_data.note,
        "sender_id": current_user.user_id,
        "sender_email": current_user.email,
        "sender_name": current_user.name,
        "receiver_id": receiver_id,
        "receiver_email": receiver_email,
        "receiver_name": receiver_name,
        "status": "pending",
        "created_at": datetime.now(),
        "expires_at": expires_at,
        "completed_at": None
    }

    # 暫時扣除用戶餘額
    user["balance"] -= transaction_data.amount

    # 存儲交易
    transactions_db[transaction_id] = new_transaction

    return Transaction(**new_transaction)

@router.post("/{transaction_id}/confirm", response_model=Transaction)
async def confirm_transaction(
    transaction_id: str,
    current_user: User = Depends(get_current_user)
):
    """確認接收交易"""
    # 檢查交易是否存在
    if transaction_id not in transactions_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="交易不存在"
        )

    transaction = transactions_db[transaction_id]

    # 檢查交易狀態
    if transaction["status"] != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="交易已處理"
        )

    # 檢查交易是否過期
    if transaction["expires_at"] and datetime.now() > transaction["expires_at"]:
        transaction["status"] = "cancelled"
        # 退還發送者餘額
        sender_email = transaction["sender_email"]
        sender = users_db.get(sender_email)
        if sender:
            sender["balance"] += transaction["amount"]

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="交易已過期"
        )

    # 如果交易已有指定的接收方，檢查當前用戶是否為指定的接收方
    if transaction["receiver_email"] and transaction["receiver_email"] != current_user.email:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="您不是該交易的指定接收方"
        )

    # 更新交易接收者信息
    transaction["receiver_id"] = current_user.user_id
    transaction["receiver_email"] = current_user.email
    transaction["receiver_name"] = current_user.name
    transaction["status"] = "completed"
    transaction["completed_at"] = datetime.now()

    # 更新接收者餘額
    receiver = users_db.get(current_user.email)
    if not receiver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用戶不存在"
        )

    receiver["balance"] += transaction["amount"]

    # 更新交易記錄
    transactions_db[transaction_id] = transaction

    return Transaction(**transaction)

@router.post("/{transaction_id}/cancel", response_model=Transaction)
async def cancel_transaction(
    transaction_id: str,
    current_user: User = Depends(get_current_user)
):
    """取消交易"""
    # 檢查交易是否存在
    if transaction_id not in transactions_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="交易不存在"
        )

    transaction = transactions_db[transaction_id]

    # 檢查是否是發送者 - 使用email比較
    if transaction["sender_email"] != current_user.email:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="只有發送者可以取消交易"
        )

    # 檢查交易狀態
    if transaction["status"] != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="只能取消待處理的交易"
        )

    # 更新交易狀態
    transaction["status"] = "cancelled"
    transaction["completed_at"] = datetime.now()

    # 退還發送者餘額
    sender = users_db.get(current_user.email)
    if sender:
        sender["balance"] += transaction["amount"]

    # 更新交易記錄
    transactions_db[transaction_id] = transaction

    return Transaction(**transaction)

# 添加公共交易路由
@router.get("/public/{transaction_id}", response_model=Transaction)
async def get_public_transaction(transaction_id: str):
    """公共API: 獲取指定交易詳情，無需認證"""
    if transaction_id not in transactions_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="交易不存在"
        )

    transaction = transactions_db[transaction_id]

    # 檢查交易是否過期
    if transaction["expires_at"] and datetime.now() > transaction["expires_at"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="交易已過期"
        )

    return Transaction(**transaction)

@router.post("/public/{transaction_id}/confirm", response_model=Transaction)
async def confirm_public_transaction(
    transaction_id: str,
    request: dict
):
    """公共API: 確認接收交易，無需認證"""
    # 從請求體中獲取接收者email和用戶名
    receiver_email = request.get("email")
    receiver_name = request.get("name")

    if not receiver_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="缺少接收者email"
        )

    # 檢查交易是否存在
    if transaction_id not in transactions_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="交易不存在"
        )

    transaction = transactions_db[transaction_id]

    # 檢查交易狀態
    if transaction["status"] != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="交易已處理"
        )

    # 檢查交易是否過期
    if transaction["expires_at"] and datetime.now() > transaction["expires_at"]:
        transaction["status"] = "cancelled"
        # 退還發送者餘額
        sender_email = transaction["sender_email"]
        sender = users_db.get(sender_email)
        if sender:
            sender["balance"] += transaction["amount"]

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="交易已過期"
        )

    # 如果交易已有指定的接收方，檢查提供的email是否匹配
    if transaction["receiver_email"] and transaction["receiver_email"] != receiver_email:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="您不是該交易的指定接收方"
        )

    # 查找接收方用戶
    receiver = users_db.get(receiver_email)

    # 如果沒有找到用戶，返回錯誤
    if not receiver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="user_not_found"
        )

    # 更新交易信息
    transaction["status"] = "completed"
    transaction["receiver_id"] = receiver["user_id"]
    transaction["receiver_email"] = receiver_email
    transaction["receiver_name"] = receiver_name
    transaction["completed_at"] = datetime.now()

    # 更新接收者餘額
    receiver["balance"] += transaction["amount"]

    # 更新交易記錄
    transactions_db[transaction_id] = transaction

    return Transaction(**transaction)
