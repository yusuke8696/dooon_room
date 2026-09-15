# Doooon|スマートホーム研究室

GitHub Pages向け静的ブログ。Node.js 24推奨、外部パッケージ不要。

## 構成

- `content/site.json`: 名前・紹介文・ROOM URL・公開URL設定
- `content/products.json`: 商品名・型番・JAN・紹介文・各種URL
- `content/posts/*.json`: 記事のタイトル・日付・段落・商品ID
- `scripts/build.mjs`: HTMLとサイトマップ生成、データ検証
- `assets/style.css`: スマートフォン対応のデザイン
- `.github/workflows/pages.yml`: PRで検証、mainへマージ後に公開
- `dist/`: 生成物（コミット対象外）

## ローカル確認

```sh
node --test
node scripts/build.mjs
node scripts/serve.mjs
```

`http://127.0.0.1:4173/dooon_room/` を開きます。編集後は再ビルドします。npmがある環境では `npm test`、`npm run build`、`npm run preview` も使えます。

## 商品とA8.netリンクを更新

`content/products.json` の対象商品を編集します。

| フィールド | 内容 |
| --- | --- |
| `id` | 一意の半角英数・ハイフンID。記事が参照 |
| `name`, `model`, `jan` | 商品名・型番・JAN。未知の値は空文字 |
| `category`, `description` | 分類と紹介文 |
| `productUrl` | 通常の商品ページURL |
| `roomUrl` | 商品個別のROOM投稿URL（任意） |
| `rakutenSearchKeyword` | A8.netでURL発行時に使う型番検索語 |
| `a8RakutenSearchUrl` | ユーザーがA8.netで発行した完成済み楽天検索URL |
| `notes` | 管理メモ。サイトへ出力しません |

A8.net発行のHTTPS URLを `a8RakutenSearchUrl` にそのまま貼り付けます。aタグではなくURLだけを登録します。`&`を`&amp;`に変換する必要はありません。URLの自動生成や追跡パラメーターの変更は行いません。検索語だけを変えてもURLは変わらないため、A8.netで再発行して差し替えてください。

空欄なら広告ボタンは非表示。入力すると一覧と記事の両方に「楽天で型番検索（広告）」が表示され、`rel="sponsored nofollow noopener"` が付きます。ROOM全体への導線は常時表示します。

6商品の紹介文は過去の会話にある本人の選定理由・使用感を元にしています。商品URL5件は会話からの引き継ぎで、最新の販売状況は未確認です。ラインライトはJAN `4571557723583` のみ判明しているため、型番・検索語・商品URLは確認後に登録してください。`ARCHERBE805 126` は指定表記を保持しています。

## 記事を追加

`content/posts/2026-09-15-smart-home.json` をコピーして編集します。

- `slug`: URLに使う一意の半角英数・ハイフン文字列
- `title`, `date`, `excerpt`: タイトル、YYYY-MM-DDの日付、一覧用要約
- `draft`: `true` の記事はHTMLとサイトマップに出力しません
- `sections`: 見出し `heading`、プレーンテキスト段落の配列 `paragraphs`、任意の商品ID配列 `productIds`

HTMLはエスケープされます。商品紹介文は商品データを参照します。初期記事は `draft: false` です。公開前に文章を確認してください。

## 検索エンジン別サイトマップ

公開時に次のファイルを `dist/` へ自動生成します。記事を追加・公開すると全ファイルが同じ公開記事一覧から更新されます。下書き記事は含みません。

| ファイル | 登録先・形式 |
| --- | --- |
| `sitemap_google.xml` | Google Search Console。Google公式対応のUTF-8 XML（urlset / url / loc、絶対URL） |
| `sitemap_bing.xml` | Bing Webmaster Tools。既存サイトマップと同一の構成・内容 |
| `sitemap.xml` | 登録済みURLの互換性のため維持 |

マージ・公開後、Googleには `https://yusuke8696.github.io/dooon_room/sitemap_google.xml`、Bingには `https://yusuke8696.github.io/dooon_room/sitemap_bing.xml` を一度登録してください。Bingで既存の `sitemap.xml` を使用中なら、そのままでも構いません。ファイルは生成物なのでGitHubのソース一覧には表示されません。

既存XMLもGoogle対応形式です。Google版は見やすい改行を付けていますが、形式や掲載URLの意味は同じです。この変更は登録先URLを分けるもので、Googleの取得エラー解消を保証するものではありません。テキスト形式を使う場合は `.txt` が必要なため、指定された `.xml` 内にプレーンテキストは入れません。

仕様: [Google公式のサイトマップ形式](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap?hl=ja)

## GitHub Pages公開

1. Settings → Pages → Build and deployment → Source を **GitHub Actions** に設定。
2. 下書きPRを確認し、公開してよいタイミングでユーザーがmainへマージ。
3. `Build and deploy Pages` が成功すると `https://yusuke8696.github.io/dooon_room/` に公開。

PRではテストとビルドだけを実行し、mainへのマージ前に公開しません。mainはリポジトリ初期化用READMEから開始します。公開先を変える場合は `site.json` の `url` と `basePath` を更新します。

参考: [GitHub公式のPagesワークフロー](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
