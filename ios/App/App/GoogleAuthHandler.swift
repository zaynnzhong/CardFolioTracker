import Foundation
import AuthenticationServices
import Capacitor

class GoogleAuthHandler: NSObject, ASWebAuthenticationPresentationContextProviding {

    static let shared = GoogleAuthHandler()

    private var authSession: ASWebAuthenticationSession?
    private var completionHandler: ((String?, String?, Error?) -> Void)?

    // Google OAuth configuration - iOS client ID
    private let clientId = "286826518600-ia0u2mmotml5bqfm7u32tvuqhvobd5q1.apps.googleusercontent.com"
    private let redirectScheme = "com.googleusercontent.apps.286826518600-ia0u2mmotml5bqfm7u32tvuqhvobd5q1"

    func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        return UIApplication.shared.windows.first { $0.isKeyWindow }!
    }

    func signIn(completion: @escaping (String?, String?, Error?) -> Void) {
        self.completionHandler = completion

        // Generate nonce
        let nonce = UUID().uuidString

        // Build OAuth URL
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
            completion(nil, nil, NSError(domain: "GoogleAuth", code: -1, userInfo: [NSLocalizedDescriptionKey: "Failed to create auth URL"]))
            return
        }

        print("[GoogleAuthHandler] Starting auth session with URL: \(authURL)")

        // Create and start ASWebAuthenticationSession
        authSession = ASWebAuthenticationSession(
            url: authURL,
            callbackURLScheme: redirectScheme
        ) { [weak self] callbackURL, error in
            if let error = error {
                print("[GoogleAuthHandler] Auth error: \(error)")
                self?.completionHandler?(nil, nil, error)
                return
            }

            guard let callbackURL = callbackURL else {
                print("[GoogleAuthHandler] No callback URL")
                self?.completionHandler?(nil, nil, NSError(domain: "GoogleAuth", code: -2, userInfo: [NSLocalizedDescriptionKey: "No callback URL"]))
                return
            }

            print("[GoogleAuthHandler] Callback URL: \(callbackURL)")

            // Parse tokens from URL fragment
            let urlString = callbackURL.absoluteString
            if let fragmentStart = urlString.range(of: "#") {
                let fragment = String(urlString[fragmentStart.upperBound...])
                let params = fragment.components(separatedBy: "&").reduce(into: [String: String]()) { result, param in
                    let parts = param.components(separatedBy: "=")
                    if parts.count == 2 {
                        result[parts[0]] = parts[1].removingPercentEncoding
                    }
                }

                let idToken = params["id_token"]
                let accessToken = params["access_token"]

                if let idToken = idToken {
                    print("[GoogleAuthHandler] Got ID token")
                    self?.completionHandler?(idToken, accessToken, nil)
                } else if let errorParam = params["error"] {
                    print("[GoogleAuthHandler] OAuth error: \(errorParam)")
                    self?.completionHandler?(nil, nil, NSError(domain: "GoogleAuth", code: -3, userInfo: [NSLocalizedDescriptionKey: errorParam]))
                } else {
                    print("[GoogleAuthHandler] No ID token in response")
                    self?.completionHandler?(nil, nil, NSError(domain: "GoogleAuth", code: -4, userInfo: [NSLocalizedDescriptionKey: "No ID token received"]))
                }
            } else {
                print("[GoogleAuthHandler] No fragment in callback URL")
                self?.completionHandler?(nil, nil, NSError(domain: "GoogleAuth", code: -5, userInfo: [NSLocalizedDescriptionKey: "Invalid callback URL"]))
            }
        }

        authSession?.presentationContextProvider = self
        authSession?.prefersEphemeralWebBrowserSession = false
        authSession?.start()
    }
}
