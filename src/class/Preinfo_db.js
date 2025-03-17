// Preinfo_db.js

const sqlite3 = require("sqlite3");
const uuid = require("uuid");
const fs = require("fs");
const path = require("path");

// config.json を読み込む
const configPath = path.resolve(__dirname, "../../config.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));

// データベースのパスを取得
const db_path = path.resolve(__dirname, "../../", config.paths.preinfoDb);

module.exports = class Preinfo_db {
  constructor() {
    if (!db_path) {
      throw new Error("Database path is undefined. Check config.json.");
    }
    console.log("Using database at:", db_path); // デバッグ用ログ
    this.db = new sqlite3.Database(db_path);
    this.db.run(
      "create table if not exists formdata(uuid, companyName, employeeNumber, employeeName_last, employeeName_first, enable, timestamp)"
    );
  }

  entry(data) {
    if (
      data?.companyName === undefined ||
      data?.employeeNumber === undefined ||
      data?.employeeName_last === undefined ||
      data?.employeeName_first === undefined
    ) {
      return null;
    }

    data.uuid = uuid.v4();
    data.timestamp = new Date().toLocaleString();
    data.enable = 1;

    this.db.serialize(() => {
      this.db.run(
        "insert into formdata(uuid, companyName, employeeNumber, employeeName_last, employeeName_first, enable, timestamp) values(?, ?, ?, ?, ?, ?, ?)",
        [
          data.uuid,
          data.companyName,
          data.employeeNumber,
          data.employeeName_last,
          data.employeeName_first,
          data.enable,
          data.timestamp,
        ]
      );
    });
    return data.uuid;
  }

  async read(uuid) {
    return new Promise((resolve, reject) => {
      if (uuid === undefined || uuid === null || uuid === "") {
        reject(null);
      }
      this.db.serialize(() => {
        this.db.get(
          "select * from formdata where uuid = ? and enable = 1",
          [uuid],
          (err, row) => {
            if (err) {
              reject(null);
            }
            resolve(row);
          }
        );
      });
    });
  }

  async check_enable(uuid) {
    return new Promise((resolve, reject) => {
      if (uuid === undefined || uuid === null || uuid === "") {
        reject(null);
      }
      this.db.serialize(() => {
        this.db.get(
          "select enable from formdata where uuid = ?",
          [uuid],
          (err, row) => {
            if (err) {
              reject(null);
            }
            if (row == undefined) resolve(0);
            else resolve(row.enable == 1);
          }
        );
      });
    });
  }

  disable(uuid) {
    if (uuid === undefined || uuid === null || uuid === "") {
      return null;
    }
    this.db.serialize(() => {
      this.db.run("update formdata set enable = 0 where uuid = ?", [uuid]);
    });
  }

  reset(password) {
    if (password === config.dbResetPassword) {
      this.db.serialize(() => {
        this.db.run("drop table if exists formdata");
      });
    }
  }
};
