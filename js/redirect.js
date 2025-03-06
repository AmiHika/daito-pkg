document.addEventListener('DOMContentLoaded', function() {
    // デフォルトのターゲットURL
    const defaultTargetURL = 'https://app.revot.tech/contents/6138239b-af50-45b8-b1fc-3fdcc71d5e94/d919674a-f919-4cd9-a0e7-7addad8be0cd';

    // Google Apps ScriptのデプロイURL（新しく再デプロイしたURLに更新済み）
    // 注意: このURLは「アクセスできるユーザー: 全員（匿名ユーザーを含む）」の設定で再デプロイする必要があります
    const gasURL = 'https://script.google.com/macros/s/AKfycbwfhgTm1RbDN4GJLv8TzsKII_vWmU2bjuZg06pbA0MOZ3if-SLfwVh4aXgQuc0QB4Z5/exec';

    // URLからターゲットURLを取得（カスタムURLも許可）
    function getTargetURL() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('url') || defaultTargetURL;
    }

    // アクセスを記録して指定されたURLにリダイレクト
    async function recordAndRedirect() {
        const targetURL = getTargetURL();
        const startTime = new Date().getTime();

        try {
            // GASにアクセス記録を送信（JSONP方式でCORS問題を回避）
            const scriptElement = document.createElement('script');
            const callbackName = 'gasCallback_' + Math.round(Math.random() * 1000000);
            let redirectTriggered = false;

            // コールバック関数を設定（詳細なデバッグ情報を含む）
            window[callbackName] = function(response) {
                console.log('GAS処理結果:', response);
                // ブラウザコンソールに詳細なログを出力
                console.log('リダイレクト情報:', {
                    targetURL: targetURL,
                    timestamp: new Date().toISOString(),
                    responseReceived: true,
                    responseData: response
                });

                // GASからの応答を受け取ったらリダイレクト
                if (!redirectTriggered) {
                    redirectTriggered = true;
                    window.location.href = targetURL;
                }

                // コールバック関数を削除（メモリリーク防止）
                delete window[callbackName];
            };

            // デバッグコンソールにパラメータ情報を出力
            console.log('リクエストパラメータ:', {
                targetURL: targetURL,
                gasURL: gasURL
            });

            // JSONP用のURLを構築（シンプルに「url」パラメータとして送信）
            // GAS側のパラメータ名がtargetURLじゃなくてurlとして処理されている可能性があるため試してみる
            scriptElement.src = `${gasURL}?url=${encodeURIComponent(targetURL)}&callback=${callbackName}`;

            // バックアップ用にimgタグでも呼び出し（GASへの到達性を高める）
            const imgElement = document.createElement('img');
            imgElement.width = 1;
            imgElement.height = 1;
            imgElement.style.display = 'none';
            imgElement.src = `${gasURL}?url=${encodeURIComponent(targetURL)}&t=${Date.now()}`;
            document.body.appendChild(imgElement);

            // スクリプトのロード完了とエラー時の処理を追加
            scriptElement.onload = function() {
                console.log('GASスクリプトが正常に読み込まれました');
            };

            scriptElement.onerror = function() {
                console.error('GASスクリプトの読み込みに失敗しました');
                if (!redirectTriggered) {
                    redirectTriggered = true;
                    window.location.href = targetURL;
                }
            };

            document.body.appendChild(scriptElement);

            // 記録処理の結果を待つが、最大2000msで強制的にリダイレクト
            const redirectWithTimeout = () => {
                setTimeout(() => {
                    if (!redirectTriggered) {
                        console.warn('タイムアウトによるリダイレクト実行');
                        redirectTriggered = true;
                        window.location.href = targetURL;
                    }
                }, 2000); // 2秒に延長
            };

            // バックアップとして最大でも2秒後にはリダイレクト
            redirectWithTimeout();
        } catch (error) {
            console.error('記録処理中にエラーが発生しました:', error);
            // エラー発生時は即座にリダイレクト
            window.location.href = targetURL;
        }
    }

    // 処理を開始
    recordAndRedirect();
});
