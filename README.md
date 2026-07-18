# 千里の道も一歩から

歩数を距離（km）に換算し、日本国内や世界中の目的地を目指して仮想徒歩の旅を楽しむ PWA / ネイティブアプリです。

## 有料 note での販売（Android ネイティブ版）

本アプリは **Capacitor ネイティブアプリ** です。UI を APK に同梱し、端末センサーでバックグラウンド歩数計測を行います。

| 構成 | 説明 |
|------|------|
| **ネイティブ APK（デフォルト）** | `www/` を APK に同梱。オフラインでも起動 |
| **歩数計測** | Android 端末センサー + フォアグラウンドサービス |
| **購入者向け** | `install-android.html` から APK 配布 |

> UI 更新時は `npm run cap:build:apk` で APK を再ビルドし配布してください。  
> （`CAP_REMOTE=1` で Vercel 読み込みのリモートシェルにも切り替え可能）

### APK ビルド（ネイティブアプリ化）

```bash
npm install
npm run cap:build:apk
```

出力: `www/download/senrinomiti.apk`

### 購入者に渡す URL

note 記事には主に以下を掲載します（`note-article-template.txt` 参照）:

- **インストールページ**: `https://senrinomiti.vercel.app/install-android.html`
- 利用規約: `/terms.html`
- プライバシーポリシー: `/privacy.html`

`npm run build:web` 実行後、`note-article-filled.txt` に URL 入りの記事テンプレートが生成されます。

---

## 販売者向け：初回セットアップ

### 1. 依存関係

```bash
npm install
```

### 2. 公開 URL の設定

`deploy.config.json` を編集:

```json
{
  "productionUrl": "https://senrinomiti.vercel.app",
  "appVersion": "1.0.0",
  "androidVersionCode": 10000,
  "androidApkUrl": "https://senrinomiti.vercel.app/download/senrinomiti.apk",
  "installPagePath": "/install-android.html"
}
```

### 3. リリース署名（初回のみ）

```bash
# キーストア作成
keytool -genkey -v -keystore android/senrinomiti-release.keystore -alias senrinomiti -keyalg RSA -keysize 2048 -validity 10000

# 設定ファイル
cp android/keystore.properties.example android/keystore.properties
# → storeFile, パスワード等を編集
```

### 4. APK ビルド

**JDK 17+** と **Android SDK** が必要です。

```bash
npm run cap:build:apk
```

出力: `www/download/senrinomiti.apk`

Android Studio を使う場合:

```bash
npm run cap:build:shell
# Android Studio → Build → Build Bundle(s) / APK(s) → Build APK(s)
npm run copy:apk path/to/app-release.apk
```

### 5. Vercel へデプロイ

```bash
npm run deploy:note
# → www/ に Web + APK が揃う状態
# Vercel にデプロイ（Git push または vercel CLI）
```

---

## 日常の更新フロー

| 変更内容 | 必要な作業 |
|----------|------------|
| UI・機能・文言 | `npm run cap:build:apk` → 新 APK を配布 |
| ネイティブ（Java/Kotlin） | 同上 |
| Web版のみ（Vercel） | `npm run build:web` → Vercel デプロイ |

リモートシェル（APK 再配布なしで UI 更新）を使う場合:

```bash
npm run cap:sync:remote
# → Vercel URL から UI を読み込む APK をビルド
```

---

## 万歩計

- **Android アプリ版（推奨）**: バックグラウンドで端末センサーにより毎日計測
- **iPhone アプリ版**: Core Motion で本日の歩数を記録（Mac + Xcode が必要）
- **ブラウザ版**: 画面表示中のみ（Android 購入者は APK を案内）

### Android 版の動作

1. 初回起動で「身体活動」「通知」を許可
2. 通知バーに「万歩計 計測中」と表示
3. 画面を消しても歩数が記録され、旅に反映

---

## ローカル開発

```bash
python -m http.server 8080
# http://localhost:8080
```

Capacitor 開発:

```bash
npm run cap:sync:android:local   # 端末内蔵 www
npm run cap:open:android
```

---

## 技術構成

- Vanilla HTML / CSS / JavaScript (ES Modules)
- Capacitor 7（Android / iOS）
- Leaflet.js + OpenStreetMap
- Vercel（Web ホスティング + APK 配布）

## スクリプト一覧

| コマンド | 説明 |
|----------|------|
| `npm run build:web` | ソース → www/ 同期 |
| `npm run cap:build:apk` | 署名付き APK ビルド + www/download/ 配置 |
| `npm run deploy:note` | APK コピー + Web ビルド |
| `npm run cap:build:shell` | Android Studio を開く |
| `npm run copy:apk [path]` | 手動ビルド APK を www/ へコピー |
