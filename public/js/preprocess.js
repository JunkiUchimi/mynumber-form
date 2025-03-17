function copyText(button) {
  const textToCopy = document.getElementById("url-display").innerText;
  navigator.clipboard.writeText(textToCopy);

  button.disabled = true;
  button.classList.add("disabled");
}

function openLink() {
  const urlToOpen = document.getElementById("url-display").innerText;
  window.open(urlToOpen, "_blank");
}

function shareLink() {
  const urlToShare = document.getElementById("url-display").innerText;
  if (navigator.share) {
    navigator.share({
      title: "マイナンバー本提出用リンク",
      url: urlToShare,
    });
  } else {
    alert("ブラウザが共有機能をサポートしていません。");
  }
}

function formSetting() {
  let submitButton = document.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  submitButton.classList.add("btn-disabled"); // フォーム送信前にボタンを無効化

  const url = "/preprocess";
  const form = document.getElementById("mynumber-preprocessForm");
  const formData = new FormData(form);
  const formDataObj = {};
  formData.forEach((value, key) => {
    formDataObj[key] = value;
  });

  try {
    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formDataObj),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        console.log("fetch result: ", data);
        const uuid = data.data.uuid;
        const submitUrl = window.location.origin + "/submit?id=" + uuid;
        document.getElementById("url-display").innerText = submitUrl;
        $("#modal-url-display").modal("show");
      })
      .catch((error) => {
        console.error("There was a problem with the fetch operation:", error);
        submitButton.disabled = false;
        submitButton.classList.remove("btn-disabled");
      });
  } catch (e) {
    document.getElementById("submit-modal-title").innerText = "サーバーエラー";
    document.getElementById("url-display").innerText = e.message;
    document.getElementById("url-display").classList.add("text-danger");
    $("#modal-url-display").modal("show");
  }

  document.getElementById("mynumber-preprocessForm").reset(); // フォーム送信後にフォームをリセット
  submitButton.disabled = false; // フォーム送信後にボタンを有効化
  submitButton.classList.remove("btn-disabled");
}

document
  .getElementById("mynumber-preprocessForm")
  .addEventListener("submit", (event) => {
    event.preventDefault();
    formSetting();
  });
