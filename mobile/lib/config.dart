/// Build-time settings. Override with --dart-define, e.g.
///   flutter run --dart-define=API_URL=http://10.0.2.2:4000        (Android emulator -> local backend)
///   flutter run --dart-define=DEMO_MODE=false
class AppConfig {
  static const String apiUrl = String.fromEnvironment(
    'API_URL',
    defaultValue: 'https://doctor-tracker-api-ghl5.onrender.com',
  );

  /// Shows the "Quick sign in as demo admin" button (the API must also run with DEMO_MODE=true).
  static const bool demoMode = String.fromEnvironment('DEMO_MODE', defaultValue: 'true') == 'true';
}
