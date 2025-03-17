const axios = require("axios");
const CONFIG_PATH = "../../private/kintone_config.json";
const CONFIG = require(CONFIG_PATH);

module.exports = class Kintone {
  #host;
  #id;
  #token;
  #fieldStructure = {}; // fieldCode: dataType
  #appInfo = "";

  constructor(version, relationship) {
    console.log(`Constructor called with version: ${version}, relationship: ${relationship}`); // デバッグログ
    const relationshipKey = relationship === 0 ? "本人" : "家族";
    this.#id = this.#getAppId(version, relationshipKey);
    this.#token = this.#getToken(version, this.#id);
    this.#host = CONFIG.host_url;
}

#getAppId(version, relationshipKey) {
    const versionConfig = CONFIG.ids[version];
    if (!versionConfig) {
        throw new Error(`Invalid version: ${version}`);
    }

    for (const [appId, appInfo] of Object.entries(versionConfig)) {
        if (appInfo.relationship === relationshipKey) {
            console.log(`App ID found: ${appId} for relationship: ${relationshipKey}`); // デバッグログ
            return appId;
        }
    }
    throw new Error(`App ID not found for version: ${version} and relationship: ${relationshipKey}`);
}

#getToken(version, appId) {
    const versionConfig = CONFIG.ids[version];
    if (!versionConfig) {
        throw new Error(`Invalid version: ${version}`);
    }

    const appInfo = versionConfig[appId];
    if (appInfo && appInfo.api_token) {
        console.log(`API token found for App ID: ${appId}`); // デバッグログ
        return appInfo.api_token;
    } else {
        throw new Error(`API token not found for App ID: ${appId} in version: ${version}`);
    }
}


  #makeParams(httpMethod, query, jsonType) {
    let params = {
      url: `${this.#host}/k/v1/${jsonType}.json`,
      method: httpMethod,
      json: true,
      headers: {
        "X-Cybozu-API-Token": this.#token,
      },
    };

    if (jsonType === "app") {
      params.url += `?id=${this.#id}`;
    } else if (jsonType === "records") {
      params.url += `?app=${this.#id}&query=${encodeURI(query)}`;
    } else if (jsonType == "app/form/fields") {
      params.url += `?app=${this.#id}`;
    }

    if (httpMethod === "POST" || httpMethod === "PUT") {
      params.headers["Content-Type"] = "application/json";
    }

    return params;
  }

  async #request(params) {
    try {
      const response = await axios(params);
      return response.data;
    } catch (error) {
      console.error(error);
      return new Error("Fetch error");
    }
  }

  async build() {
    try {
      const param = this.#makeParams("GET", "", "app/form/fields");
      const result = await this.#request(param);
      const field_data = result.properties;
      Object.keys(field_data).forEach((key) => {
        this.#fieldStructure[key] = field_data[key].type;
      });
      const params = this.#makeParams("GET", "", "app");
      this.#appInfo = await this.#request(params);
    } catch (e) {
      return new Error("failed to build Kintone class");
    }
  }

  async get(queryStr) {
    const params = this.#makeParams("GET", queryStr, "records");
    try {
      const result = await this.#request(params);
      return result;
    } catch (e) {
      return new Error("failed to get Kintone record");
    }
  }

  async put(recordId, record) {
    const url = `${this.#host}/k/v1/record.json`;
    const headers = {
      "X-Cybozu-API-Token": this.#token,
      "Content-Type": "application/json",
    };
    const data = {
      app: this.#id,
      id: recordId,
      record: record,
    };

    const response = await axios.put(url, data, { headers });
    return response.data;
  }

  async post(recordObj) {
    const postObj = {};
    Object.keys(recordObj).forEach((key) => {
      postObj[key] = { value: recordObj[key] };
    });

    const postData = {
      app: this.#id,
      record: postObj,
    };

    const params = this.#makeParams("POST", "", "record");
    params.data = postData;

    try {
      const result = await this.#request(params);
      return result;
    } catch (e) {
      return new Error("failed to post to Kintone database");
    }
  }

  getParams() {
    return {
      appInfo: this.#appInfo,
      host: this.#host,
      token: this.#token,
      fieldStructure: this.#fieldStructure,
    };
  }
};
