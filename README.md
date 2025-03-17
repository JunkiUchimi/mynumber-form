## 初期設定

1. リポジトリをクローン
2. プロジェクトのルートディレクトリに移動
   ```sh
   $ cd <project_root>
   ```
   ```sh
   $ pwd
   <path to project>/mynumber-form
   ```
3. パッケージをインストール
   ```sh
   $ npm install
   ```
4. ローカルサーバーを起動
   ```sh
    $ npm start
   ```

5. deploy
   ```sh
   gcloud run deploy
   ```
   こちらがgcloudコマンドの[リファレンス](https://cloud.google.com/sdk/gcloud/reference/run)  
   regionは4(asia-northeast1==Tokyo)がおすすめです

設定ファイルは以下からダウンロードして、
private/kintone_config.json
private/offista_config.json
に配置してください。

   > [!IMPORTANT]
   > must download above files into `src/json`
   >
   > - [kintone_config.json](https://drive.google.com/file/d/1CAD8n3OSJhGVypVVNLKWNV0LAK1wu88s/view?usp=sharing_link)
   > - [offista_config.json](https://drive.google.com/file/d/1VN5gIbefUn8bqoQUc9qjpga1mYD77UL1/view?usp=sharing_link)
## Author

2024 kento tokura
