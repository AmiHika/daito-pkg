# QRコードリダイレクト＆アクセス記録システム

QRコードをスキャンした際に、アクセスを記録してから指定のページにリダイレクトするシステムです。Google スプレッドシートにアクセス情報を記録します。

## 機能

- QRコードからのアクセスを自動記録
- スプレッドシートへのアクセスログ保存（タイムスタンプ、ターゲットURL）
- カスタムURLへのリダイレクト機能

## 設定方法

### 1. Google Apps Script (GAS) の設定

1. [Google Apps Script](https://script.google.com/) にアクセスする
2. 新しいプロジェクトを作成する
3. `gas-code.js` ファイルの内容をコピーしてGASエディタに貼り付ける
4. `testSpreadsheetAccess` 関数を実行して、スプレッドシートへのアクセスを確認する
5. 「デプロイ」→「新しいデプロイ」を選択
6. 「ウェブアプリケーション」として設定
   - 次のユーザーとして実行: 自分
   - アクセスできるユーザー: 全員（匿名ユーザーを含む）
7. デプロイURLをメモする

### 2. QRコードの作成

以下のURLにアクセスするQRコードを作成します:

```
https://amihika.github.io/daito-pkg/
```

カスタムURLにリダイレクトさせたい場合は、以下のようにURLパラメータを追加します:

```
https://amihika.github.io/daito-pkg/?url=https://example.com
```

## ファイル構成

- `index.html` - リダイレクトページのHTML
- `css/style.css` - スタイルシート
- `js/redirect.js` - リダイレクトと記録処理のJavaScript
- `gas-code.js` - Google Apps Scriptのコード（参照用）
- `README.md` - 説明書

## 注意事項

- Google Apps Scriptは正しく設定し、公開する必要があります
- スプレッドシートIDは実際のものに変更してください
- リダイレクト先のデフォルトURLは必要に応じて変更してください
- Github Pagesの設定を有効にする必要があります
