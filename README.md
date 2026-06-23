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

章の中から特定のスクリーンショットだけ撮影したい場合は、`shots[].id` を指定します。

```bash
npm run screenshots:02 -- 2-3-wp-admin-bar-site-name-hover
```

複数指定したい場合は、ID を続けて指定します。

```bash
npm run screenshots:02 -- 2-3-wp-admin-bar-site-name-hover 2-3-wp-admin-bar-new-content
```

各スクリーンショットは、`article/*/screenshots.yaml` の `output` に指定したパスへそのまま書き出されます。書籍バージョンごとに画像を分けたい場合は、`output: images/7.0/example.jpg` のように保存先ディレクトリまで含めて指定します。

各スクリーンショットには、必要に応じて `memo` を残せます。`memo` は撮影処理には使われず、制作上のメモとして扱います。

特定のスクリーンショットだけ別の `wp-env` 環境で撮影したい場合は、shot に `wpEnv` を指定します。`config` には使用する wp-env 設定ファイル、`baseUrl` にはその環境の URL を指定します。`start: true` を指定すると、撮影前にその環境を起動します。

```yaml
wpEnv:
  config: .wp-env.6.9.json
  baseUrl: http://localhost:8892
  start: true
```

特定の要素にマウスをホバーした状態で撮影したい場合は、`actions` に `hover` を指定します。ホバー後に表示されるメニューやツールチップを待つ場合は、続けて `delay` を指定します。

```yaml
actions:
  - type: hover
    selector: "#wp-admin-bar-site-name"
  - type: delay
    ms: 300
```

ホバーで表示されたサブメニュー内の項目など、クリックせずにキーボードフォーカスを当てた状態を撮影したい場合は、`hover` の後に `focus` を指定します。

```yaml
actions:
  - type: hover
    selector: "#wp-admin-bar-site-name"
  - type: waitFor
    selector: "#wp-admin-bar-view-site a"
  - type: focus
    selector: "#wp-admin-bar-view-site a"
```

Playwright のマウス操作ではクリックしづらい管理画面の行アクションなどは、`click` に `method: dom` を指定すると要素の DOM click を実行できます。通常は指定せず、必要な shot だけに使います。

```yaml
actions:
  - type: click
    selector: ".button-link.editinline"
    method: dom
```

撮影前に WordPress の option を変更したい場合は、shot に `wpOptions` を指定します。指定がない shot では option を変更せず、現在のデータベースの状態をそのまま使います。

```yaml
wpOptions:
  auto_update_core_major: disabled
```

たとえば、`auto_update_core_major: enabled` はメジャーアップデートを含む自動更新、`auto_update_core_major: disabled` はメンテナンスリリースとセキュリティリリースのみの自動更新を撮影したい場合に使えます。

撮影前に有効化するテーマを指定したい場合は、`wpTheme` にテーマのスラッグを指定します。章全体で同じテーマを使う場合は `defaults.wpTheme`、特定の shot だけ切り替えたい場合は shot の `wpTheme` に指定します。指定がない shot では、現在有効化されているテーマをそのまま使います。特定のバージョンをインストールしてから有効化したい場合は、`slug` と `version` を指定します。`version` は YAML の数値変換を避けるため、引用符付きで指定します。

```yaml
defaults:
  wpTheme: twentytwentyfive

shots:
  - id: front-page-with-classic-theme
    wpTheme:
      slug: twentytwentyone
      version: "2.7"
    url: /
    output: images/7.0/front-page-with-classic-theme.jpg
```

撮影前にプラグインを指定した状態にしたい場合は、`wpPlugins` に配列で指定します。`version` を指定すると、そのバージョンをインストールしてから有効化または無効化します。`active` を省略した場合は `true` として扱います。プラグインをインストール済みにして無効化状態を撮影したい場合は、`active: false` を指定します。

```yaml
defaults:
  wpPlugins:
    - slug: classic-editor
      version: "1.6.7"
      active: true

shots:
  - id: plugins-screen
    wpPlugins:
      - slug: classic-widgets
        version: "0.3"
        active: false
    url: /wp-admin/plugins.php
    output: images/7.0/plugins-screen.jpg
```

スクリーンショットを書き出した後に WordPress の状態を整えたい場合は、shot に `afterSnap` を指定します。たとえば、更新通知が表示されている状態を撮影したあと、更新可能なプラグインやテーマを最新版に戻し、不要になったプラグインを削除して、最後に有効化テーマを切り替えられます。

```yaml
afterSnap:
  wpUpdates:
    plugins: true
    themes: true
  wpPluginsDelete:
    - contact-form-7
    - wp-multibyte-patch
  wpTheme: twentytwentyfive
```

`screenshot.focus` と `screenshot.zoom` を組み合わせると、通常のページレイアウトを保ったまま指定要素の周辺だけを拡大して書き出せます。`focus.width` / `focus.height` を省略すると、書き出し画角は `viewport` と同じになります。拡大時も指定要素の全体が収まるように切り抜き元の範囲を広げます。画質を上げたい場合は、`deviceScaleFactor` で元スクリーンショットの密度を上げ、`outputScale` で最終画像のピクセル数を増やします。

```yaml
screenshot:
  zoom: 1.5
  deviceScaleFactor: 2
  outputScale: 2
  focus:
    selector: "#dashboard_site_health"
```

要素に関係なく画面の一部を拡大したい場合は、`screenshot.clip` と `screenshot.zoom` を組み合わせます。以下は画面左上から `960x720` を切り出し、2倍に拡大して書き出します。

```yaml
screenshot:
  zoom: 2
  deviceScaleFactor: 2
  outputScale: 2
  clip:
    x: 0
    y: 0
    width: 960
    height: 720
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
