import uuid
from datetime import datetime, timedelta
from passlib.context import CryptContext
from fastapi import Depends

# 密碼加密工具
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# 內存數據庫 - 將users_db的key從user_id改為email
users_db = {}
transactions_db = {}

def init_db():
    """初始化測試數據"""
    print("初始化数据库...")
    if not users_db:
        print("创建测试用户数据...")
        # 創建一個測試用戶
        user_id = str(uuid.uuid4())
        test_email = "test@example.com"

        users_db[test_email] = {
            "user_id": user_id,
            "email": test_email,
            "name": "測試用戶",
            "hashed_password": pwd_context.hash("password123"),
            "balance": 1000,
            "created_at": datetime.now()
        }
        print(f"测试用户已创建: {users_db[test_email]}")

        # 創建一些測試交易
        transaction1_id = str(uuid.uuid4())
        transaction2_id = str(uuid.uuid4())

        transactions_db[transaction1_id] = {
            "transaction_id": transaction1_id,
            "amount": 100,
            "note": "測試交易1",
            "sender_id": user_id,
            "sender_email": test_email,  # 添加發送者email
            "sender_name": "測試用戶",
            "receiver_id": None,
            "receiver_email": None,  # 添加接收者email
            "receiver_name": None,
            "status": "pending",
            "created_at": datetime.now(),
            "expires_at": datetime.now() + timedelta(minutes=30),
            "completed_at": None
        }

        transactions_db[transaction2_id] = {
            "transaction_id": transaction2_id,
            "amount": 50,
            "note": "測試交易2",
            "sender_id": user_id,
            "sender_email": test_email,  # 添加發送者email
            "sender_name": "測試用戶",
            "receiver_id": "fake-receiver-id",
            "receiver_email": "fake@example.com",  # 添加接收者email
            "receiver_name": "假接收者",
            "status": "completed",
            "created_at": datetime.now() - timedelta(hours=1),
            "expires_at": None,
            "completed_at": datetime.now() - timedelta(minutes=30)
        }

def get_db():
    """獲取數據庫實例 (這裡僅用於保持與典型FastAPI應用一致的接口)"""
    init_db()  # 確保測試數據已加載
    return {"users": users_db, "transactions": transactions_db}
