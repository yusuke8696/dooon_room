# ROOM商品登録フロー

このディレクトリは、ChatGPTから登録された楽天ROOM投稿候補をIssueで受け取るためのものです。

## 流れ

1. 投稿者はChatGPTへ「商品URLまたは商品名・型番」と「推しポイント」「使用状況」を入力する。
2. ChatGPTは商品を特定し、楽天市場の同一商品を検索する。楽天URLは候補でよく、最終確認はレビュー時に行う。
3. ChatGPTは Issue テンプレートに沿って Issue を作成する。
4. ROOM投稿後、Issueへ ROOM URL を追記する。
5. レビュー済み情報を `content/products.json` に追加する Draft PR を作成する。
6. PRを確認して main にマージする。
7. main の商品データは、後続のブログ記事生成で再利用する。

## products.json への対応

Issue の情報は既存の `content/products.json` に合わせて次のように保存する。

- `id`: 商品を識別する半角英数・ハイフン
- `name`: 商品名
- `model`: 型番。不明なら空文字
- `jan`: JAN。不明なら空文字
- `category`: ブログ生成時の分類
- `description`: ROOM紹介文をベースにした商品説明
- `productUrl`: 確認済み楽天商品URL
- `roomUrl`: ROOM投稿後の個別URL
- `rakutenSearchKeyword`: 原則として型番。型番不明なら商品名など
- `a8RakutenSearchUrl`: A8.netで発行したURL。未発行なら空文字
- `notes`: 使用状況や確認事項

## 注意

- 入力元URLは楽天市場に限定しない。Amazon、メーカー公式、家電量販店などでもよい。
- 商品情報が完全に特定できなくてもIssue作成を止めない。
- 「使用中」と確認できない商品を、使用した商品として紹介しない。
- 楽天URLや型番などはPRレビュー時に人が確認する。
- A8.netのアフィリエイトURLを推測・自動生成しない。
