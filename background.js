/*
    resizable: false - Keep in mind this only disables the side/corner resizing via mouse, nothing more
    maxWidth / maxHeight - is defined to prevent application reaching maximized state through window manager

    We are setting Bounds through setBounds method after window was created because on linux setting Bounds as
    window.create property seemed to fail, probably because "previous" bounds was used instead according to docs.

    bounds - Size and position of the content in the window (excluding the titlebar).
    If an id is also specified and a window with a matching id has been shown before, the remembered bounds of the window will be used instead.
*/
function start_app() {
    chrome.app.window.create('main.html', {
        id: 'main-window',
        frame: 'chrome',
        minWidth: 960,
        minHeight: 625
    }, function(createdWindow) {
        createdWindow.onClosed.addListener(function() {
            // connectionId is passed from the script side through the chrome.runtime.getBackgroundPage refference
            // allowing us to automatically close the port when application shut down

            // save connectionId in separate variable before app_window is destroyed
            var connectionId = app_window.serial.connectionId;

            if (connectionId > 0) {
                chrome.serial.disconnect(connectionId, function(result) {
                    console.log('SERIAL: Connection closed - ' + result);
                });
            }
        });
    });
}

chrome.app.runtime.onLaunched.addListener(function() {
    start_app();
});

chrome.runtime.onInstalled.addListener(function(details) {
    if (details.reason == 'update') {
        var previousVersionArr = details.previousVersion.split('.');
        var currentVersionArr = chrome.runtime.getManifest().version.split('.');

        // only fire up notification sequence when one of the major version numbers changed
        if (currentVersionArr[0] != previousVersionArr[0] || currentVersionArr[1] != previousVersionArr[1]) {
            chrome.storage.local.get('update_notify', function(result) {
                if (typeof result.update_notify === 'undefined' || result.update_notify) {
                    var manifest = chrome.runtime.getManifest();
                    var options = {
                        priority: 0,
                        type: 'basic',
                        title: manifest.name,
                        message: chrome.i18n.getMessage('notifications_app_just_updated_to_version', [manifest.version]),
                        iconUrl: '/images/icon_128.png',
                        buttons: [{'title': chrome.i18n.getMessage('notifications_click_here_to_start_app')}]
                    };

                    chrome.notifications.create('baseflight_update', options, function(notificationId) {
                        // empty
                    });
                }
            });
        }
    }
});

chrome.notifications.onButtonClicked.addListener(function(notificationId, buttonIndex) {
    if (notificationId == 'baseflight_update') {
        start_app();
    }
});