/**
 * QRコードリダイレクト＆アクセス記録システム用Google Apps Script
 * スプレッドシートID: 1vsgitiR7nZK4Bl9VKMuDLJJGK_y7hgkfJ9S5ZGCfyQ4
 * シート名: check
 */

// スプレッドシートの設定
const SPREADSHEET_ID = '1vsgitiR7nZK4Bl9VKMuDLJJGK_y7hgkfJ9S5ZGCfyQ4';
const SHEET_NAME = 'check';

/**
 * Webアプリケーションとして公開した際のエントリーポイント
 * HTTPリクエストを処理し、アクセス情報を記録する
 */
function doGet(e) {
  try {
    // リクエストからターゲットURLを取得
    const targetURL = e.parameter.targetURL;

    if (!targetURL) {
      return ContentService.createTextOutput(
        JSON.stringify({ status: 'error', message: 'ターゲットURLが指定されていません' })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    // スプレッドシートにアクセス情報を記録
    recordAccess(targetURL);

    // 正常に処理された旨を返す
    return ContentService.createTextOutput(
      JSON.stringify({ status: 'success', message: 'アクセスが記録されました' })
    ).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    // エラーが発生した場合はエラーメッセージを返す
    return ContentService.createTextOutput(
      JSON.stringify({ status: 'error', message: error.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * スプレッドシートにアクセス情報を記録する
 * @param {string} targetURL - リダイレクト先のURL
 */
function recordAccess(targetURL) {
  // スプレッドシートを開く
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = spreadsheet.getSheetByName(SHEET_NAME);

  if (!sheet) {
    throw new Error(`シート "${SHEET_NAME}" が見つかりません`);
  }

  // 現在のタイムスタンプを取得
  const timestamp = new Date();

  // スプレッドシートに新しい行を追加
  sheet.appendRow([timestamp, targetURL]);
}

/**
 * スプレッドシートの設定を確認するためのテスト関数
 * スクリプトエディタから手動で実行して動作確認ができます
 */
function testSpreadsheetAccess() {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(SHEET_NAME);

    if (!sheet) {
      Logger.log(`シート "${SHEET_NAME}" が見つかりません`);
      return;
    }

    Logger.log('スプレッドシートへのアクセステスト成功');
    Logger.log(`シート名: ${sheet.getName()}`);
    Logger.log(`最終行: ${sheet.getLastRow()}`);
    Logger.log(`最終列: ${sheet.getLastColumn()}`);

  } catch (error) {
    Logger.log(`エラー: ${error.toString()}`);
  }
}
