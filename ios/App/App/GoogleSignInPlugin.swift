import Foundation
import Capacitor
import WebKit
import AuthenticationServices

@objc(GoogleSignInPlugin)
public class GoogleSignInPlugin: CAPPlugin, CAPBridgedPlugin, ASWebAuthenticationPresentationContextProviding {

    public let identifier = "GoogleSignInPlugin"
    public let jsName = "GoogleSignIn"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "signIn", returnType: CAPPluginReturnPromise)
    ]

    private var authSession: ASWebAuthenticationSession?

    // Google OAuth configuration - iOS client ID
    private let clientId = "286826518600-ia0u2mmotml5bqfm7u32tvuqhvobd5q1.apps.googleusercontent.com"
    private let redirectScheme = "com.googleusercontent.apps.286826518600-ia0u2mmotml5bqfm7u32tvuqhvobd5q1"

    public func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        return UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .flatMap { $0.windows }
            .first { $0.isKeyWindow } ?? ASPresentationAnchor()
    }

    @objc func signIn(_ call: CAPPluginCall) {
        print("[GoogleSignInPlugin] signIn called")

        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }

            // Generate nonce
            let nonce = UUID().uuidString

            // Build OAuth URL
            var components = URLComponents(string: "https://accounts.google.com/o/oauth2/v2/auth")!
            components.queryItems = [
                URLQueryItem(name: "client_id", value: self.clientId),
                URLQueryItem(name: "redirect_uri", value: "\(self.redirectScheme):/oauth2callback"),
                URLQueryItem(name: "response_type", value: "id_token token"),
                URLQueryItem(name: "scope", value: "openid email profile"),
                URLQueryItem(name: "nonce", value: nonce),
                URLQueryItem(name: "prompt", value: "select_account")
            ]

            guard let authURL = components.url else {
                call.reject("Failed to create auth URL")
                return
            }

            print("[GoogleSignInPlugin] Starting auth session")

            // Create ASWebAuthenticationSession
            self.authSession = ASWebAuthenticationSession(
                url: authURL,
                callbackURLScheme: self.redirectScheme
            ) { callbackURL, error in
                if let error = error as? ASWebAuthenticationSessionError {
                    if error.code == .canceledLogin {
                        print("[GoogleSignInPlugin] User cancelled")
                        call.reject("User cancelled sign-in")
                    } else {
                        print("[GoogleSignInPlugin] Auth error: \(error)")
                        call.reject("Authentication failed: \(error.localizedDescription)")
                    }
                    return
                }

                guard let callbackURL = callbackURL else {
                    call.reject("No callback URL received")
                    return
                }

                print("[GoogleSignInPlugin] Got callback URL")

                // Parse tokens from URL fragment
                let urlString = callbackURL.absoluteString
                if let fragmentStart = urlString.range(of: "#") {
                    let fragment = String(urlString[fragmentStart.upperBound...])
                    var params: [String: String] = [:]

                    for param in fragment.components(separatedBy: "&") {
                        let parts = param.components(separatedBy: "=")
                        if parts.count == 2 {
                            params[parts[0]] = parts[1].removingPercentEncoding
                        }
                    }

                    if let idToken = params["id_token"] {
                        print("[GoogleSignInPlugin] Success - got ID token")
                        call.resolve([
                            "idToken": idToken,
                            "accessToken": params["access_token"] ?? ""
                        ])
                    } else if let errorParam = params["error"] {
                        call.reject("OAuth error: \(errorParam)")
                    } else {
                        call.reject("No ID token in response")
                    }
                } else {
                    call.reject("Invalid callback URL format")
                }
            }

            self.authSession?.presentationContextProvider = self
            self.authSession?.prefersEphemeralWebBrowserSession = false

            if !self.authSession!.start() {
                call.reject("Failed to start authentication session")
            }
        }
    }
}
