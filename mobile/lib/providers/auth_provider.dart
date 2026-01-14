import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';

class AuthProvider with ChangeNotifier {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  User? _user;
  bool _isLoading = true;

  User? get user => _user;
  bool get isLoading => _isLoading;

  AuthProvider() {
    _auth.authStateChanges().listen((User? user) {
      _user = user;
      _isLoading = false;
      notifyListeners();
    });
  }

  Future<String?> getIdToken() async {
    if (_user == null) return null;
    return await _user!.getIdToken();
  }

  Future<void> signInWithGoogle() async {
    // Note: Google Sign-In requires platform specific setup (GoogleService-Info.plist / google-services.json)
    // and the google_sign_in package.
    // For now, we will just stub this or assume the user will implement the specific sign-in logic.
    // This is a placeholder for the actual implementation.
    throw UnimplementedError("Google Sign In not implemented yet");
  }

  Future<void> signOut() async {
    await _auth.signOut();
  }
}
