const Kintone = require("./Kintone");
const Mynumber_offista_utils = require("./Mynumber_offista_utils");

async function updateMyNumber(records) {
  const utils = new Mynumber_offista_utils();
  const results = [];

  for (const record of records) {
    const { companyName, lastName, firstName, employeeNumber } = record;
    try {
      // get_employee_keysからrelationshipを取得
      const employeeKeysResponse = await utils.get_employee_keys(companyName, employeeNumber);
      if (employeeKeysResponse.status !== 200 || employeeKeysResponse.data.length === 0) {
        console.error(`Failed to get employee keys for ${companyName}`);
        results.push({ companyName, status: "error", message: `Failed to get employee keys for ${companyName}` });
        continue;
      }

      // 適切なrelationshipを取得する
      const employeeData = employeeKeysResponse.data.find(e => e.name === `${lastName}${firstName}`);
      console.log(`Employee Data: ${JSON.stringify(employeeData)}`); // デバッグログ
      if (!employeeData) {
        console.error(`No matching employee data found for ${lastName}${firstName}`);
        results.push({ companyName, status: "error", message: `No matching employee data found for ${lastName}${firstName}` });
        continue;
      }
      const relationship = employeeData.relationship;
      console.log(`Relationship: ${relationship}`);

      const version = "有料版"; // "有料版" または "無料版"、状況に応じて設定
      const kintone = new Kintone(version, relationship);
            await kintone.build();

      const lastNameField = relationship === 0 ? "姓戸籍" : "姓1";
      const firstNameField = relationship === 0 ? "名戸籍" : "名1";
      const query_str = `${lastNameField}="${lastName}" and ${firstNameField}="${firstName}" and 社員No="${employeeNumber}"`;
      const result = await kintone.get(query_str);
      if (result.records && result.records.length > 0) {
        for (const rec of result.records) {
          const record_id = rec.$id.value;
          const updatedRecord = { 
            "本人マイナンバー結果": { value: "マイナンバー登録済み" }
          };
          await kintone.put(record_id, updatedRecord);
          console.log(`Record ID ${record_id} updated with マイナンバー: マイナンバー登録済み`);
          results.push({ companyName, status: "success", recordId: record_id });
        }
      } else {
        console.log(`No matching record found for ${lastName} ${firstName} ${employeeNumber} in company ${companyName}`);
        results.push({ companyName, status: "error", message: `No matching record found for ${lastName} ${firstName} ${employeeNumber} in company ${companyName}` });
      }
    } catch (error) {
      console.error(`Error processing company ${companyName}:`, error.message);
      results.push({ companyName, status: "error", message: error.message });
    }
  }

  return results;
}

module.exports = updateMyNumber;