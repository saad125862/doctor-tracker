import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../api/api_client.dart';
import '../config.dart';
import '../state/auth_state.dart';
import '../theme.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _form = GlobalKey<FormState>();
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _busy = false;
  bool _hide = true;
  String? _error;

  Future<void> _run(Future<void> Function() action) async {
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await action();
    } on ApiException catch (e) {
      if (mounted) setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.read<AuthState>();
    return Scaffold(
      body: Stack(children: [
        // soft glow blobs, like the web login
        Positioned(top: -120, right: -100, child: _blob(AppColors.primary, 320)),
        Positioned(bottom: -140, left: -110, child: _blob(AppColors.indigo, 300)),
        SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 420),
                child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                  Row(children: [
                    Container(
                      width: 38,
                      height: 38,
                      decoration: BoxDecoration(color: AppColors.primary, borderRadius: BorderRadius.circular(11)),
                      child: const Icon(Icons.add_rounded, color: AppColors.onPrimary, size: 24),
                    ),
                    const SizedBox(width: 12),
                    Text('Doctor Tracker', style: head(20)),
                  ]),
                  const SizedBox(height: 36),
                  Text('Doctors and patients,\nfinally in one place.', style: head(32)),
                  const SizedBox(height: 10),
                  const Text('Sign in to the admin portal.', style: TextStyle(color: AppColors.muted, fontSize: 16)),
                  const SizedBox(height: 28),
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(20),
                      child: Form(
                        key: _form,
                        child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                          if (_error != null)
                            Container(
                              margin: const EdgeInsets.only(bottom: 14),
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(color: const Color(0x24F87171), borderRadius: BorderRadius.circular(12)),
                              child: Text(_error!, style: const TextStyle(color: Color(0xFFFCA5A5))),
                            ),
                          TextFormField(
                            controller: _email,
                            keyboardType: TextInputType.emailAddress,
                            autofillHints: const [AutofillHints.email],
                            decoration: const InputDecoration(labelText: 'Email'),
                            validator: (v) => (v == null || !v.contains('@')) ? 'Enter a valid email' : null,
                          ),
                          const SizedBox(height: 14),
                          TextFormField(
                            controller: _password,
                            obscureText: _hide,
                            autofillHints: const [AutofillHints.password],
                            decoration: InputDecoration(
                              labelText: 'Password',
                              suffixIcon: IconButton(
                                icon: Icon(_hide ? Icons.visibility_rounded : Icons.visibility_off_rounded, color: AppColors.muted),
                                onPressed: () => setState(() => _hide = !_hide),
                              ),
                            ),
                            validator: (v) => (v == null || v.isEmpty) ? 'Enter your password' : null,
                            onFieldSubmitted: (_) => _signIn(auth),
                          ),
                          const SizedBox(height: 20),
                          FilledButton(onPressed: _busy ? null : () => _signIn(auth), child: Text(_busy ? 'Please wait...' : 'Sign in')),
                          if (AppConfig.demoMode) ...[
                            const SizedBox(height: 16),
                            const Row(children: [
                              Expanded(child: Divider()),
                              Padding(padding: EdgeInsets.symmetric(horizontal: 12), child: Text('OR', style: TextStyle(color: AppColors.muted, fontSize: 12))),
                              Expanded(child: Divider()),
                            ]),
                            const SizedBox(height: 16),
                            OutlinedButton.icon(
                              style: OutlinedButton.styleFrom(
                                foregroundColor: const Color(0xFFBEF264),
                                backgroundColor: AppColors.primarySoft,
                                side: const BorderSide(color: AppColors.primary, width: 1.4),
                              ),
                              onPressed: _busy ? null : () => _run(auth.demoLogin),
                              icon: const Icon(Icons.bolt_rounded),
                              label: const Text('Quick sign in as demo admin', style: TextStyle(fontWeight: FontWeight.w700)),
                            ),
                          ],
                        ]),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'The first request can take up to a minute while the free server wakes up.',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: AppColors.muted, fontSize: 12),
                  ),
                ]),
              ),
            ),
          ),
        ),
      ]),
    );
  }

  void _signIn(AuthState auth) {
    if (_form.currentState!.validate()) _run(() => auth.login(_email.text, _password.text));
  }

  Widget _blob(Color c, double size) => Container(
        width: size,
        height: size,
        decoration: BoxDecoration(shape: BoxShape.circle, gradient: RadialGradient(colors: [c.withValues(alpha: 0.28), c.withValues(alpha: 0)])),
      );
}
