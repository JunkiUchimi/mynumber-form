# MyNumber Form Project

従業員のマイナンバー情報をOffice Stationに同期するためのフォームアプリケーション。

## 初期設定

1. リポジトリをクローン
   ```sh
   $ git clone <repository_url>
   ```

2. プロジェクトのルートディレクトリに移動
   ```sh
   $ cd <project_root>
   ```
   現在のディレクトリ確認:
   ```sh
   $ pwd
   # 出力例: /path/to/project/mynumber-form
   ```

3. 必要なパッケージをインストール
   ```sh
   $ npm install
   ```

4. 設定ファイルの配置  
   以下のリンクから設定ファイルをダウンロードし、指定された場所に配置してください:
   - [kintone_config.json](https://drive.google.com/file/d/1CAD8n3OSJhGVypVVNLKWNV0LAK1wu88s/view?usp=sharing_link) -> `private/kintone_config.json`
   - [offista_config.json](https://drive.google.com/file/d/1VN5gIbefUn8bqoQUc9qjpga1mYD77UL1/view?usp=sharing_link) -> `private/offista_config.json`

5. ローカルサーバーを起動
   ```sh
   $ npm start
   ```
   起動後、ブラウザを開いて以下のURLにアクセスしてください:
   ```
   http://localhost:8080/preprocess
   ```

6. デプロイ (オプション)
   ```sh
   $ gcloud run deploy
   ```
   gcloudコマンドの詳細については[公式リファレンス](https://cloud.google.com/sdk/gcloud/reference/run)を参照してください。
   デプロイ先の地域設定として `asia-northeast1 (Tokyo)` を推奨します。

## 主な機能

- **/preprocess**: 事前情報を入力・登録するエンドポイント。
- **/submit**: マイナンバー情報を提出するエンドポイント。
- **updateMyNumber(records)**: Kintoneのレコードを更新する関数。無料版アプリから従業員を探し、マイナンバー同期済みフラグを立てる。

## 全体的な処理の流れ

1. **事前情報の登録**: 
   - `/preprocess` にアクセスし、従業員の基本情報を入力して登録する。
   - 入力データは一時的にデータベース(FireBase)に保存され、UUIDが割り当てられます。

2. **マイナンバー提出**:
   - `/submit` エンドポイントにアクセスし、事前情報に基づいてマイナンバーを提出します。
   - マイナンバー情報がOffice StationおよびKintoneに同期されます。

3. **レコードの更新**:
   - 提出された情報を基に、`updateMyNumber.js` を使用してKintoneのレコードが更新されます。
   - 更新されたデータはKintone内で「マイナンバー登録済み」として反映されます。

4. **エラーハンドリング**:
   - 各ステップでエラーが発生した場合、適切なメッセージがユーザーに返される。
   - サーバーログにエラーメッセージが記録され、デバッグのために利用できる。

## ファイル構成

```
my_number_form/
├── Dockerfile                        # Dockerコンテナのビルドに使用する設定ファイル
├── config.json                       # 設定ファイル（JSON形式）
├── README.md                         # プロジェクトの概要と使い方を記載したファイル
├── .gitignore                        # Gitで無視するファイルの設定
├── package-lock.json                 # npmの依存関係を固定するためのファイル
├── package.json                      # プロジェクトの依存関係を管理するファイル
├── .env                              # 環境変数を設定するファイル
├── open_port.sh                      # ポートを開放するスクリプト
├── .git                               # Git管理情報
├── app.js                             # アプリケーションのエントリーポイント
├── src/                               # ソースコード
│   ├── class/                         # クラス関連のファイル
│   │   ├── Kintone.js                 
│   │   ├── updateMyNumber.js          # kintoneレコードのマイナンバーフラグを立てに行く処理
│   │   ├── Offista.js                 
│   │   ├── Mynumber_offista_utils.js  
│   │   ├── Preinfo_db.js              # 事前情報をデータベースに保存するクラス
│   │   ├── relationship_log.txt       
│   │   ├── getKintoneRecord.js        # Kintoneのレコードを取得するクラス
│   ├── db                             # データベース関連のファイル（詳細は不明）
├── views/                             # サーバーサイドのHTMLテンプレート
│   ├── preprocess.ejs                 # 提出前情報（会社名・姓・名・社員No）を入力するwebページを生成するファイル
│   ├── index.ejs                      # メインのインデックスページ
│   ├── error.ejs                      # エラーページ
│   ├── submit.ejs                     # マイナンバー入力ページを生成するファイル
├── public/                            # 静的ファイル（CSS, JS）
│   ├── css/                           # スタイルシート
│   │   ├── preprocess.css             
│   ├── js/                           
│   │   ├── submit.js                  
│   │   ├── preprocess.js              
├── private/
    ├── kintone_config.json                           
    ├── offista_config.json                           
```
