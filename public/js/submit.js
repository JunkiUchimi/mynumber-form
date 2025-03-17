// submit.js

// 閉じるボタンが押されたときの処理を追加
$("#modal-url-display").on("hidden.bs.modal", function (e)
{
  window.close(); // ウィンドウを閉じる
  document.getElementById("mynumber-submitForm").reset(); // フォームをクリア
  window.location.reload(); //ページをリロード
});

function formSetting()
{
  const url = "/submit";
  if (!validateMyNumber()) return false;

  const submitButton = document.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  submitButton.classList.add("btn-disabled");
  const form = document.getElementById("mynumber-submitForm");
  const formData = new FormData(form);
  const formDataObj = {};
  formData.forEach((value, key) =>
  {
    formDataObj[key] = value;
  });

  try
  {
    fetch(url, {
      method: "POST",
      body: JSON.stringify(formDataObj),
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) =>
      {
        if (!response.ok) throw new Error("Network response was not ok");
        return response.json();
      })
      .then((data) =>
      {
        console.log("fetch result: ", data);
        document.querySelector(".modal-title").innerText = data.message;
        $("#modal-url-display").modal("show");
        // フォーム送信後にボタンを有効化
        submitButton.disabled = false;
        submitButton.classList.remove("btn-disabled");
      })
      .catch((error) =>
      {
        console.error("There was a problem with the fetch operation:", error);
      });
  } catch (e)
  {
    document.querySelector(".modal-title").innerText = e.message;
    $("#modal-url-display").modal("show");
  }
}
document
  .getElementById("mynumber-submitForm")
  .addEventListener("submit", (event) =>
  {
    event.preventDefault();
    formSetting();
  });

function validateMyNumber()
{
  const mynumber = document.getElementById("mynumber").value;
  if (
    !mynumber ||
    !/^[0-9]+$/.test(mynumber) ||
    mynumber.length !== 12
  )
  {
    document.getElementById("mynumber").classList.add("is-invalid");
    document.getElementById("mynumberError").innerText = "12桁の半角数字でマイナンバーを入力してください。";
    return false;
  }
  const checkDigit = calculateCheckDigit(mynumber);

  if (mynumber.length !== 12 || mynumber[11] !== checkDigit.toString())
  {
    document.getElementById("mynumber").classList.add("is-invalid");
    document.getElementById("mynumberError").innerText = "マイナンバーが正しくありません。";
    return false;
  } else
  {
    document.getElementById("mynumber").classList.remove("is-invalid");
    return true;
  }
}

function calculateCheckDigit(mynumber)
{
  const weights = [6, 5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 11; i++)
  {
    sum += parseInt(mynumber.charAt(i)) * weights[i];
  }
  const remainder = sum % 11;
  return (remainder <= 1) ? 0 : (11 - remainder);
}