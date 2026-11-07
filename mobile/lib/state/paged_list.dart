import 'package:flutter/foundation.dart';
import '../models.dart';

typedef PageFetcher<T> = Future<Paged<T>> Function(int page, int limit, Map<String, String> filters);

/// Infinite-scroll list state: search + filters + pagination in one place, reused by every list screen.
class PagedList<T> extends ChangeNotifier {
  PagedList(this._fetch, {this.limit = 15});

  final PageFetcher<T> _fetch;
  final int limit;

  List<T> items = [];
  int page = 0;
  int total = 0;
  bool loading = false;
  bool hasMore = true;
  bool loadedOnce = false;
  String? error;
  Map<String, String> filters = {};
  int _generation = 0;

  bool get hasActiveFilters => filters.entries.any((e) => e.key != 'q' && e.key != 'sort' && e.value.isNotEmpty) || (filters['sort'] ?? '').isNotEmpty;

  Future<void> refresh() async {
    _generation++;
    items = [];
    page = 0;
    hasMore = true;
    error = null;
    loading = false;
    await loadMore();
  }

  Future<void> loadMore() async {
    if (loading || !hasMore) return;
    loading = true;
    error = null;
    notifyListeners();
    final gen = _generation;
    try {
      final r = await _fetch(page + 1, limit, filters);
      if (gen != _generation) return; // a newer refresh superseded this request
      items = [...items, ...r.items];
      page = r.page;
      total = r.total;
      hasMore = r.page < r.totalPages;
      loadedOnce = true;
    } catch (e) {
      if (gen == _generation) error = e.toString();
    } finally {
      if (gen == _generation) {
        loading = false;
        notifyListeners();
      }
    }
  }

  void setFilters(Map<String, String> next) {
    filters = {...next}..removeWhere((_, v) => v.isEmpty);
    refresh();
  }

  void setQuery(String q) {
    final next = {...filters};
    if (q.isEmpty) {
      next.remove('q');
    } else {
      next['q'] = q;
    }
    filters = next;
    refresh();
  }
}
