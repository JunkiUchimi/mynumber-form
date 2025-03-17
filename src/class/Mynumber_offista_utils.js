require("dotenv").config();
const Offista = require("./Offista");

module.exports = class mynumber_offista_utils
{
  constructor(is_dumpLog)
  {
    this.is_dumpLog = is_dumpLog || false;
    this.of = new Offista({ is_dumpLog: this.is_dumpLog });
  }
  async update_my_number(companyName, employeeId, mut_pur, mynumber_data)
  {
    //name=姓名をスペースなしでつなげたもの, mut_pur=編集理由, update_type=(0=>modify, 1=>delete)
    if (
      mynumber_data.mynumber == undefined ||
      mynumber_data.name == undefined ||
      mynumber_data.update_type == undefined
    )
      return {
        status: 500,
        message:
          'the argument "mynumber_data" must contain "mynumber", "name", "update_type" keys.',
        data: mynumber_data,
      };

    let response = {};


    // station idを取得する
    response = await this.of.get_mut_stid(companyName);
    if (response.status != 200)
    {
      console.error("failed to get station_id", response);
      return response;
    }
    const station_id = response.data;

    //employee_idからemployee_keyを取得
    let employee_key = "";
    response = await this.get_employee_keys(companyName, employeeId, station_id);
    if (response.status != 200)
    {
      console.error("failed to get employee_key", response);
      return response;
    }
    response.data.forEach((elem) =>
    {
      if (elem.name === mynumber_data.name)
      {
        employee_key = elem.employee_key;
        return;
      }
    });

    const info = {
      employee_key: employee_key,
      mut_stid: station_id,
      updtype: mynumber_data.update_type, //1=entry&modify, 2=delete
      mynumber: mynumber_data.mynumber,
      purpose: mut_pur,
    };

    response = await this.of.entry_my_number(info);
    return response;
  }

  async get_employee_keys(companyName, employeeId, station_id)
  {
    //station_idはnullでも可能
    // mynumberの編集に使用するemployee_key(!=employee_id)を取得。
    // [{name:"",relation:"",employee_key:""},...]
    let response = {};

    if (!station_id)
    {
      // station idを取得する
      response = await this.of.get_mut_stid(companyName);
      if (response.status != 200)
      {
        console.error("failed to get station_id", response);
        return response;
      }
      station_id = response.data;
    }

    // 絞り込みオプション情報を格納
    const option = {
      family_ret: 1, //0=扶養含まず,1=扶養含む
      employees: {
        mut_emp: [employeeId], //従業員番号%{employeeId}の情報
      },
    };
    response = await this.of.get_employee(station_id, option);
    if (response.status != 200) return response;

    const data = response.data;
    let result = [];
    data.forEach((e) =>
    {
      const name = e.shi_name + e.mei_name;
      const relationship = e.relationship;
      const employee_key = e.employee_key;

      // デバッグログを追加
      console.log(`Name: ${name}, Relationship: ${relationship}, Employee Key: ${employee_key}`);

      result.push({
        name: name,
        relationship: relationship,
        employee_key: employee_key,
      });
    });
    return {
      status: 200,
      message: "",
      data: result,
    };
  }

  async get_mynumber(companyName, mut_emp, mut_pur)
  {
    //mut_emp=従業員番号, mut_pur=閲覧目的(string)
    let response = {};

    // station idを取得する
    response = await this.of.get_mut_stid(companyName);
    if (response.status != 200) return response;

    const station_id = response.data;
    // mynumber取得用の追加情報を格納
    const mut_obj = {
      mut_stid: station_id,
      mut_emp: mut_emp,
      mut_pur: mut_pur,
    };
    response = await this.of.get_mynumber(mut_obj);
    return response;
  }

  async get_employee(companyName, mut_emp)
  {
    let response = {};

    // station idを取得する
    response = await this.of.get_mut_stid(companyName);
    if (response.status != 200) return response;

    const station_id = response.data;
    // 絞り込みオプション情報を格納
    const option = {
      family_ret: 0,
      employees: {
        mut_emp: [mut_emp],
      },
    }; //扶養家族含まない・従業員番号${mut_emp}の情報
    response = await this.of.get_employee(station_id, option);
    return response;
  }

  async update_employee(companyName, emp_data)
  {
    //emp_data=Offista仕様書に沿った従業員データ
    let response = {};

    // station idを取得する
    response = await this.of.get_mut_stid(companyName);
    if (response.status != 200) return response;
    const station_id = response.data;

    response = await this.of.entry_employee(station_id, [emp_data]);
    if (response.station != 200)
      response = await this.of.modify_employee(station_id, [emp_data]);
    return response;
  }

  convert_relationship(data)
  {
    let response = {
      number: null,
      string: null
    }
    const convert_obj = {
      0: "本人",
      1: "夫", 2: "妻", 3: "父", 4: "母", 5: "子", 6:
        "兄", 7: "弟", 8: "姉", 9: "妹", 10: "祖父", 11: "祖母",
      12: "孫", 99: "その他"

    }
    if (data == undefined || data.number == undefined && data.string == undefined)
    {
      return null
    } else
    {
      response.number = data.number;
      response.string = data.string;
      if (data.number)
        response.string = convert_obj[data.number]
    }
    return response
  }
};
