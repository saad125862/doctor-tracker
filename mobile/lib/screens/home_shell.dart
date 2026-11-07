import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../state/auth_state.dart';
import '../theme.dart';
import '../widgets/common.dart';
import 'dashboard_screen.dart';
import 'doctors_screen.dart';
import 'patients_screen.dart';

class HomeShell extends StatefulWidget {
  const HomeShell({super.key});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _index = 0;

  Future<void> _signOut() async {
    final ok = await confirm(context, title: 'Sign out', message: 'You will need to sign in again.', action: 'Sign out');
    if (ok && mounted) context.read<AuthState>().logout();
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthState>();
    const titles = ['Dashboard', 'Doctors', 'Patients'];
    return Scaffold(
      appBar: AppBar(
        title: Text(titles[_index]),
        actions: [
          PopupMenuButton<String>(
            color: AppColors.raise,
            icon: const Icon(Icons.account_circle_rounded, size: 30, color: AppColors.muted),
            onSelected: (_) => _signOut(),
            itemBuilder: (_) => [
              PopupMenuItem(enabled: false, child: Text(auth.email ?? 'Admin', style: const TextStyle(color: AppColors.muted))),
              const PopupMenuItem(value: 'out', child: Row(children: [Icon(Icons.logout_rounded, size: 18), SizedBox(width: 10), Text('Sign out')])),
            ],
          ),
          const SizedBox(width: 8),
        ],
      ),
      // IndexedStack keeps each tab's scroll position and loaded data
      body: IndexedStack(index: _index, children: const [DashboardScreen(), DoctorsScreen(), PatientsScreen()]),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (i) => setState(() => _index = i),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.dashboard_outlined), selectedIcon: Icon(Icons.dashboard_rounded), label: 'Dashboard'),
          NavigationDestination(icon: Icon(Icons.medical_services_outlined), selectedIcon: Icon(Icons.medical_services_rounded), label: 'Doctors'),
          NavigationDestination(icon: Icon(Icons.groups_outlined), selectedIcon: Icon(Icons.groups_rounded), label: 'Patients'),
        ],
      ),
    );
  }
}
