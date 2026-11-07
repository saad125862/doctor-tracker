import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'screens/home_shell.dart';
import 'screens/login_screen.dart';
import 'state/auth_state.dart';
import 'theme.dart';

void main() {
  runApp(ChangeNotifierProvider(create: (_) => AuthState()..init(), child: const DoctorTrackerApp()));
}

class DoctorTrackerApp extends StatelessWidget {
  const DoctorTrackerApp({super.key});

  @override
  Widget build(BuildContext context) {
    final status = context.select<AuthState, AuthStatus>((a) => a.status);
    return MaterialApp(
      title: 'Doctor Tracker',
      debugShowCheckedModeBanner: false,
      theme: buildTheme(),
      themeMode: ThemeMode.dark,
      home: AnimatedSwitcher(
        duration: const Duration(milliseconds: 300),
        child: switch (status) {
          AuthStatus.loading => const Scaffold(key: ValueKey('splash'), body: Center(child: CircularProgressIndicator(color: AppColors.primary))),
          AuthStatus.signedOut => const LoginScreen(key: ValueKey('login')),
          AuthStatus.signedIn => const HomeShell(key: ValueKey('home')),
        },
      ),
    );
  }
}
