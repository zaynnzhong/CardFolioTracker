import UIKit
import Capacitor
import WebKit
import AuthenticationServices
import CryptoKit

class CustomViewController: CAPBridgeViewController, WKScriptMessageHandler, ASWebAuthenticationPresentationContextProviding {

    private var authSession: ASWebAuthenticationSession?
    private var webViewObserver: NSKeyValueObservation?
    private var codeVerifier: String?

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

            // Dispatch event to notify JavaScript that native bridge is ready
            window.dispatchEvent(new CustomEvent('nativeGoogleSignInReady'));
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

    // MARK: - PKCE Helpers

    private func generateCodeVerifier() -> String {
        var buffer = [UInt8](repeating: 0, count: 32)
        _ = SecRandomCopyBytes(kSecRandomDefault, buffer.count, &buffer)
        return Data(buffer).base64EncodedString()
            .replacingOccurrences(of: "+", with: "-")
            .replacingOccurrences(of: "/", with: "_")
            .replacingOccurrences(of: "=", with: "")
    }

    private func generateCodeChallenge(from verifier: String) -> String {
        let data = Data(verifier.utf8)
        let hash = SHA256.hash(data: data)
        return Data(hash).base64EncodedString()
            .replacingOccurrences(of: "+", with: "-")
            .replacingOccurrences(of: "/", with: "_")
            .replacingOccurrences(of: "=", with: "")
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

    // MARK: - Google Sign-In with PKCE

    private func performGoogleSignIn() {
        // Generate PKCE code verifier and challenge
        codeVerifier = generateCodeVerifier()
        let codeChallenge = generateCodeChallenge(from: codeVerifier!)

        var components = URLComponents(string: "https://accounts.google.com/o/oauth2/v2/auth")!
        components.queryItems = [
            URLQueryItem(name: "client_id", value: clientId),
            URLQueryItem(name: "redirect_uri", value: "\(redirectScheme):/oauth2callback"),
            URLQueryItem(name: "response_type", value: "code"),
            URLQueryItem(name: "scope", value: "openid email profile"),
            URLQueryItem(name: "code_challenge", value: codeChallenge),
            URLQueryItem(name: "code_challenge_method", value: "S256"),
            URLQueryItem(name: "prompt", value: "select_account")
        ]

        guard let authURL = components.url else {
            rejectSignIn(error: "Failed to create auth URL")
            return
        }

        print("[CustomVC] Starting ASWebAuthenticationSession with PKCE")

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

            self?.handleAuthCodeCallback(url: callbackURL)
        }

        authSession?.presentationContextProvider = self
        authSession?.prefersEphemeralWebBrowserSession = false

        if !authSession!.start() {
            rejectSignIn(error: "Failed to start auth session")
        }
    }

    private func handleAuthCodeCallback(url: URL) {
        // Parse authorization code from URL query
        guard let components = URLComponents(url: url, resolvingAgainstBaseURL: false),
              let code = components.queryItems?.first(where: { $0.name == "code" })?.value else {
            if let error = URLComponents(url: url, resolvingAgainstBaseURL: false)?.queryItems?.first(where: { $0.name == "error" })?.value {
                rejectSignIn(error: error)
            } else {
                rejectSignIn(error: "No authorization code received")
            }
            return
        }

        print("[CustomVC] Got authorization code, exchanging for tokens...")

        // Exchange code for tokens
        exchangeCodeForTokens(code: code)
    }

    private func exchangeCodeForTokens(code: String) {
        guard let verifier = codeVerifier else {
            rejectSignIn(error: "Missing code verifier")
            return
        }

        let tokenURL = URL(string: "https://oauth2.googleapis.com/token")!
        var request = URLRequest(url: tokenURL)
        request.httpMethod = "POST"
        request.setValue("application/x-www-form-urlencoded", forHTTPHeaderField: "Content-Type")

        let params = [
            "client_id": clientId,
            "code": code,
            "code_verifier": verifier,
            "grant_type": "authorization_code",
            "redirect_uri": "\(redirectScheme):/oauth2callback"
        ]

        let body = params.map { "\($0.key)=\($0.value.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? $0.value)" }.joined(separator: "&")
        request.httpBody = body.data(using: .utf8)

        URLSession.shared.dataTask(with: request) { [weak self] data, response, error in
            if let error = error {
                self?.rejectSignIn(error: error.localizedDescription)
                return
            }

            guard let data = data else {
                self?.rejectSignIn(error: "No data received")
                return
            }

            do {
                if let json = try JSONSerialization.jsonObject(with: data) as? [String: Any] {
                    if let idToken = json["id_token"] as? String {
                        let accessToken = json["access_token"] as? String ?? ""
                        print("[CustomVC] Successfully got tokens!")
                        self?.resolveSignIn(idToken: idToken, accessToken: accessToken)
                    } else if let error = json["error"] as? String {
                        let description = json["error_description"] as? String ?? error
                        self?.rejectSignIn(error: description)
                    } else {
                        self?.rejectSignIn(error: "Invalid token response")
                    }
                }
            } catch {
                self?.rejectSignIn(error: "Failed to parse token response")
            }
        }.resume()
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
