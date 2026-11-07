import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../api/api_client.dart';

enum AuthStatus { loading, signedOut, signedIn }

class AuthState extends ChangeNotifier {
  AuthState() {
    api = ApiClient(onUnauthorized: _expired);
  }

  late final ApiClient api;
  AuthStatus status = AuthStatus.loading;
  String? email;
  static const _key = 'dt_token';

  Future<void> init() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final saved = prefs.getString(_key);
      if (saved == null) return _set(AuthStatus.signedOut);
      api.token = saved;
      final me = await api.get('/auth/me');
      email = (me['user'] as Map?)?['email']?.toString();
      _set(AuthStatus.signedIn);
    } catch (_) {
      // token expired or server unreachable: ask the user to sign in again
      api.token = null;
      _set(AuthStatus.signedOut);
    }
  }

  Future<void> login(String emailValue, String password) async {
    final res = await api.post('/auth/login', body: {'email': emailValue.trim(), 'password': password});
    await _finish(res);
  }

  Future<void> demoLogin() async {
    final res = await api.post('/auth/demo');
    await _finish(res);
  }

  Future<void> _finish(Map<String, dynamic> res) async {
    api.token = res['token']?.toString();
    email = (res['user'] as Map?)?['email']?.toString();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_key, api.token ?? '');
    _set(AuthStatus.signedIn);
  }

  Future<void> logout() async {
    api.token = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_key);
    _set(AuthStatus.signedOut);
  }

  void _expired() {
    if (status == AuthStatus.signedIn) logout();
  }

  void _set(AuthStatus s) {
    status = s;
    notifyListeners();
  }
}
