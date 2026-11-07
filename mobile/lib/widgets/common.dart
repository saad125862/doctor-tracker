import 'dart:async';
import 'package:flutter/material.dart';
import '../state/paged_list.dart';
import '../theme.dart';

String initials(String name) {
  final parts = name.replaceFirst(RegExp(r'^dr\.?\s+', caseSensitive: false), '').trim().split(RegExp(r'\s+'));
  return parts.where((p) => p.isNotEmpty).take(2).map((p) => p[0].toUpperCase()).join();
}

String cap(String s) => s.isEmpty ? s : s[0].toUpperCase() + s.substring(1);

class InitialsAvatar extends StatelessWidget {
  const InitialsAvatar(this.name, {super.key, this.size = 44});
  final String name;
  final double size;

  @override
  Widget build(BuildContext context) => Container(
        width: size,
        height: size,
        alignment: Alignment.center,
        decoration: BoxDecoration(color: const Color(0xFF1E2B1A), borderRadius: BorderRadius.circular(size * 0.32)),
        child: Text(initials(name), style: TextStyle(color: const Color(0xFFBEF264), fontWeight: FontWeight.w700, fontSize: size * 0.34)),
      );
}

class Pill extends StatelessWidget {
  const Pill(this.text, {super.key, this.color = const Color(0xFFBEF264), this.bg = AppColors.primarySoft});
  final String text;
  final Color color, bg;

  factory Pill.gender(String gender) {
    switch (gender) {
      case 'male':
        return Pill(cap(gender), color: const Color(0xFF7DD3FC), bg: const Color(0x2938BDF8));
      case 'female':
        return Pill(cap(gender), color: const Color(0xFFF9A8D4), bg: const Color(0x29F472B6));
      default:
        return Pill(cap(gender), color: const Color(0xFFC3CED8), bg: const Color(0x298B98A5));
    }
  }

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
        decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(99)),
        child: Text(text, style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.w600)),
      );
}

class EmptyView extends StatelessWidget {
  const EmptyView({super.key, required this.icon, required this.title, this.text});
  final IconData icon;
  final String title;
  final String? text;

  @override
  Widget build(BuildContext context) => Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Icon(icon, size: 44, color: AppColors.muted),
            const SizedBox(height: 12),
            Text(title, style: head(18)),
            if (text != null) ...[const SizedBox(height: 4), Text(text!, textAlign: TextAlign.center, style: const TextStyle(color: AppColors.muted))],
          ]),
        ),
      );
}

class ErrorView extends StatelessWidget {
  const ErrorView(this.message, {super.key, this.onRetry});
  final String message;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) => Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            const Icon(Icons.cloud_off_rounded, size: 44, color: AppColors.danger),
            const SizedBox(height: 12),
            Text(message, textAlign: TextAlign.center, style: const TextStyle(color: AppColors.muted)),
            if (onRetry != null) ...[
              const SizedBox(height: 16),
              SizedBox(width: 160, child: OutlinedButton(onPressed: onRetry, child: const Text('Try again'))),
            ],
          ]),
        ),
      );
}

void toast(BuildContext context, String message) {
  ScaffoldMessenger.of(context)
    ..hideCurrentSnackBar()
    ..showSnackBar(SnackBar(content: Text(message)));
}

Future<bool> confirm(BuildContext context, {required String title, required String message, String action = 'Delete'}) async {
  final ok = await showDialog<bool>(
    context: context,
    builder: (ctx) => AlertDialog(
      title: Text(title, style: head(20)),
      content: Text(message, style: const TextStyle(color: AppColors.muted)),
      actions: [
        TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
        FilledButton(
          style: FilledButton.styleFrom(backgroundColor: AppColors.danger, foregroundColor: Colors.white, minimumSize: const Size(96, 44)),
          onPressed: () => Navigator.pop(ctx, true),
          child: Text(action),
        ),
      ],
    ),
  );
  return ok ?? false;
}

/// Search box that waits 400ms after typing stops before calling [onChanged].
class DebouncedSearch extends StatefulWidget {
  const DebouncedSearch({super.key, required this.hint, required this.onChanged});
  final String hint;
  final ValueChanged<String> onChanged;

  @override
  State<DebouncedSearch> createState() => _DebouncedSearchState();
}

class _DebouncedSearchState extends State<DebouncedSearch> {
  final _c = TextEditingController();
  Timer? _t;

  @override
  void dispose() {
    _t?.cancel();
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => TextField(
        controller: _c,
        textInputAction: TextInputAction.search,
        onChanged: (v) {
          _t?.cancel();
          _t = Timer(const Duration(milliseconds: 400), () => widget.onChanged(v.trim()));
          setState(() {});
        },
        decoration: InputDecoration(
          hintText: widget.hint,
          prefixIcon: const Icon(Icons.search_rounded, color: AppColors.muted),
          suffixIcon: _c.text.isEmpty
              ? null
              : IconButton(
                  icon: const Icon(Icons.close_rounded, size: 18),
                  onPressed: () {
                    _c.clear();
                    widget.onChanged('');
                    setState(() {});
                  },
                ),
        ),
      );
}

/// Pull-to-refresh list with infinite scroll, loading, empty and error states.
class PagedListView<T> extends StatefulWidget {
  const PagedListView({
    super.key,
    required this.list,
    required this.itemBuilder,
    required this.emptyIcon,
    required this.emptyTitle,
    this.emptyText,
    this.padding = const EdgeInsets.fromLTRB(16, 8, 16, 96),
    this.header,
  });

  final PagedList<T> list;
  final Widget Function(BuildContext, T) itemBuilder;
  final IconData emptyIcon;
  final String emptyTitle;
  final String? emptyText;
  final EdgeInsets padding;
  final Widget? header;

  @override
  State<PagedListView<T>> createState() => _PagedListViewState<T>();
}

class _PagedListViewState<T> extends State<PagedListView<T>> {
  final _scroll = ScrollController();

  @override
  void initState() {
    super.initState();
    _scroll.addListener(() {
      if (_scroll.position.pixels > _scroll.position.maxScrollExtent - 400) widget.list.loadMore();
    });
    if (!widget.list.loadedOnce && !widget.list.loading) widget.list.refresh();
  }

  @override
  void dispose() {
    _scroll.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: widget.list,
      builder: (context, _) {
        final l = widget.list;
        if (l.items.isEmpty && l.loading) return const Center(child: CircularProgressIndicator(color: AppColors.primary));
        if (l.items.isEmpty && l.error != null) return ErrorView(l.error!, onRetry: l.refresh);
        if (l.items.isEmpty) {
          return RefreshIndicator(
            onRefresh: l.refresh,
            child: ListView(children: [
              if (widget.header != null) widget.header!,
              SizedBox(height: 320, child: EmptyView(icon: widget.emptyIcon, title: widget.emptyTitle, text: widget.emptyText)),
            ]),
          );
        }
        return RefreshIndicator(
          onRefresh: l.refresh,
          color: AppColors.primary,
          child: ListView.separated(
            controller: _scroll,
            physics: const AlwaysScrollableScrollPhysics(),
            padding: widget.padding,
            itemCount: l.items.length + 1 + (widget.header != null ? 1 : 0),
            separatorBuilder: (_, _) => const SizedBox(height: 10),
            itemBuilder: (context, i) {
              if (widget.header != null) {
                if (i == 0) return widget.header!;
                i -= 1;
              }
              if (i == l.items.length) {
                if (l.loading) return const Padding(padding: EdgeInsets.all(16), child: Center(child: CircularProgressIndicator(color: AppColors.primary, strokeWidth: 2.5)));
                if (l.error != null) return Center(child: TextButton(onPressed: l.loadMore, child: const Text('Failed to load more. Tap to retry')));
                return Padding(
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  child: Center(child: Text('${l.total} total', style: const TextStyle(color: AppColors.muted, fontSize: 12))),
                );
              }
              return widget.itemBuilder(context, l.items[i]);
            },
          ),
        );
      },
    );
  }
}
