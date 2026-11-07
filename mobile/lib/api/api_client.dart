import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config.dart';

class ApiException implements Exception {
  ApiException(this.message, {this.status, this.fields = const {}});
  final String message;
  final int? status;

  /// Per-field validation messages from the API (zod), keyed by field name.
  final Map<String, String> fields;

  @override
  String toString() => message;
}

/// Thin REST client. Sends the JWT as a Bearer token (the API accepts cookie or Bearer).
class ApiClient {
  ApiClient({this.onUnauthorized});

  String? token;
  void Function()? onUnauthorized;
  final http.Client _client = http.Client();

  Uri _uri(String path, [Map<String, dynamic>? query]) {
    final params = <String, String>{};
    query?.forEach((k, v) {
      if (v != null && v.toString().isNotEmpty) params[k] = v.toString();
    });
    return Uri.parse('${AppConfig.apiUrl}/api$path').replace(queryParameters: params.isEmpty ? null : params);
  }

  Future<Map<String, dynamic>> _send(String method, String path, {Map<String, dynamic>? query, Object? body}) async {
    final req = http.Request(method, _uri(path, query))..headers['Accept'] = 'application/json';
    if (body != null) {
      req.headers['Content-Type'] = 'application/json';
      req.body = jsonEncode(body);
    }
    if (token != null) req.headers['Authorization'] = 'Bearer $token';

    http.Response res;
    try {
      // Render's free tier can take ~50s to wake up, so allow a long first request.
      final streamed = await _client.send(req).timeout(const Duration(seconds: 70));
      res = await http.Response.fromStream(streamed);
    } on TimeoutException {
      throw ApiException('The server took too long to respond. Please try again.');
    } catch (_) {
      throw ApiException('Cannot reach the server. Check your internet connection.');
    }

    Map<String, dynamic> data = {};
    try {
      final decoded = res.body.isEmpty ? {} : jsonDecode(res.body);
      if (decoded is Map<String, dynamic>) data = decoded;
    } catch (_) {}

    if (res.statusCode >= 200 && res.statusCode < 300) return data;

    if (res.statusCode == 401 && token != null) onUnauthorized?.call();
    final fields = <String, String>{};
    final errs = data['errors'];
    if (errs is List) {
      for (final e in errs) {
        if (e is Map) fields[e['field'].toString()] = e['message'].toString();
      }
    }
    throw ApiException(
      data['message']?.toString() ?? 'Request failed (${res.statusCode})',
      status: res.statusCode,
      fields: fields,
    );
  }

  Future<Map<String, dynamic>> get(String path, {Map<String, dynamic>? query}) => _send('GET', path, query: query);
  Future<Map<String, dynamic>> post(String path, {Object? body}) => _send('POST', path, body: body ?? {});
  Future<Map<String, dynamic>> patch(String path, {Object? body}) => _send('PATCH', path, body: body ?? {});
  Future<Map<String, dynamic>> delete(String path) => _send('DELETE', path);
}
