import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Midnight Lime: dark charcoal surfaces with a lime accent (matches the web app).
class AppColors {
  static const bg = Color(0xFF0D1117);
  static const surface = Color(0xFF131A24);
  static const surface2 = Color(0xFF0A0E14);
  static const raise = Color(0xFF1A2230);
  static const border = Color(0xFF243042);
  static const text = Color(0xFFE6EDF3);
  static const muted = Color(0xFF8B98A5);
  static const primary = Color(0xFFA3E635);
  static const primarySoft = Color(0x24A3E635);
  static const onPrimary = Color(0xFF0D1117);
  static const danger = Color(0xFFF87171);
  static const indigo = Color(0xFF818CF8);
  static const amber = Color(0xFFFBBF24);
  static const pink = Color(0xFFF472B6);
  static const sky = Color(0xFF38BDF8);
  static const teal = Color(0xFF2DD4BF);

  static const chart = [primary, indigo, amber, pink, sky, teal];
}

TextStyle head(double size, {FontWeight w = FontWeight.w700, Color? color}) =>
    GoogleFonts.spaceGrotesk(fontSize: size, fontWeight: w, color: color ?? AppColors.text, letterSpacing: -0.4, height: 1.15);

ThemeData buildTheme() {
  final base = ThemeData(brightness: Brightness.dark, useMaterial3: true);
  // google_fonts' own TextTheme helpers use a different Material package type, so apply just the family name.
  final text = base.textTheme.apply(fontFamily: GoogleFonts.inter().fontFamily, bodyColor: AppColors.text, displayColor: AppColors.text);
  OutlineInputBorder border(Color c, [double w = 1]) =>
      OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: c, width: w));

  return base.copyWith(
    scaffoldBackgroundColor: AppColors.bg,
    colorScheme: const ColorScheme.dark(
      primary: AppColors.primary,
      onPrimary: AppColors.onPrimary,
      surface: AppColors.surface,
      onSurface: AppColors.text,
      error: AppColors.danger,
    ),
    textTheme: text,
    appBarTheme: AppBarTheme(
      backgroundColor: AppColors.bg,
      elevation: 0,
      scrolledUnderElevation: 0,
      centerTitle: false,
      titleTextStyle: head(24),
    ),
    cardTheme: CardThemeData(
      color: AppColors.surface,
      elevation: 0,
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16), side: const BorderSide(color: AppColors.border)),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: AppColors.bg,
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
      hintStyle: const TextStyle(color: Color(0xFF6B7A8A)),
      border: border(AppColors.border),
      enabledBorder: border(AppColors.border),
      focusedBorder: border(AppColors.primary, 1.6),
      errorBorder: border(AppColors.danger),
      focusedErrorBorder: border(AppColors.danger, 1.6),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: AppColors.primary,
        foregroundColor: AppColors.onPrimary,
        minimumSize: const Size.fromHeight(50),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        textStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: AppColors.text,
        minimumSize: const Size.fromHeight(50),
        side: const BorderSide(color: AppColors.border),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    ),
    floatingActionButtonTheme: const FloatingActionButtonThemeData(backgroundColor: AppColors.primary, foregroundColor: AppColors.onPrimary),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: AppColors.surface2,
      indicatorColor: AppColors.raise,
      height: 68,
      labelTextStyle: WidgetStateProperty.resolveWith(
        (s) => TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: s.contains(WidgetState.selected) ? AppColors.primary : AppColors.muted),
      ),
      iconTheme: WidgetStateProperty.resolveWith(
        (s) => IconThemeData(color: s.contains(WidgetState.selected) ? AppColors.primary : AppColors.muted),
      ),
    ),
    bottomSheetTheme: const BottomSheetThemeData(
      backgroundColor: AppColors.surface,
      showDragHandle: true,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(22))),
    ),
    dialogTheme: DialogThemeData(
      backgroundColor: AppColors.surface,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18), side: const BorderSide(color: AppColors.border)),
    ),
    snackBarTheme: SnackBarThemeData(
      behavior: SnackBarBehavior.floating,
      backgroundColor: AppColors.raise,
      contentTextStyle: const TextStyle(color: AppColors.text),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
    ),
    dividerColor: AppColors.border,
    chipTheme: base.chipTheme.copyWith(
      backgroundColor: AppColors.surface,
      selectedColor: AppColors.primarySoft,
      side: const BorderSide(color: AppColors.border),
      labelStyle: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
    ),
  );
}
