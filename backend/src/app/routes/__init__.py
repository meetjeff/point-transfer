# 导入所有路由模块以便在应用启动时注册
from app.routes import auth, users, transactions

__all__ = ["auth", "users", "transactions"]
