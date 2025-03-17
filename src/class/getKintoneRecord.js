const KINTONE_CLASS_PATH = "../class/Kintone";
const Kintone = require(KINTONE_CLASS_PATH);
module.exports = async (app_id, unique_key) => {  // 修正: unique_key を引数に追加
  const c = new Kintone(app_id);
  await c.build();

  const query_str = `固有キー="${unique_key}"`;  // 修正: window.unique_key を unique_key に変更
  const result = await c.get(query_str);
  try {
    const records = result.records;
    if (records.length == 0) {
      console.log("result not have any record.\n");
      return [];
    } else if (records.length > 1) {
      console.log("result have too much records.\n");
      return [];
    } else {
      return records[0];
    }
  } catch (e) {
    console.log(e);
    return [];
  }
};
