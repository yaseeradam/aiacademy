import 'package:flutter/material.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'screens/scanner_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Hive.initFlutter();
  await Hive.openBox('pickup_logs');
  runApp(const AiAcademyPickupApp());
}

class AiAcademyPickupApp extends StatelessWidget {
  const AiAcademyPickupApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'AI Academy Pickup Scanner',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        fontFamily: 'Roboto',
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF0F7343),
          primary: const Color(0xFF0F7343),
          secondary: const Color(0xFFFFB703),
          background: const Color(0xFF091E13),
        ),
        scaffoldBackgroundColor: const Color(0xFF06140D),
      ),
      home: const ScannerScreen(),
    );
  }
}
