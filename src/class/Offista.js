// Offista.js
const axios = require("axios");
const fs = require("fs");
const path = require("path");

// config.json を読み込む
const configPath = path.resolve(__dirname, "../../config.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));

// クラス定義
module.exports = class Offista {
  return_object_template = {
    //プライベートでない(関数名の最初に#が付いていない)ものは、すべてこの形式で返ってくる
    status: null,
    message: null,
    data: null,
  };

  #api_key = "";
  #product_key = "";
  #mondetory_keys = [];

  // `config.paths.offistaConfig` から設定を読み込む
  #config = require(path.resolve(__dirname, "../../", config.paths.offistaConfig));
  #user_name = this.#config.user_name;
  #user = this.#config.users[this.#user_name];
  #endpoint_name = this.#user.endpoint_name;
  #endpoint = this.#config[this.#endpoint_name];
  #station_id = this.#user.station_id;
  #login_id = this.#user.login_id;
  #login_pass = this.#user.login_pass;
  #rn_list = this.#config.rn_list;
  #product_id = this.#config.product_id;
  #email = this.#config.email;
  #dump_log = false;

  constructor(init_object) {
    if (
      init_object !== undefined &&
      "is_dumpLog" in init_object &&
      init_object.is_dumpLog == true
    )
      this.#dump_log = true;
  }

  async #create_api_key() {
    const api_name = "CREATE_API_KEY";
    let body_obj = {
      uid: this.#login_id,
      upw: this.#login_pass,
      pid: this.#product_id,
      eml: this.#email,
    };
    const response = await this.#post(api_name, body_obj);

    if (response.data.result == 200) {
      const { product_key, api_key } = response.data;
      this.#api_key = api_key;
      this.#product_key = product_key;
    }
    return;
  }

  async #get_api_key() {
    let return_obj = "";

    if (this.#api_key !== "") return this.#api_key;
    const api_name = "GET_API_KEY";
    let body_obj = {
      uid: this.#login_id,
      upw: this.#login_pass,
      eml: this.#email,
    };
    const response = await this.#post(api_name, body_obj);
    if (response.data.api_key != null) {
      this.#api_key = response.data.api_key;
    } else {
      this.#create_api_key();
    }
    return_obj = this.#api_key;
    return return_obj;
  }

  async #get_pid_key() {
    let return_obj = "";

    if (this.#product_key !== "") return this.#product_key;
    const api_name = "GET_PID_KEY";
    let body_obj = {
      uid: this.#login_id,
      upw: this.#login_pass,
      eml: this.#email,
    };
    const response = await this.#post(api_name, body_obj);
    if (response.data.result != 200) this.#create_api_key();
    else this.product_key = response.data.product_key;
    return_obj = this.#product_key;
    return return_obj;
  }

  async #api_login_rn() {
    let return_obj = "";

    const api_name = "API_LOGIN_RN";
    const ac_method = await this.#get_ac_method();
    let ac_id = ac_method.data.ac_id;
    let rn = this.#rn_list[ac_id];
    let A1 = rn[0][0];
    let E5 = rn[4][4];

    let body_obj = {
      uid: this.#login_id,
      upw: this.#login_pass,
      inputs: [
        {
          x: "A",
          y: 1,
          number: A1,
        },

        {
          x: "E",
          y: 5,
          number: E5,
        },
      ],
    };
    const response = await this.#post(api_name, body_obj);
    if (response.data.result == 200) return_obj = response.data["session-id"];
    return return_obj;
  }

  async #get_ac_method() {
    let return_object = this.return_object_template;
    let return_data_obj = { ac_method: "", ac_id: "", one_time_type: "" };

    const api_name = "GET_AC_METHOD";
    let body_obj = {
      uid: this.#login_id,
      upw: this.#login_pass,
    };
    const response = await this.#post(api_name, body_obj);
    if (response.data.result != 200)
      throw new Error("failed to get ac method.");
    else {
      return_object.status = 200;
      return_object.message = "get_ac_method successed.";
      switch (response.data.ac_method) {
        case 0:
          return_data_obj.ac_method =
            "Symantec VIP token or GoogleAuthenticator";
          break;
        case 1:
          return_data_obj.ac_method = "RN list";
          break;
        case 9:
          return_data_obj.ac_method = "other";
          break;
        default:
          if (this.#dump_log) console.error("ac_method is not defined.");
          return_object = {
            status: 500,
            message: "ac_method is not defined.",
            data: {},
          };
          return return_object;
      }
      return_data_obj.ac_id = response.data.ac_id;
      switch (response.data.ac_id) {
        case 1:
          return_data_obj.one_time_type = "Symantec VIP token";
          break;
        case 2:
          return_data_obj.one_time_type = "GoogleAuthenticator";
          break;
        default:
          if (this.#dump_log) console.log("OTP typ is not defined.");
          return_object.message += "OTP typ is not defined.";
      }
    }
    return_object.data = return_data_obj;
    return return_object;
  }

  async get_mynumber(mut_obj) {
    //mut_obj={mut_stid:"Station ID", mut_emp:"従業員番号", mut_pur:"取得目的"}
    let return_object = this.return_object_template;
    const keys = Object.keys(mut_obj);
    if (
      keys.length == 0 ||
      !keys.includes("mut_emp") ||
      !keys.includes("mut_pur")
    );
    const api_name = "GET_MYNUMBER";
    const session_id = await this.#api_login_rn();
    if (session_id === "") {
      return_object = {
        status: 500,
        message: "faild to two factor auth.",
        data: null,
      };
      return return_object;
    }
    let body_obj = {
      api_key: await this.#get_api_key(),
      mut_stid: mut_obj.mut_stid,
      emp_kbn: 0,
      mut_emp: mut_obj.mut_emp,
      mut_pur: mut_obj.mut_pur,
      uid: this.#login_id,
      upw: this.#login_pass,
      sid: session_id,
    };
    const response = await this.#post(api_name, body_obj);
    if (response.data[0].result != 200) {
      return_object = {
        status: 500,
        message: response.data[0].message,
        data: null,
      };
    } else {
      return_object = {
        status: 200,
        message: "",
        data: response.data,
      };
    }
    return return_object;
  }

  async get_employee(mut_stid, options) {
    let return_object = this.return_object_template;
    const api_name = "GET_EMPLOYEE";
    let body_obj = {
      api_key: await this.#get_api_key(),
      mut_stid: mut_stid,
      uid: this.#login_id,
    };
    const keys = [
      "family_ret",
      "retiree_ret",
      "employees_kbn_ret",
      "response_blank",
      "employees",
    ];
    if (typeof options == "object") {
      keys.forEach((key) => {
        if (key in options) body_obj[key] = options[key];
      });
    }

    const response = await this.#post(api_name, body_obj);
    if (response.data.result == 200) {
      return_object = {
        status: 200,
        message: "",
        data: response.data.employees,
      };
    } else {
      return_object = {
        status: 500,
        message: "failed to get employee data.",
        data: null,
      };
    }
    return return_object;
  }

  async get_consignment_customer() {
    let return_object = this.return_object_template;
    const api_name = "GET_CONSIGNMENT_CUSTOMER";
    let body_obj = {
      api_key: await this.#get_api_key(),
      uid: this.#login_id,
    };
    const response = await this.#post(api_name, body_obj);
    if (response.data.result == 200) {
      return_object = {
        status: 200,
        message: "",
        data: response.data.customers, //[{identifire: "", customer_name: ""}]
      };
    } else {
      return_object = {
        status: 500,
        message: "failed to get consignment customer.",
        data: {},
      };
    }
    return return_object;
  }

  async get_mut_stid(company_name) {
    let return_object = this.return_object_template;
    let response = await this.get_consignment_customer();
    if (response.status != 200) return response;
    const filteredElements = response.data.filter(
      (item) => item.customer_name === company_name
    );
    const identifiers = filteredElements.map((item) => item.identifier);
    if (identifiers.length == 1) {
      return_object = {
        status: 200,
        message: "",
        data: identifiers[0],
      };
    } else {
      return_object = {
        status: 500,
        message: "failed to get station id.",
        data: null,
      };
    }
    return return_object;
  }

  async get_office(mut_stid) {
    let return_object = this.return_object_temp;
    const api_name = "GET_OFFICE";
    let body_obj = {
      api_key: await this.#get_api_key(),
      mut_stid: mut_stid,
      uid: this.#login_id,
    };
    const response = await this.#post(api_name, body_obj);
    if (response.data.result == 200) {
      return_object = {
        status: 200,
        message: "",
        data: response.data.offices,
      };
    } else {
      return_object = {
        status: 500,
        message: "failed to get office info.",
        data: null,
      };
    }
    return return_object;
  }

  async entry_employee(mut_stid, employees) {
    let return_object = this.return_object_temp;
    const api_name = "ENTRY_EMPLOYEE";
    if (employees.length > 100) {
      return_object = {
        status: 500,
        message: "maximum resist employee num is 100 per request.",
        data: {},
      };
      return return_object;
    }

    for (let i = 0; i < employees.length; i++) {
      for (let j = 0; j < this.#mondetory_keys.length; j++) {
        const key = this.#mondetory_keys[j];
        if (!(key in employees[i])) {
          return_object = {
            status: false,
            message: `index number ${i} employee object has not a key {${key}}.`,
            data: {},
          };
          return return_object;
        }
      }
    }

    let body_obj = {
      api_key: await this.#get_api_key(),
      mut_stid: mut_stid,
      uid: this.#login_id,
      upw: this.#login_pass,
      employees: employees,
    };
    const response = await this.#post(api_name, body_obj);
    if (response.data.result == 200) {
      return_object = {
        status: 200,
        message: "",
        data: {},
      };
    } else
      return_object = {
        status: 500,
        message: `failed to entry employees.\n"${response.data.error_detail}"`,
        data: null,
      };
    return return_object;
  }

  async modify_employee(mut_stid, employees) {
    let return_object = this.return_object_temp;
    const api_name = "MODIFY_EMPLOYEE";
    if (employees.length > 100) {
      return_object.status = 500;
      return_object.message = "maximum resist employee num is 100 per request.";
      return return_object;
    }
    for (let i = 0; i < employees.length; i++) {
      for (let j = 0; j < this.#mondetory_keys.length; j++) {
        const key = this.#mondetory_keys[j];
        if (!(key in employees[i])) {
          return_object.status = 500;
          return_object.message = `index number ${i} employee object has not a key {${key}}.`;
          return return_object;
        }
      }
    }
    let body_obj = {
      api_key: await this.#get_api_key(),
      mut_stid: mut_stid,
      uid: this.#login_id,
      upw: this.#login_pass,
      employees: employees,
    };
    const response = await this.#post(api_name, body_obj);

    if (response.data.result == 200) return_object.status = 200;
    else {
      return_object.status = 500;
      return_object.message = `failed to modify employees.\n"${response.data.message}"`;
    }
    return return_object;
  }

  async entry_my_number(info) {
    let return_object = this.return_object_template;
    const need_info = ["employee_key", "mut_stid", "updtype"];
    try {
      if (info.updtype == 1) need_info.push("mynumber");
      if (info.updtype == 0) need_info.push("purpose");
    } catch (e) {
      return_object.status = 500;
      return_object.message = "updtype is not defined.";
      return return_object;
    }
    need_info.forEach((key) => {
      if (!key in info) {
        return_object.status = 500;
        return_object.message = `we need an object contains ${key}`;
        return_object.data = info;
        return return_object;
      }
    });

    const api_name = "ENTRY_MY_NUMBER";
    const session_id = await this.#api_login_rn();
    if (session_id === "") {
      return_object.status = 500;
      return_object.message = "faild to two factor auth.";
      return return_object;
    }
    const body_obj = {
      employee_key: info.employee_key,
      updtype: Number(info.updtype),
      mynumber: info.mynumber,
      mut_stid: info.mut_stid,
      api_key: await this.#get_api_key(),
      uid: this.#login_id,
      upw: this.#login_pass,
      sid: session_id,
      purpose: info.purpose,
    };

    const response = await this.#post(api_name, body_obj);

    return_object.status = response.data.result;
    return_object.message = response.data.message;
    return_object.data = {};
    return return_object;
  }

  #make_params(api_name, body_obj) {
    const params = {
      url: `${this.#endpoint}/${this.#station_id}/${api_name}`,
      method: "POST",
      headers: {
        "Content-type": "application/json",
      },
      json: true,
      body: JSON.stringify(body_obj),
    };
    if (this.#dump_log) console.log("\nmake_params: ", params);
    return params;
  }

  async #post(api_name, body_obj) {
    let return_obj = {
      status: "response.status",
      message: "response.statusText",
      data: {},
    };

    const params = this.#make_params(api_name, body_obj);

    const response = await axios.post(params.url, params.body, {
      headers: params.headers,
    });

    return_obj = {
      status: response.status,
      message: response.statusText,
      data: response.data,
    };

    if (response.status !== 200 && this.#dump_log) {
      console.error("post error: ", response.getContentText());
    }

    if (this.#dump_log) {
      console.log(`\n${api_name}: `, return_obj);
    }

    return return_obj;
  }
};
