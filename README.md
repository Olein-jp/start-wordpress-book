# これからはじめる WordPress - WordPress 6.9 対応

WordPress の基本的な使い方をしっかり学べる書籍です。

## 目次

目次は[こちら](toc.md)から。

## WordPress 環境

スクリーンショット撮影用の WordPress は `wp-env` で起動します。

```bash
npm run env:start
```

起動後、WordPress は `http://localhost:8889` で開けます。管理画面の初期ログイン情報は `admin` / `password` です。起動時に WordPress のサイト言語は日本語に設定されます。

スクリーンショット撮影は以下で実行します。

```bash
npm run screenshots
```

個別の章だけ撮影したい場合は以下のように実行します。

```bash
npm run screenshots:02
```

各スクリーンショットは、`article/*/screenshots.yaml` の `output` に指定したパスへそのまま書き出されます。書籍バージョンごとに画像を分けたい場合は、`output: images/7.0/example.jpg` のように保存先ディレクトリまで含めて指定します。

各スクリーンショットには、必要に応じて `memo` を残せます。`memo` は撮影処理には使われず、制作上のメモとして扱います。

特定の要素にマウスをホバーした状態で撮影したい場合は、`actions` に `hover` を指定します。ホバー後に表示されるメニューやツールチップを待つ場合は、続けて `delay` を指定します。

```yaml
actions:
  - type: hover
    selector: "#wp-admin-bar-site-name"
  - type: delay
    ms: 300
```

`screenshot.focus` と `screenshot.zoom` を組み合わせると、通常のページレイアウトを保ったまま指定要素の周辺だけを拡大して書き出せます。`focus.width` / `focus.height` を省略すると、書き出し画角は `viewport` と同じになります。拡大時の画質を上げたい場合は、`deviceScaleFactor` で元スクリーンショットの密度を上げ、`outputScale` で最終画像のピクセル数を増やします。

```yaml
screenshot:
  zoom: 1.5
  deviceScaleFactor: 2
  outputScale: 2
  focus:
    selector: "#dashboard_site_health"
```

データベースをリポジトリ管理用にエクスポートする場合は以下を実行します。

```bash
npm run db:export
```

エクスポート先は `database/start-wordpress-book.sql` です。

エクスポート済みのデータベースを `wp-env` に戻す場合は以下を実行します。現在の `wp-env` データベースを上書きします。

```bash
npm run db:import -- --yes
```

撮影対象を別の WordPress にしたい場合は、`WP_BASE_URL` を指定します。

```bash
WP_BASE_URL=http://example.local npm run screenshots
```
