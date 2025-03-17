# Dockerfile
FROM node:16

# アプリケーションのコピー
WORKDIR /usr/src/app
COPY . .

# 依存関係のインストール
RUN npm install
RUN npm rebuild sqlite3 --build-from-source

# ポート指定（Cloud Runのデフォルト）
ENV PORT=8080

# アプリケーションの起動
CMD ["npm", "start"]
