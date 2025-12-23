# はじめに
- 主な対象とする読者
- 本書では扱わない内容
- なぜ本書を執筆しようと思ったのか
- 執筆するにあたり意識したこと
- 理解を深められる読み進め方
    - WordPress Playground
    - Local by Flywheel または Studio by WordPress.com
    - ご自身が契約しているレンタルサーバー上
- 本書内容の動作確認環境
- サポートサイトについて
- お問い合わせについて

# WordPress とは
- テーマとプラグイン
- ブロックテーマとクラシックテーマ
- 標準テーマとは
- WordPress.org と WordPress.com の違い
- WordPress コミュニティ

# WordPress の管理画面について
## 管理画面トップページ `https://wordpress.org/documentation/article/administration-screens/`
- ツールバー
- メインナビゲーション（またはナビゲーションメニュー）
- ワークエリア `https://wordpress.org/documentation/article/dashboard-screen/`

## ダッシュボード `https://wordpress.org/documentation/article/administration-screens/#dashboard-information-central` `https://ja.wordpress.org/support/article/dashboard-screen/`
- サイトヘルス
- 概要
- アクティビティ
- クイックドラフト
- WordPress イベントとニュース

## ツールバー `https://wordpress.org/documentation/article/toolbar/` `https://wordpress.org/documentation/article/administration-screens/#toolbar-keeping-it-all-together`
- WordPress ロゴメニュー
    - WordPress について
        - 新着情報
        - クレジット
        - 自由について
        - プライバシー
        - 参加する
    - 参加する
    - WordPress.org
    - ドキュメンテーション
    - Learn WordPress
    - サポート
    - フィードバック
- サイト名
- コメント数表示
- 新規投稿等作成メニュー
- アカウント情報メニュー
    - プロフィールを編集
    - ログアウト
- 表示オプション `https://wordpress.org/documentation/article/administration-screens/#screen-options`
- ヘルプ `https://wordpress.org/documentation/article/administration-screens/#help`

## メインナビゲーション（ナビゲーションメニュー）
### ダッシュボード
- ホーム（上記ダッシュボードを参照）
- 更新 `https://wordpress.org/documentation/article/dashboard-updates-screen/`

### 投稿
- 投稿一覧 `https://wordpress.org/documentation/article/posts-screen/`
- 投稿を追加（ブロックエディターを開く）
- カテゴリー `https://wordpress.org/documentation/article/posts-categories-screen/`
- タグ `https://wordpress.org/documentation/article/posts-tags-screen/`

### メディア
- ライブラリ `https://wordpress.org/documentation/article/media-library-screen/`
- メディアファイルを追加 `https://wordpress.org/documentation/article/media-add-new-screen/`

### 固定ページ
- 固定ページ一覧 `https://wordpress.org/documentation/article/pages-screen/`
- 固定ページを追加（ブロックエディターを開く）

### コメント
- `https://wordpress.org/documentation/article/comments-screen/`

### 外観
#### ブロックテーマを有効化している場合
- テーマ `https://wordpress.org/documentation/article/appearance-themes-screen/`
- エディター （サイトエディターが開く）

#### クラシックテーマを有効化している場合
- テーマ `https://wordpress.org/documentation/article/appearance-themes-screen/`
- デザイン （サイトエディターライクなスタイルとパターンの管理画面が開く）
- カスタマイズ `https://wordpress.org/documentation/article/customizer/`
- ウィジェット `https://wordpress.org/documentation/article/block-based-widgets-editor/` `https://wordpress.org/documentation/article/appearance-widgets-screen-classic-editor/`
- メニュー `https://wordpress.org/documentation/article/appearance-menus-screen/`
- 背景（背景画像とカスタム背景）
- テーマファイルエディター `https://wordpress.org/documentation/article/appearance-theme-file-editor-screen/`

### プラグイン
- インストール済みプラグイン `https://wordpress.org/documentation/article/plugins-screen/`
- プラグインを追加 `https://wordpress.org/documentation/article/plugins-add-new-screen/`

### ユーザー
- ユーザー一覧 `https://wordpress.org/documentation/article/users-screen/`
- ユーザーを追加 `https://wordpress.org/documentation/article/users-add-new-screen/`
- プロフィール `https://wordpress.org/documentation/article/users-your-profile-screen/`

### ツール
- 利用可能なツール `https://wordpress.org/documentation/article/tools-screen/`
- インポート `https://wordpress.org/documentation/article/tools-import-screen/`
- エクスポート `https://wordpress.org/documentation/article/tools-export-screen/`
- サイトヘルス `https://wordpress.org/documentation/article/site-health-screen/`
- 個人データのエクスポート `https://wordpress.org/documentation/article/tools-export-personal-data-screen/`
- 個人データの消去 `https://wordpress.org/documentation/article/tools-erase-personal-data-screen/`
- テーマファイルエディター `https://wordpress.org/documentation/article/appearance-theme-file-editor-screen/`
- プラグインファイルエディター ``

### 設定
- 一般 `https://wordpress.org/documentation/article/settings-general-screen/`
- 投稿設定 `https://wordpress.org/documentation/article/settings-writing-screen/`
- 表示設定 `https://wordpress.org/documentation/article/settings-reading-screen/`
- ディスカッション `https://wordpress.org/documentation/article/settings-discussion-screen/`
- メディア `https://wordpress.org/documentation/article/settings-media-screen/`
- パーマリンク `https://wordpress.org/documentation/article/settings-permalinks-screen/`
- プライバシー `https://wordpress.org/documentation/article/settings-privacy-screen/`

# サイトエディターについて `https://wordpress.org/documentation/article/site-editor/`
- サイトエディターとは
- サイトエディターにアクセスするためには
- 左サイドバーのメニュー
  - WordPress ロゴメニュー
  - サイト名
  - コマンドパレットを開く
  - スタイル
  - ナビゲーション
  - 固定ページ
  - テンプレート
  - パターン
- トップツールバー
  - WordPress ロゴメニュー（ナビゲーションを開く）
  - ブロックインサーター
  - 元に戻す
  - やり直す
  - ドキュメント概観
  - コマンドパレット
  - 表示
  - ズームアウト
  - スタイル（右サイドバー）
    - スタイルブック
    - リビジョン
    - さらに表示
      - 追加CSS
      - ウェルカムガイド
      - スタイルをリセット
    - スタイル一覧へ
    - タイポグラフィ
    - 色
    - 背景
    - 影
    - レイアウト
    - ブロック
  - 設定（右サイドバー）
    - テンプレートタブ
      - テンプレートの情報
      - コンテンツ
      - デザイン
    - ブロックタブ
      - 選択しているブロックで設定可能な情報が表示される。詳しくはコアブロックを使ってみようで。
  - 保存
  - オプション
    - トップツールバー
    - 集中執筆
    - スポットライトモード
    - ビジュアルエディター
    - コードエディター
    - スタイル
    - キーボードショートカット
    - すべてのブロックをコピー
    - ヘルプ
    - エクスポート
    - ウェルカムガイド
    - 設定
      - 一般
        - 常にリストビューを開く
        - ブロックのパンくずリストを表示
        - 右クリックでコンテキストメニューを表示
        - スターターパターンを表示
        - 抜粋
        - 公開前チェックを有効化
      - 外観
        - トップツールバー
        - 集中執筆
        - スポットライトモード
      - アクセシビリティ
        - ブロック内にテキストカーソルを含める
        - ボタンテキストラベルを表示
      - ブロック
        - よく使用されるブロックを表示
        - ブロックの可視性を管理

# ブロックエディターについて `https://wordpress.org/documentation/article/wordpress-block-editor/`
- ブロックエディターとは
- トップツールバー
  - WordPress ロゴメニュー
  - ブロックインサーター
  - 元に戻す
  - やり直す
  - ドキュメント概観
  - コマンドパレット
  - 下書き保存
  - 表示
  - 設定
  - 公開・更新
  - オプション（サイトエディターにはないもののみ紹介）
    - フルスクリーンモード
    - パターンの管理
    - 設定
      - 一般
        - 文書設定
        - カスタムフィールド
      - 外観
        - テーマスタイルの使用
- 右サイドバー
  - 投稿タブ
    - 投稿情報
      - タイトル（３点メニューボタンの内容にも触れる）
      - アイキャッチ画像
      - 抜粋
      - ステータス
      - 公開
      - スラッグ
      - 投稿者
      - テンプレート
      - ディスカッション
      - フォーマット
      - ゴミ箱へ移動
    - カテゴリー
    - タグ
  - ブロックタブ
    - 選択しているブロックで利用できるメニューが表示される。詳しくはコアブロックを使ってみようで。

# コアブロックを使ってみよう
## ツールバーとインスペクターについて
- ツールバーについて
  - 変換
  - ドラッグハンドル
  - 上下に移動
  - さらに表示
    - インラインコード
    - インライン画像
    - キーボード入力
    - ハイライト
    - 上付き
    - 下付き
    - 打ち消し線
    - 数式
    - 脚注
    - 言語
  - オプション
    - コピー
    - 切り取り
    - 複製
    - 前に追加
    - 後に追加
    - ノートを追加
    - スタイルをコピー
    - スタイルを貼り付け
    - グループ化
    - ロック
    - 名前を変更
    - 非表示
    - パターンを作成
    - HTML として編集
    - 削除
- インスペクターについて（ブロックパネル、スタイルと設定）

## 段落ブロック
- 伸縮する段落ブロック
### ツールバー
- テキストの配置
- 太字
- イタリック
- リンク
- その他

### ブロックパネル
- スタイル
- 色
- タイポグラフィ
- サイズ
- 枠線
- 高度な設定

## 見出しブロック
- 伸縮する見出しブロック
### ツールバー
- 配置
- テキストの配置
- 太字
- イタリック
- リンク
- その他

### ブロックパネル
- スタイル
- 色
- タイポグラフィ
- サイズ
- 枠線
- 高度な設定

## リストブロック
子ブロックとして「リスト項目ブロック」がある

### ツールバー
- 順序なしリスト
- 順序ありリスト
- インデント解除
  - 一つ以上インデントされているリストブロックでのみ有効化になる

### ブロックパネル
- スタイル
- 色
- タイポグラフィ
- サイズ
- 枠線
- 高度な設定

## リスト項目ブロック
### ツールバー
- インデント解除
- インデント
- 太字
- イタリック
- リンク

### ブロックパネル
- 色
- タイポグラフィ
- サイズ
- 枠線
- 高度な設定

## 画像ブロック
### ツールバー
- 配置
- デュオトーンフィルターを適応
- リンク
- 切り抜き
- 画像上にテキストを追加
- キャプションを追加
- 置換

### ブロックパネル
#### 設定タブ
- 設定
  - 代替テキスト
  - アスペクト比
  - 幅
  - 高さ
  - 解像度
- 高度な設定
  - HTML アンカー
  - 追加 CSS クラス
  - タイトル属性

#### スタイルタブ
- スタイル
- フィルター
- サイズ
- 枠線と影

## カバーブロック
### ツールバー
- 配置
- デュオトーンフィルターを適応
- コンテンツ位置を変更
- フルハイト
- 置換

### ブロックパネル
#### 設定タブ
- レイアウト
  - コンテンツ幅を使用するインナーブロック
  - コンテンツ幅
  - 幅広
- 設定
  - 固定背景
  - 繰り返し背景
  - フォーカルポイント
  - 左
  - 上
  - 代替テキスト
  - 解像度
- 高度な設定
  - HTML アンカー
  - 追加 CSS クラス
  - HTML 要素
  - 許可されたブロック

#### スタイルタブ
- 色
  - テキスト
  - 見出し
  - オーバーレイ
  - オーバーレイの不透明度
- フィルター
- タイポグラフィ
- サイズ
  - パディング
  - マージン
  - ブロックの間隔
  - アスペクト比
  - 最小の高さ
- 枠線と影
  - 枠線
  - 角丸

## メディアとテキスト
### ツールバー
- 配置
- 垂直配置を変更
- メディアを左に表示（デフォルト）
- メディアを右に表示
- リンク
- 置換

### ブロックパネル
#### 設定タブ
- 設定
  - メディアの幅
  - モバイルでは縦に並べる
  - 画像を切り抜いて調整
  - 代替テキスト
  - 解像度
- 高度な設定
  - HTML アンカー
  - 追加 CSS クラス
  - 許可されたブロック

#### スタイルタブ
- 色
  - テキスト
  - 背景
- タイポグラフィ
  - フォントサイズ
- サイズ
  - パディング
  - マージン
- 枠線
  - 角丸

# 簡単なウェブサイトを作ってみよう
- 概要
- 準備
  - 完成ウェブサイトのイメージとウェブサイト構成
  - 用意する投稿と固定ページ
  - 本書に沿って制作をされる方へ
  - 各種設定の確認
      - 一般設定
      - 表示設定
  - 日本語フォントの導入
  - 配色や要素の設定
- テンプレートパーツのカスタマイズ
  - テンプレートパーツの確認
  - ヘッダーのカスタマイズ
  - フッターのカスタマイズ
- フロントページテンプレートの作成
- 固定ページテンプレートのカスタマイズ
- フロントページを作る
- 業務内容ページを作る
- まとめ

# WordPress を運用するために知っておくと良いこと
- WordPressは「運用して育てる」CMS 
- アップデートとバックアップは必須 
- セキュリティは“ほどほど”が一番強い 
- プラグイン・テーマは慎重に 
- コンテンツは資産になる 
- 管理体制を決めておく 
- 困ったときの考え方 
- WordPressに固執しないという選択