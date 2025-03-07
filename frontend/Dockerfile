# 使用官方 Nginx 作為基礎鏡像
FROM nginx:latest

# 設定工作目錄
WORKDIR /usr/share/nginx/html

# 清除預設 Nginx 網頁檔案
RUN rm -rf ./*

# 複製 Vue 3 的 `dist/` 內容到 Nginx
COPY dist /usr/share/nginx/html

# 複製自定義 Nginx 設定
COPY nginx.conf /etc/nginx/templates/nginx.conf.template

# 安裝 `envsubst` (環境變數替換工具)
RUN apt-get update && apt-get install -y gettext-base

ENV TZ=Asia/Shanghai
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# 啟動 Nginx，並在啟動時替換環境變數
CMD envsubst '$API_BACKEND' < /etc/nginx/templates/nginx.conf.template > /etc/nginx/nginx.conf && \
    nginx -g "daemon off;"
