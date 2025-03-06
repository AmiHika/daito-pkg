document.addEventListener('DOMContentLoaded', function() {
    // デフォルトのターゲットURL
    const defaultTargetURL = 'https://app.revot.tech/contents/6138239b-af50-45b8-b1fc-3fdcc71d5e94/d919674a-f919-4cd9-a0e7-7addad8be0cd';

    // Google Apps ScriptのデプロイURL（新しく再デプロイしたURLに更新済み）
    // 注意: このURLは「アクセスできるユーザー: 全員（匿名ユーザーを含む）」の設定で再デプロイする必要があります
    const gasURL = 'https://script.google.com/macros/s/AKfycbwfhgTm1RbDN4GJLv8TzsKII_vWmU2bjuZg06pbA0MOZ3if-SLfwVh4aXgQuc0QB4Z5/exec';

    // デバッグログ機能
    const debug = window.appDebug || {
        log: function(msg, data) { console.log(msg, data); },
        error: function(msg, data) { console.error(msg, data); }
    };

    // 実行環境の検出
    const isGitHubPages = window.location.hostname.includes('github.io');
    debug.log('実行環境', {
        isGitHubPages: isGitHubPages,
        hostname: window.location.hostname,
        protocol: window.location.protocol
    });

    // URLからターゲットURLを取得（カスタムURLも許可）
    function getTargetURL() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('url') || defaultTargetURL;
    }

    // アクセスを記録して指定されたURLにリダイレクト
    async function recordAndRedirect() {
        const targetURL = getTargetURL();
        const startTime = new Date().getTime();
        let redirectTriggered = false;
        let requestSuccess = false;

        // GitHub Pages用の特別リクエスト URL
        const request_url = `${gasURL}?url=${encodeURIComponent(targetURL)}&source=${isGitHubPages ? 'githubpages' : 'direct'}&t=${Date.now()}`;

        debug.log('リダイレクト処理開始', {
            targetURL: targetURL,
            gasURL: gasURL,
            requestURL: request_url
        });

        // 複数の方法でGASにリクエストを送信（最低1つが成功すれば良い）
        try {
            // GitHub Pages環境では高信頼性のアプローチから順に試す
            if (isGitHubPages) {
                debug.log('GitHub Pages環境を検出');

                // 1番目: 直接イメージビーコン（最も確実な方法）
                sendImageBeacon();

                // 2番目: iframe経由のフォーム送信（よりセキュアな方法）
                setTimeout(() => !requestSuccess && sendIframeRequest(), 200);

                // 3番目: JSONP（標準的なクロスドメイン方法）
                setTimeout(() => !requestSuccess && sendJsonpRequest(), 400);

                // 4番目: Fetch API（最新ブラウザ用）
                setTimeout(() => !requestSuccess && sendFetchRequest(), 600);
            } else {
                // 通常環境では全方式を並列実行
                sendFetchRequest();
                sendJsonpRequest();
                sendImageBeacon();
            }

            // 最大2.5秒後には強制的にリダイレクト
            setTimeout(() => {
                if (!redirectTriggered) {
                    debug.log('タイムアウトによるリダイレクト実行');
                    redirectTriggered = true;
                    window.location.href = targetURL;
                }
            }, 2500);
        } catch (error) {
            debug.error('記録処理中にエラーが発生', error);
            // エラー発生時は即座にリダイレクト
            if (!redirectTriggered) {
                redirectTriggered = true;
                window.location.href = targetURL;
            }
        }

        // 方式1: Fetch API（GitHub Pagesでも動作可能なモード設定）
        function sendFetchRequest() {
            try {
                debug.log('Fetch APIによるリクエスト開始');
                fetch(request_url + '&method=fetch', {
                    mode: 'no-cors',  // CORS制限を回避
                    cache: 'no-cache', // キャッシュを無効化
                    credentials: 'omit' // 認証情報を送信しない
                })
                .then(response => {
                    debug.log('Fetch成功');
                    requestSuccess = true;
                    tryRedirect();
                })
                .catch(error => {
                    debug.error('Fetchエラー', error);
                });
            } catch (e) {
                debug.error('Fetch例外', e);
            }
        }

        // 方式2: JSONPスクリプト
        function sendJsonpRequest() {
            try {
                debug.log('JSONP通信開始');
                const callbackName = 'gasCallback_' + Math.round(Math.random() * 10000000);

                // コールバック関数を設定
                window[callbackName] = function(response) {
                    debug.log('JSONP成功', response);
                    requestSuccess = true;
                    tryRedirect();
                    setTimeout(() => delete window[callbackName], 1000); // 遅延削除
                };

                // スクリプトエレメント作成
                const scriptElement = document.createElement('script');
                scriptElement.src = `${request_url}&method=jsonp&callback=${callbackName}`;
                scriptElement.async = true;

                scriptElement.onload = function() {
                    debug.log('JSONPスクリプト読み込み完了');
                };

                scriptElement.onerror = function(e) {
                    debug.error('JSONPスクリプト読み込みエラー', e);
                };

                document.body.appendChild(scriptElement);
            } catch (e) {
                debug.error('JSONP例外', e);
            }
        }

        // 方式3: イメージビーコン（非常に高い互換性）
        function sendImageBeacon() {
            try {
                debug.log('イメージビーコン送信開始');
                const imgElement = document.createElement('img');
                imgElement.width = 1;
                imgElement.height = 1;
                imgElement.style.position = 'absolute';
                imgElement.style.opacity = '0.01';
                // GETパラメータにタイムスタンプを追加してキャッシュを回避
                imgElement.src = `${request_url}&method=imgbeacon&nocache=${Date.now()}-${Math.random()}`;

                imgElement.onload = function() {
                    debug.log('イメージビーコン成功');
                    requestSuccess = true;
                    tryRedirect();
                };

                imgElement.onerror = function(e) {
                    debug.error('イメージビーコンエラー', e);
                };

                document.body.appendChild(imgElement);
            } catch (e) {
                debug.error('イメージビーコン例外', e);
            }
        }

        // 方式4: iframe経由フォーム送信（GitHub Pages用の特殊方法）
        function sendIframeRequest() {
            try {
                debug.log('iframe経由リクエスト開始');
                // 非表示iframeを作成
                const iframe = document.createElement('iframe');
                iframe.name = 'gas_request_frame';
                iframe.style.display = 'none';
                document.body.appendChild(iframe);

                // フォームを作成
                const form = document.createElement('form');
                form.method = 'GET';
                form.action = gasURL;
                form.target = 'gas_request_frame';

                // URLパラメータを追加
                const urlInput = document.createElement('input');
                urlInput.type = 'hidden';
                urlInput.name = 'url';
                urlInput.value = targetURL;
                form.appendChild(urlInput);

                // 現在時刻を追加
                const timeInput = document.createElement('input');
                timeInput.type = 'hidden';
                timeInput.name = 't';
                timeInput.value = Date.now();
                form.appendChild(timeInput);

                // 方式を指定
                const methodInput = document.createElement('input');
                methodInput.type = 'hidden';
                methodInput.name = 'method';
                methodInput.value = 'iframe';
                form.appendChild(methodInput);

                // ソースを指定
                const sourceInput = document.createElement('input');
                sourceInput.type = 'hidden';
                sourceInput.name = 'source';
                sourceInput.value = 'githubpages_iframe';
                form.appendChild(sourceInput);

                // フォームをDOMに追加して送信
                document.body.appendChild(form);
                form.submit();

                // iframe読み込み完了イベント
                iframe.onload = function() {
                    debug.log('iframeフォーム送信成功');
                    requestSuccess = true;
                    tryRedirect();
                };
            } catch (e) {
                debug.error('iframeリクエスト例外', e);
            }
        }

        // 安全にリダイレクトを実行する関数
        function tryRedirect() {
            if (!redirectTriggered) {
                redirectTriggered = true;
                debug.log('リダイレクト実行', { targetURL });
                window.location.href = targetURL;
            }
        }
    }

    // 処理を開始
    recordAndRedirect();
});
