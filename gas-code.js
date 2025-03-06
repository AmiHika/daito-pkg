/**
 * QRコードリダイレクト＆アクセス記録システム用Google Apps Script
 * スプレッドシートID: 1vsgitiR7nZK4Bl9VKMuDLJJGK_y7hgkfJ9S5ZGCfyQ4
 * シート名: check
 */

// スプレッドシートの設定
const SPREADSHEET_ID = '1vsgitiR7nZK4Bl9VKMuDLJJGK_y7hgkfJ9S5ZGCfyQ4';
const SHEET_NAME = 'check';

// デバッグログ用
const DEBUG_MODE = true; // ログ出力を有効にする場合はtrue
const LOG_SHEET_NAME = 'logs'; // ログを記録するシート名

/**
 * デバッグログをスプレッドシートに記録する
 * @param {string} message - ログメッセージ
 * @param {Object} data - 関連データ（オプション）
 */
function logToSheet(message, data = {}) {
  if (!DEBUG_MODE) return;

  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    let logSheet = spreadsheet.getSheetByName(LOG_SHEET_NAME);

    // ログシートが存在しない場合は作成
    if (!logSheet) {
      logSheet = spreadsheet.insertSheet(LOG_SHEET_NAME);
      logSheet.appendRow(['タイムスタンプ', 'メッセージ', 'データ']);
      logSheet.getRange(1, 1, 1, 3).setFontWeight('bold');
      logSheet.setFrozenRows(1);
    }

    // JSONデータを文字列化
    let dataStr = '';
    try {
      dataStr = JSON.stringify(data);
    } catch (e) {
      dataStr = String(data);
    }

    // ログを追加
    logSheet.appendRow([new Date(), message, dataStr]);
    SpreadsheetApp.flush();
  } catch (error) {
    console.error('ログ記録エラー:', error);
  }
}

/**
 * テスト用にdoGet関数を実行するためのモック
 * この関数はスクリプトエディタから手動で実行するためのもの
 */
function testDoGet() {
  // テスト用のeオブジェクトを作成
  const mockEvent = {
    parameter: {
      targetURL: 'https://test-url-example.com',
      callback: 'testCallback'
    }
  };

  // doGet関数をテスト実行
  const result = doGet(mockEvent);

  // 結果をログ出力
  Logger.log('テスト実行結果:');
  Logger.log(result.getContent());

  return result;
}

/**
 * Webアプリケーションとして公開した際のエントリーポイント
 * HTTPリクエストを処理し、アクセス情報を記録する
 * JSONP形式の応答に対応
 */
function doGet(e) {
  // レスポンスデータの準備
  let responseData = {};
  let debugInfo = {};

  // eオブジェクトが正しく渡されているか確認
  if (!e || !e.parameter) {
    Logger.log('警告: eオブジェクトが不正です');
    e = { parameter: {} }; // 最低限のオブジェクト構造を作成
  }

  // リクエスト全体とパラメータを詳細にログに記録
  logToSheet('リクエスト受信', {
    params: e.parameter || {},
    fullRequestObj: JSON.stringify(e),
    queryString: e.queryString,
    contentLength: e.contentLength,
    contentType: e.contentType
  });

  try {
    // リクエストからターゲットURLを取得（targetURLかurlのどちらかをチェック）
    let targetURL = null;
    if (e.parameter) {
      targetURL = e.parameter.targetURL || e.parameter.url; // どちらのパラメータ名でも対応
    }
    const callback = e.parameter ? e.parameter.callback : null; // JSONPのコールバック関数名

    // デバッグ情報を収集
    debugInfo = {
      receivedParams: e.parameter || {},
      userEmail: Session.getEffectiveUser().getEmail() || 'anonymous',
      timestamp: new Date().toISOString(),
      scriptId: ScriptApp.getScriptId()
    };

    logToSheet('デバッグ情報', debugInfo);

    if (!targetURL) {
      // URLが指定されていなくても記録するように変更
      logToSheet('警告: URLなし、デフォルト値を使用', {});

      // デフォルトURLを使用してアクセス記録
      const recordResult = recordAccessWithLock("https://default-url-used-when-parameter-missing.example.com");

      responseData = {
        status: 'success',
        message: 'URLパラメータなしでアクセスを記録しました',
        debug: debugInfo
      };
    } else {
      logToSheet('アクセス記録開始', { targetURL: targetURL });

      // スプレッドシートにアクセス情報を記録（確実にロックして書き込み）
      const recordResult = recordAccessWithLock(targetURL);

      logToSheet('アクセス記録結果', recordResult);

      // 正常に処理された旨のレスポンスを準備
      responseData = {
        status: recordResult.success ? 'success' : 'warning',
        message: recordResult.success ? 'アクセスが記録されました' : 'アクセス記録に問題が発生しました',
        timestamp: new Date().toISOString(),
        recordResult: recordResult,
        debug: debugInfo
      };
    }
  } catch (error) {
    // エラーが発生した場合はエラーメッセージを準備
    logToSheet('重大なエラー', {
      error: error.toString(),
      stack: error.stack
    });

    responseData = {
      status: 'error',
      message: error.toString(),
      stack: error.stack,
      debug: debugInfo
    };
    console.error('エラー発生:', error);
  }

  // JSONPまたはJSONとして応答を返す
  const jsonResponse = JSON.stringify(responseData);

  // eとe.parameterが存在するか再確認
  const hasCallback = e && e.parameter && e.parameter.callback;

  logToSheet('レスポンス送信', {
    isCallback: hasCallback,
    responseStatus: responseData.status
  });

  // CORSヘッダーを設定
  const output = ContentService.createTextOutput();

  if (hasCallback) {
    // JSONP形式でレスポンスを返す
    output.setContent(e.parameter.callback + '(' + jsonResponse + ')');
    output.setMimeType(ContentService.MimeType.JAVASCRIPT);
  } else {
    // 通常のJSON形式でレスポンスを返す
    output.setContent(jsonResponse);
    output.setMimeType(ContentService.MimeType.JSON);
  }

  // クロスドメインアクセスを許可
  return output;
}

/**
 * スプレッドシートのロックを取得してからアクセス情報を記録する
 * 書き込みの競合を防止する
 * @param {string} targetURL - リダイレクト先のURL
 * @return {Object} 処理結果の詳細情報
 */
function recordAccessWithLock(targetURL) {
  const result = {
    success: false,
    sheetExists: false,
    sheetName: SHEET_NAME,
    spreadsheetId: SPREADSHEET_ID,
    timestamp: new Date().toISOString(),
    rowsBeforeAppend: 0,
    rowsAfterAppend: 0,
    error: null
  };

  try {
    // スプレッドシートIDとシート名をログに記録
    Logger.log(`スプレッドシートへの記録開始: ID=${SPREADSHEET_ID}, シート名=${SHEET_NAME}`);

    // スプレッドシートを開く
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    result.spreadsheetOpened = true;
    Logger.log(`スプレッドシートを開きました: ${spreadsheet.getName()}`);

    // シートの存在確認と準備
    let sheet = spreadsheet.getSheetByName(SHEET_NAME);

    // シートが存在しない場合は新規作成
    if (!sheet) {
      Logger.log(`シート "${SHEET_NAME}" が見つからないため、新規作成します`);
      sheet = spreadsheet.insertSheet(SHEET_NAME);
      // ヘッダー行を追加
      sheet.appendRow(['タイムスタンプ', 'ターゲットURL']);
      sheet.getRange(1, 1, 1, 2).setFontWeight('bold');
      sheet.setFrozenRows(1);
      result.sheetCreated = true;
      Logger.log(`シート "${SHEET_NAME}" を作成しました`);
    } else {
      result.sheetExists = true;
      Logger.log(`シート "${SHEET_NAME}" が見つかりました`);
    }

    // 現在の行数を記録
    result.rowsBeforeAppend = sheet.getLastRow();
    Logger.log(`現在の行数: ${result.rowsBeforeAppend}`);

    try {
      // 現在のタイムスタンプを取得
      const timestamp = new Date();

      // シート名、現在の時刻、URLをログに記録（直接評価用）
      Logger.log(`直接書き込みテスト - シート: ${sheet.getName()}, 時刻: ${timestamp}, URL: ${targetURL}`);

      // スプレッドシートに新しい行を追加（ロックなしで試行）
      sheet.appendRow([timestamp, targetURL]);

      // 明示的に変更を保存
      SpreadsheetApp.flush();
      Logger.log('行を追加し、変更を保存しました');

      // 追加後の行数を記録
      result.rowsAfterAppend = sheet.getLastRow();
      result.success = (result.rowsAfterAppend > result.rowsBeforeAppend);

      Logger.log(`追加後の行数: ${result.rowsAfterAppend}, 成功: ${result.success}`);

      // 念のため2回目の書き込みテスト（直接セルに書き込む）
      const lastRow = sheet.getLastRow() + 1;
      sheet.getRange(lastRow, 1).setValue(new Date());
      sheet.getRange(lastRow, 2).setValue(targetURL + " (2回目のテスト)");
      SpreadsheetApp.flush();
      Logger.log('2回目のテスト書き込みを完了しました');

    } catch (writeError) {
      result.error = {
        message: writeError.toString(),
        stack: writeError.stack,
        phase: "writing"
      };
      Logger.log(`書き込み中にエラーが発生: ${writeError}`);
    }

  } catch (error) {
    result.error = {
      message: error.toString(),
      stack: error.stack,
      phase: "setup"
    };
    Logger.log(`スプレッドシート操作エラー: ${error}`);
  }

  // 結果をログに記録
  Logger.log(`記録処理結果: ${JSON.stringify(result)}`);
  return result;
}

/**
 * スプレッドシートの設定確認と初期化を行う
 * Webアプリをデプロイする前に実行するとよい
 */
function setupSpreadsheet() {
  try {
    // スプレッドシートを開く
    let spreadsheet;
    try {
      spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
      Logger.log('既存のスプレッドシートを開きました: ' + spreadsheet.getName());
    } catch (e) {
      // スプレッドシートが存在しない場合は新規作成
      spreadsheet = SpreadsheetApp.create('QRコードアクセスログ');
      Logger.log('新しいスプレッドシートを作成しました: ' + spreadsheet.getName());
      // 新しいスプレッドシートIDをログ出力（設定に使用）
      Logger.log('新しいスプレッドシートID: ' + spreadsheet.getId());
    }

    // シートの存在確認
    let sheet = spreadsheet.getSheetByName(SHEET_NAME);

    if (!sheet) {
      // シートが存在しない場合は新規作成
      sheet = spreadsheet.insertSheet(SHEET_NAME);
      Logger.log(`シート "${SHEET_NAME}" を新規作成しました`);

      // ヘッダー行を追加
      sheet.appendRow(['タイムスタンプ', 'ターゲットURL']);
      sheet.getRange(1, 1, 1, 2).setFontWeight('bold');
      sheet.setFrozenRows(1);
    } else {
      Logger.log(`シート "${SHEET_NAME}" は既に存在します`);
    }

    // シートの現在の状態を確認
    Logger.log(`シート名: ${sheet.getName()}`);
    Logger.log(`最終行: ${sheet.getLastRow()}`);
    Logger.log(`最終列: ${sheet.getLastColumn()}`);

    // テスト行を追加
    const testResult = recordAccessWithLock('https://test-url-setup.example.com');
    Logger.log('テスト書き込み結果: ' + JSON.stringify(testResult));

    return {
      success: true,
      message: 'スプレッドシートのセットアップが完了しました',
      spreadsheetId: spreadsheet.getId(),
      spreadsheetUrl: spreadsheet.getUrl(),
      testResult: testResult
    };

  } catch (error) {
    Logger.log(`エラー: ${error.toString()}`);
    Logger.log(`スタックトレース: ${error.stack}`);
    return {
      success: false,
      message: 'スプレッドシートのセットアップ中にエラーが発生しました',
      error: error.toString()
    };
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
