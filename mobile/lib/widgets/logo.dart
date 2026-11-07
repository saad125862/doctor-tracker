import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme.dart';

/// The "Stethoscope" mark, drawn in a 120 x 130 box: one stroke plus a chest-piece dot.
class LogoMark extends StatelessWidget {
  const LogoMark({super.key, this.size = 36, this.color = AppColors.primary, this.dot = AppColors.surface2});
  final double size;
  final Color color, dot;

  @override
  Widget build(BuildContext context) => Semantics(
        label: 'Doctor Tracker logo',
        child: CustomPaint(size: Size(size, size * 130 / 120), painter: _MarkPainter(color, dot)),
      );
}

class _MarkPainter extends CustomPainter {
  _MarkPainter(this.color, this.dot);
  final Color color, dot;

  @override
  void paint(Canvas canvas, Size size) {
    canvas.scale(size.width / 120);
    final stroke = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 10
      ..strokeCap = StrokeCap.round;
    final fill = Paint()..color = color;

    final u = Path()
      ..moveTo(28, 20)
      ..lineTo(28, 52)
      ..arcToPoint(const Offset(92, 52), radius: const Radius.circular(32), clockwise: false)
      ..lineTo(92, 20);
    canvas.drawPath(u, stroke);
    canvas.drawCircle(const Offset(28, 16), 8, fill);
    canvas.drawCircle(const Offset(92, 16), 8, fill);
    canvas.drawLine(const Offset(60, 84), const Offset(60, 94), stroke);
    canvas.drawCircle(const Offset(60, 108), 15, fill);
    canvas.drawCircle(const Offset(60, 108), 6, Paint()..color = dot);
  }

  @override
  bool shouldRepaint(_MarkPainter old) => old.color != color || old.dot != dot;
}

/// "Doctor *Tracker*": Fraunces, with the second word in italic lime.
class Wordmark extends StatelessWidget {
  const Wordmark({super.key, this.fontSize = 22});
  final double fontSize;

  @override
  Widget build(BuildContext context) {
    final base = GoogleFonts.fraunces(fontSize: fontSize, fontWeight: FontWeight.w500, letterSpacing: -0.6, color: AppColors.text);
    return Text.rich(TextSpan(style: base, children: [
      const TextSpan(text: 'Doctor '),
      TextSpan(text: 'Tracker', style: base.copyWith(fontStyle: FontStyle.italic, color: AppColors.primary)),
    ]));
  }
}
