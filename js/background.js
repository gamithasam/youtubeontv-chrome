// This will be injected dynamically at extension creation time
var appConfig = {"hostname":"www.youtube.com","userAgent":"Mozilla/5.0 (X11; Linux i686) AppleWebKit/534.24 (KHTML, like Gecko) Chrome/90.0.4430.212 Large Screen Safari/534.24 GoogleTV/092754youtube.com/tv#","behavior":{"internalLinks":false},"chromeAppWindow":{"id":"embed","frame":{"type":"chrome","color":"#ff0000"},"innerBounds":{"width":1180,"height":900}}};

/**
 * Listens for the app launching then creates the window
 *
 * @see http://developer.chrome.com/apps/app.runtime.html
 * @see http://developer.chrome.com/apps/app.window.html
 */
chrome.app.runtime.onLaunched.addListener(function () {
    runApp();
});

/**
 * Listens for the app restarting then re-creates the window.
 *
 * @see http://developer.chrome.com/apps/app.runtime.html
 */
chrome.app.runtime.onRestarted.addListener(function () {
    runApp();
});

/**
 * Creates the window for the application.
 *
 * @see http://developer.chrome.com/apps/app.window.html
 */
function runApp() {
    // Creat a new Chrome app window
    chrome.app.window.create('html/embed.html', appConfig.chromeAppWindow, onWindowLoaded());
}

/**
 * Called before the contentWindow's onload event
 *
 * @see http://developer.chrome.com/apps/app.window.html
 */
function onWindowLoaded(popup) {
    return function (win) {
        // On window loaded event
        win.contentWindow.onload = function () {
            // Get webview 
            var webview = win.contentWindow.document.getElementById('webview');

            // Override default user agent if provided
            if (appConfig.userAgent) {
                webview.setUserAgentOverride(appConfig.userAgent);
            }

            // Sign up for 'permissionrequest' event
            webview.addEventListener('permissionrequest', function (e) {
                // Allow all permission requests
                e.request.allow();
            });

            // Sign up for 'newwindow' event
            // Emitted when a target='_blank' link is clicked within the webview
            webview.addEventListener('newwindow', function (e) {
                // Parse target window URL to extract hostname
                var parsedUrl = document.createElement('a');
                parsedUrl.href = e.targetUrl;

                // Popup?
                if (e.initialWidth > 0 && e.initialHeight > 0) {
                    // Open it in a popup window with a set width and height
                    return chrome.app.window.create('html/embed.html', { frame: { type: 'chrome' }, innerBounds: { width: e.initialWidth, height: e.initialHeight } }, onWindowLoaded(e));
                }
                // Open app links internally?
                else if (appConfig.behavior.internalLinks && parsedUrl.hostname.includes(appConfig.hostname)) {
                    return chrome.app.window.create('html/embed.html', { frame: { type: 'chrome' }, innerBounds: appConfig.chromeAppWindow.innerBounds }, onWindowLoaded(e));
                }

                // Open the link in a new browser tab/window
                win.contentWindow.open(e.targetUrl);
            });

            // Is this a popup window?
            if (popup) {
                // Override webview source with popup's target URL
                webview.src = popup.targetUrl;

                // Attach original calling window to popup webview (accessible via window.opener)
                popup.window.attach(webview);
            }
        };
    };
}
