import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.docs import get_swagger_ui_html
from fastapi.openapi.utils import get_openapi

from app.routes import auth, users, transactions
from app.database.db import init_db

# 初始化測試數據
init_db()

# 創建FastAPI應用
app = FastAPI(
    title="點數交易系統 API",
    description="點數交易系統後端API，支持用戶註冊、登入、發送和接收點數等功能\n\n"
               "**認證流程**:\n"
               "1. 點擊右上角的 'Authorize' 按鈕\n"
               "2. 在彈出的對話框中輸入用戶信箱(test@example.com)和密碼(password123)\n"
               "3. 點擊 'Authorize' 完成認證\n"
               "4. 完成認證後，可以訪問需要認證的API端點",
    version="1.0.0",
    swagger_ui_parameters={"defaultModelsExpandDepth": -1}
)

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 在生產環境中應該指定確切的源
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 自定義OpenAPI配置，修復Swagger UI認證問題
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )
    # 確保OAuth2安全配置正確 - 這裡使用與FastAPI默認的配置相同的設置
    if "components" not in openapi_schema:
        openapi_schema["components"] = {}
    if "securitySchemes" not in openapi_schema["components"]:
        openapi_schema["components"]["securitySchemes"] = {}

    openapi_schema["components"]["securitySchemes"]["OAuth2PasswordBearer"] = {
        "type": "oauth2",
        "flows": {
            "password": {
                "tokenUrl": "/api/auth/login",
                "scopes": {}
            }
        }
    }

    # 設定全局安全需求
    openapi_schema["security"] = [{"OAuth2PasswordBearer": []}]
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi

# 包含路由
app.include_router(auth.router, prefix="/api/auth", tags=["認證"])
app.include_router(users.router, prefix="/api/users", tags=["用戶"])
app.include_router(transactions.router, prefix="/api/transactions", tags=["交易"])

@app.get("/")
async def root():
    return {"message": "點數交易系統API服務運行中"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=5000, reload=True)
