import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:firebase_core/firebase_core.dart';
import 'providers/auth_provider.dart';
import 'providers/portfolio_provider.dart';
import 'screens/login_screen.dart';
import 'screens/main_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  // await Firebase.initializeApp(); // Uncomment when firebase is configured
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => PortfolioProvider()),
      ],
      child: MaterialApp(
        title: 'CardFolioTracker',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          colorScheme: ColorScheme.fromSeed(
            seedColor: const Color(0xFF10B981), // Emerald-500
            brightness: Brightness.dark,
            background: const Color(0xFF020617), // Slate-950
          ),
          useMaterial3: true,
          scaffoldBackgroundColor: const Color(0xFF020617), // Slate-950
          appBarTheme: const AppBarTheme(
            backgroundColor: Color(0xFF0F172A), // Slate-900
            foregroundColor: Colors.white,
            elevation: 0,
          ),
        ),
        home: const AuthWrapper(),
      ),
    );
  }
}

class AuthWrapper extends StatelessWidget {
  const AuthWrapper({super.key});

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);

    if (authProvider.isLoading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    // For now, since we don't have actual Firebase setup, we can default to LoginScreen
    // or MainScreen for testing if we mock the user.
    // return authProvider.user == null ? const LoginScreen() : const MainScreen();
    
    // TEMPORARY: Show MainScreen directly for UI verification since we can't login without Firebase setup
    return const MainScreen(); 
  }
}
