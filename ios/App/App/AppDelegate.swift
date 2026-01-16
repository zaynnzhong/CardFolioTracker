import UIKit
import Capacitor

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {}
    func applicationDidEnterBackground(_ application: UIApplication) {}
    func applicationWillEnterForeground(_ application: UIApplication) {}
    func applicationDidBecomeActive(_ application: UIApplication) {}
    func applicationWillTerminate(_ application: UIApplication) {}

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }
}

// Bridge to expose native Google Sign-In to JavaScript
class GoogleSignInBridge {
    static func register(with bridge: CAPBridgeProtocol) {
        // Inject JavaScript function that calls native Google Sign-In
        let js = """
        window.nativeGoogleSignIn = function() {
            return new Promise((resolve, reject) => {
                window.webkit.messageHandlers.googleSignIn.postMessage({});
                window._googleSignInResolve = resolve;
                window._googleSignInReject = reject;
            });
        };
        console.log('[Native] Google Sign-In bridge registered');
        """
        bridge.webView?.evaluateJavaScript(js, completionHandler: nil)
    }
}
