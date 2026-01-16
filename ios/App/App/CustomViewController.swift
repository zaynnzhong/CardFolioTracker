import UIKit
import Capacitor
import WebKit
import AuthenticationServices

class CustomViewController: CAPBridgeViewController, WKScriptMessageHandler, ASWebAuthenticationPresentationContextProviding {

    private var authSession: ASWebAuthenticationSession?
    private var webViewObserver: NSKeyValueObservation?

    // Google OAuth configuration - iOS client ID
    private let clientId = "286826518600-ia0u2mmotml5bqfm7u32tvuqhvobd5q1.apps.googleusercontent.com"
    private let redirectScheme = "com.googleusercontent.apps.286826518600-ia0u2mmotml5bqfm7u32tvuqhvobd5q1"

    override func viewDidLoad() {
        super.viewDidLoad()

        // Register script message handler for Google Sign-In
        bridge?.webView?.configuration.userContentController.add(self, name: "nativeGoogleSignIn")

        // Observe when page finishes loading to inject our bridge
        webViewObserver = bridge?.webView?.observe(\.isLoading, options: [.new]) { [weak self] webView, change in
            if let isLoading = change.newValue, !isLoading {
                self?.injectGoogleSignInBridge()
            }
        }

        // Also inject immediately in case page is already loaded
        injectGoogleSignInBridge()

        print("[CustomVC] Google Sign-In bridge setup complete")
    }

    deinit {
        webViewObserver?.invalidate()
    }

    private func injectGoogleSignInBridge() {
        let js = """
        if (!window.nativeGoogleSignIn) {
            window.nativeGoogleSignIn = function() {
                return new Promise((resolve, reject) => {
                    window._googleSignInCallback = { resolve, reject };
                    window.webkit.messageHandlers.nativeGoogleSignIn.postMessage('signIn');
                });
            };
            console.log('[Native] Google Sign-In bridge injected');
        }
        """

        bridge?.webView?.evaluateJavaScript(js) { _, error in
            if let error = error {
                print("[CustomVC] Failed to inject JS: \(error)")
            } else {
                print("[CustomVC] Google Sign-In bridge injected successfully")
            }
        }
    }

    // MARK: - WKScriptMessageHandler

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        if message.name == "nativeGoogleSignIn" {
            print("[CustomVC] Google Sign-In requested from JavaScript")
            performGoogleSignIn()
        }
    }

    // MARK: - ASWebAuthenticationPresentationContextProviding

    func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        return view.window!
    }

    // MARK: - Google Sign-In

    private func performGoogleSignIn() {
        let nonce = UUID().uuidString

        var components = URLComponents(string: "https://accounts.google.com/o/oauth2/v2/auth")!
        components.queryItems = [
            URLQueryItem(name: "client_id", value: clientId),
            URLQueryItem(name: "redirect_uri", value: "\(redirectScheme):/oauth2callback"),
            URLQueryItem(name: "response_type", value: "id_token token"),
            URLQueryItem(name: "scope", value: "openid email profile"),
            URLQueryItem(name: "nonce", value: nonce),
            URLQueryItem(name: "prompt", value: "select_account")
        ]

        guard let authURL = components.url else {
            rejectSignIn(error: "Failed to create auth URL")
            return
        }

        print("[CustomVC] Starting ASWebAuthenticationSession")

        authSession = ASWebAuthenticationSession(
            url: authURL,
            callbackURLScheme: redirectScheme
        ) { [weak self] callbackURL, error in
            if let error = error as? ASWebAuthenticationSessionError {
                if error.code == .canceledLogin {
                    self?.rejectSignIn(error: "cancelled")
                } else {
                    self?.rejectSignIn(error: error.localizedDescription)
                }
                return
            }

            guard let callbackURL = callbackURL else {
                self?.rejectSignIn(error: "No callback URL")
                return
            }

            self?.handleCallback(url: callbackURL)
        }

        authSession?.presentationContextProvider = self
        authSession?.prefersEphemeralWebBrowserSession = false

        if !authSession!.start() {
            rejectSignIn(error: "Failed to start auth session")
        }
    }

    private func handleCallback(url: URL) {
        let urlString = url.absoluteString

        guard let fragmentStart = urlString.range(of: "#") else {
            rejectSignIn(error: "Invalid callback URL")
            return
        }

        let fragment = String(urlString[fragmentStart.upperBound...])
        var params: [String: String] = [:]

        for param in fragment.components(separatedBy: "&") {
            let parts = param.components(separatedBy: "=")
            if parts.count == 2 {
                params[parts[0]] = parts[1].removingPercentEncoding
            }
        }

        if let idToken = params["id_token"] {
            let accessToken = params["access_token"] ?? ""
            resolveSignIn(idToken: idToken, accessToken: accessToken)
        } else if let error = params["error"] {
            rejectSignIn(error: error)
        } else {
            rejectSignIn(error: "No ID token received")
        }
    }

    private func resolveSignIn(idToken: String, accessToken: String) {
        let js = """
        if (window._googleSignInCallback) {
            window._googleSignInCallback.resolve({ idToken: '\(idToken)', accessToken: '\(accessToken)' });
            window._googleSignInCallback = null;
        }
        """
        DispatchQueue.main.async {
            self.bridge?.webView?.evaluateJavaScript(js, completionHandler: nil)
        }
    }

    private func rejectSignIn(error: String) {
        let escapedError = error.replacingOccurrences(of: "'", with: "\\'")
        let js = """
        if (window._googleSignInCallback) {
            window._googleSignInCallback.reject(new Error('\(escapedError)'));
            window._googleSignInCallback = null;
        }
        """
        DispatchQueue.main.async {
            self.bridge?.webView?.evaluateJavaScript(js, completionHandler: nil)
        }
    }
}
