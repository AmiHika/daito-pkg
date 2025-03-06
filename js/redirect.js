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
        let redirectTriggered = false;

        // 複数の方法でGASにリクエストを送信（最低1つが成功すれば良い）
        try {
            console.log('リダイレクト処理開始:', {
                targetURL: targetURL,
                gasURL: gasURL
            });

            // 方法1: XMLHttpRequest - シンプルなGETリクエスト
            sendXhrRequest();

            // 方法2: Fetch API - 最新のブラウザサポート
            sendFetchRequest();

            // 方法3: JSONP - 従来のクロスドメイン通信
            sendJsonpRequest();

            // 方法4: 画像ピクセル - 最もシンプルな通信
            sendImagePixelRequest();

            // 最大2秒後には強制的にリダイレクト
            setTimeout(() => {
                if (!redirectTriggered) {
                    console.warn('タイムアウトによるリダイレクト実行');
                    redirectTriggered = true;
                    window.location.href = targetURL;
                }
            }, 2000);
        } catch (error) {
            console.error('記録処理中にエラーが発生しました:', error);
            // エラー発生時は即座にリダイレクト
            if (!redirectTriggered) {
                redirectTriggered = true;
                window.location.href = targetURL;
            }
        }

        // 方法1: XMLHttpRequestを使用
        function sendXhrRequest() {
            try {
                const xhr = new XMLHttpRequest();
                // モード指定なし（シンプルなGET）
                xhr.open('GET', `${gasURL}?url=${encodeURIComponent(targetURL)}&method=xhr&t=${Date.now()}`, true);
                xhr.onload = function() {
                    console.log('XHR成功:', xhr.responseText);
                    tryRedirect();
                };
                xhr.onerror = function() {
                    console.warn('XHRエラー');
                };
                xhr.send();
            } catch (e) {
                console.warn('XHR例外:', e);
            }
        }

        // 方法2: Fetch APIを使用
        function sendFetchRequest() {
            try {
                fetch(`${gasURL}?url=${encodeURIComponent(targetURL)}&method=fetch&t=${Date.now()}`, {
                    mode: 'no-cors' // CORSエラーを回避
                })
                .then(response => {
                    console.log('Fetch成功');
                    tryRedirect();
                })
                .catch(error => {
                    console.warn('Fetchエラー:', error);
                });
            } catch (e) {
                console.warn('Fetch例外:', e);
            }
        }

        // 方法3: JSONPを使用
        function sendJsonpRequest() {
            try {
                const callbackName = 'gasCallback_' + Math.round(Math.random() * 1000000);

                // コールバック関数を設定
                window[callbackName] = function(response) {
                    console.log('JSONP成功:', response);
                    tryRedirect();
                    delete window[callbackName]; // メモリリーク防止
                };

                // スクリプトエレメント作成
                const scriptElement = document.createElement('script');
                scriptElement.src = `${gasURL}?url=${encodeURIComponent(targetURL)}&method=jsonp&callback=${callbackName}&t=${Date.now()}`;

                scriptElement.onload = function() {
                    console.log('JSONPスクリプト読み込み完了');
                };

                scriptElement.onerror = function() {
                    console.warn('JSONPスクリプト読み込みエラー');
                    delete window[callbackName]; // エラー時も削除
                };

                document.body.appendChild(scriptElement);
            } catch (e) {
                console.warn('JSONP例外:', e);
            }
        }

        // 方法4: 画像ピクセルを使用
        function sendImagePixelRequest() {
            try {
                const imgElement = document.createElement('img');
                imgElement.width = 1;
                imgElement.height = 1;
                imgElement.style.display = 'none';
                imgElement.src = `${gasURL}?url=${encodeURIComponent(targetURL)}&method=img&t=${Date.now()}`;

                imgElement.onload = function() {
                    console.log('画像ピクセル読み込み成功');
                    tryRedirect();
                };

                imgElement.onerror = function() {
                    console.warn('画像ピクセル読み込みエラー');
                };

                document.body.appendChild(imgElement);
            } catch (e) {
                console.warn('画像ピクセル例外:', e);
            }
        }

        // 安全にリダイレクトを実行する関数
        function tryRedirect() {
            if (!redirectTriggered) {
                redirectTriggered = true;
                console.log('リダイレクト実行:', targetURL);
                window.location.href = targetURL;
            }
        }
    }

    // 処理を開始
    recordAndRedirect();
});
