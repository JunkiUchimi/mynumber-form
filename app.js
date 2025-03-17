const fs = require("fs");
const path = require("path");

// config.json の読み込み
const configPath = path.resolve(__dirname, "config.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
const { port, paths } = config;

const updateMyNumber = require(paths.updateMyNumberClass);
const preinfo_db = require(paths.preinfoDbClass);
const Preinfo_db = new preinfo_db();
const of_utils = require(paths.mynumberUtils);
const Mynumber_offista_utils = new of_utils();


// expressの初期化
const express = require("express");
const app = express();

// ミドルウェアの設定
app.use(express.static("public"));
app.use(express.json());
app.set("view engine", "ejs");

// ルーティングの設定

// /preprocessにアクセスしたときの処理
app.get("/preprocess", (req, res) =>
{
  try
  {
    const { employeeNumber, companyName, employeeName_last, employeeName_first} = req.query;

    // Check if parameters are undefined, and if so, set them to empty strings
    const params = {
      companyName: companyName || "",
      employeeNumber: employeeNumber || "",
      employeeName_last: employeeName_last || "",
      employeeName_first: employeeName_first || ""
    };

    res.render("./preprocess.ejs", params);
  } catch (e)
  {
    res.render("./error.ejs", {
      message: e.message,
    });
  }
});

// /preprocessにアクセスしたときの処理
app.post("/preprocess", async (req, res) =>
{
  try
  {
    console.log(req.body); // ここでログ出力してデータを確認
    const uuid = await Preinfo_db.entry(req.body);
    res.json({
      status: 200,
      message: "pre info entry success",
      data: { uuid: uuid },
    });
  } catch (e)
  {
    res.json({
      status: 500,
      message: e.message,
    });
  }
});

app.get("/submit", async (req, res) =>
{
  try
  {
    const uuid = req.query.id; //URLパラメーターからidを取得
    const enable = await Preinfo_db.check_enable(uuid);

    if (!uuid)
      throw new Error(`URLパラメーターにidが含まれていません : ${uuid}`);
    else if (!enable) throw new Error("無効なリンクです");
    else
    {
      const pre_info = await Preinfo_db.read(uuid);
      res.render("./submit.ejs", {
        uuid: uuid,
        companyName: pre_info.companyName,
        employeeNumber: pre_info.employeeNumber,
        name: pre_info.employeeName_last + pre_info.employeeName_first,
        relationship: pre_info.relationship
      });
    }
  } catch (e)
  {
    if (e.message == null) e.message = "internal server error.\n(auto generated error message)"
    res.render("./error.ejs", {
      message: e.message,
    });
  }
});

// app.js 内の submit エンドポイントの修正
app.post("/submit", async (req, res) => {
  try {
    const uuid = req.body.uuid;
    const mynumber = req.body.mynumber;
    const db_result = await Preinfo_db.read(uuid);
    if (!db_result) throw new Error("無効なリンクです");
    const mynumber_result = await Mynumber_offista_utils.update_my_number(
      db_result.companyName,
      db_result.employeeNumber,
      "マイナンバー提出",
      {
        mynumber: mynumber,
        name: db_result.employeeName_last + db_result.employeeName_first,
        update_type: 1, // 1=entry&modify, 2=delete
      }
    );
    if (mynumber_result.status != 200) {
      console.log(mynumber_result);
      throw new Error(mynumber_result.message);
    }
    Preinfo_db.disable(uuid);

    // Kintoneのレコードを更新
    const recordsToUpdate = [
      {
        companyName: db_result.companyName,
        lastName: db_result.employeeName_last,
        firstName: db_result.employeeName_first,
        employeeNumber: db_result.employeeNumber,
        relationship: db_result.relationship
      }
    ];
    const updateResult = await updateMyNumber(recordsToUpdate);

    // 返り値の確認のためのログ出力
    console.log("updateMyNumber result:", updateResult);

    // updateResultが期待した形式であるかをチェック
    if (!updateResult || updateResult.some(result => result.status !== "success")) {  // ここで返り値の存在と形式をチェック
      const errorMessage = updateResult
        .filter(result => result.status !== "success")
        .map(result => result.message || "不明なエラー")
        .join(", ");
      throw new Error("Kintoneのレコード更新に失敗しました: " + errorMessage);
    }



    res.json({
      status: 200,
      message: "マイナンバー提出完了",
    });
  } catch (e) {
    res.json({
      status: 500,
      message: "Error : " + e.message,
    });
  }
});


//存在しないページにアクセスしたときの処理
app.use((req, res, next) =>
{
  res.status(404).render("error.ejs", {
    message: "ページが見つかりません",
  });
});

// サーバーの起動
app.listen(port, () =>
{
  console.log(`Example app listening at http://localhost:${port}`);
});

