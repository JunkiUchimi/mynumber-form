#!/bin/bash

# 固定の対象ポートを定義
PORT=8080

# IPv4アドレスを取得
IP_ADDRESS=$(ifconfig | grep inet | grep -v 127.0.0.1 | grep -v inet6 | awk '{ print $2 }')

# 一時的なpfルールファイルを作成
TEMP_PF_CONF=$(mktemp /tmp/pf.conf.XXXXXX)

# 既存のpf.confの内容を一時ファイルにコピー
sudo cp /etc/pf.conf $TEMP_PF_CONF

# 既存のrdrルールを検索して、その後に新しいルールを追加
sudo awk '/rdr/ {print; print "rdr pass on lo0 inet proto tcp from any to any port '$PORT' -> '$IP_ADDRESS' port '$PORT'"; next}1' $TEMP_PF_CONF > ${TEMP_PF_CONF}.new

# 一時ファイルからpfルールを読み込む
sudo pfctl -nf ${TEMP_PF_CONF}.new
if [ $? -eq 0 ]; then
    sudo pfctl -f ${TEMP_PF_CONF}.new
    echo "ポート $PORT へのポートフォワーディングルールを IP アドレス $IP_ADDRESS に追加しました。"
else
    echo "エラー: PFルールの構文エラーが検出されました。"
fi

# 一時ファイルを削除
rm $TEMP_PF_CONF ${TEMP_PF_CONF}.new

echo "ポートフォワーディングの設定が完了しました。"
