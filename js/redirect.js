document.addEventListener('DOMContentLoaded', function() {
    // デフォルトのターゲットURL
    const defaultTargetURL = 'https://app.revot.tech/contents/6138239b-af50-45b8-b1fc-3fdcc71d5e94/d919674a-f919-4cd9-a0e7-7addad8be0cd';

    // Google Apps ScriptのデプロイURL
    const gasURL = 'https://script.google.com/a/macros/arts-japan.info/s/AKfycbwfhgTm1RbDN4GJLv8TzsKII_vWmU2bjuZg06pbA0MOZ3if-SLfwVh4aXgQuc0QB4Z5/exec';

    // URLからターゲットURLを取得（カスタムURLも許可）
    function getTargetURL() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('url') || defaultTargetURL;
    }

    // アクセスを記録して指定されたURLにリダイレクト
    async function recordAndRedirect() {
        const targetURL = getTargetURL();

        try {
            // GASにアクセス記録を送信
            const response = await fetch(`${gasURL}?targetURL=${encodeURIComponent(targetURL)}`, {
                method: 'GET',
                mode: 'no-cors' // CORSの問題を回避
            });

            // リダイレクト（レスポンスを待たずにリダイレクトするオプションもあり）
            setTimeout(() => {
                window.location.href = targetURL;
            }, 1500); // 1.5秒後にリダイレクト

        } catch (error) {
            console.error('記録処理中にエラーが発生しました:', error);
            // エラー発生時もリダイレクト
            setTimeout(() => {
                window.location.href = targetURL;
            }, 1500);
        }
    }

    // 処理を開始
    recordAndRedirect();
});
