import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:hive/hive.dart';
import '../widgets/pickup_card_dialog.dart';

class ScannerScreen extends StatefulWidget {
  const ScannerScreen({super.key});

  @override
  State<ScannerScreen> createState() => _ScannerScreenState();
}

class _ScannerScreenState extends State<ScannerScreen> {
  final MobileScannerController controller = MobileScannerController(
    detectionSpeed: DetectionSpeed.normal,
    facing: CameraFacing.back,
    torchEnabled: false,
  );

  bool _isProcessing = false;

  void _onDetect(BarcodeCapture capture) {
    if (_isProcessing) return;
    final List<Barcode> barcodes = capture.barcodes;
    for (final barcode in barcodes) {
      if (barcode.rawValue != null) {
        setState(() {
          _isProcessing = true;
        });
        _handleScannedData(barcode.rawValue!);
        break;
      }
    }
  }

  void _handleScannedData(String rawData) {
    try {
      final Map<String, dynamic> data = jsonDecode(rawData);
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (ctx) => PickupCardDialog(
          studentData: data,
          onApprove: () async {
            final box = Hive.box('pickup_logs');
            await box.add({
              'studentId': data['id'],
              'name': '${data['fn']} ${data['ln']}',
              'class': data['cls'],
              'time': DateTime.now().toIso8601String(),
              'status': 'APPROVED',
            });
            Navigator.of(ctx).pop();
            setState(() {
              _isProcessing = false;
            });
          },
          onClose: () {
            Navigator.of(ctx).pop();
            setState(() {
              _isProcessing = false;
            });
          },
        ),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Invalid QR Code Payload: $e'),
          backgroundColor: Colors.redAccent,
        ),
      );
      setState(() {
        _isProcessing = false;
      });
    }
  }

  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF06140D),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0D281B),
        elevation: 6,
        centerTitle: true,
        title: const Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.security, color: Color(0xFF4ADE80)),
            SizedBox(width: 8),
            Text(
              'AI ACADEMY GATE SCANNER',
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.black,
                fontSize: 16,
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: ValueListenableBuilder(
              valueListenable: controller.torchState,
              builder: (context, state, child) {
                switch (state) {
                  case TorchState.off:
                    return const Icon(Icons.flash_off, color: Colors.grey);
                  case TorchState.on:
                    return const Icon(Icons.flash_on, color: Colors.amber);
                }
              },
            ),
            onPressed: () => controller.toggleTorch(),
          ),
        ],
      ),
      body: Stack(
        children: [
          // Camera Scanner
          MobileScanner(
            controller: controller,
            onDetect: _onDetect,
          ),

          // Soft 3D Viewfinder Overlay
          Center(
            child: Container(
              width: 280,
              height: 280,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(32),
                border: Border.all(
                  color: const Color(0xFF4ADE80),
                  width: 3,
                ),
                boxShadow: const [
                  BoxShadow(
                    color: Color(0x660F7343),
                    blurRadius: 30,
                    spreadRadius: 5,
                  ),
                ],
              ),
            ),
          ),

          // Top Status Pill
          Positioned(
            top: 24,
            left: 20,
            right: 20,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: const Color(0xEE0D281B),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: const Color(0xFF1E4D34)),
                boxShadow: const [
                  BoxShadow(
                    color: Colors.black45,
                    blurRadius: 10,
                    offset: Offset(0, 4),
                  ),
                ],
              ),
              child: const Row(
                children: [
                  Icon(Icons.wifi_off_rounded, color: Color(0xFFFFB703), size: 20),
                  SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      'OFFLINE MODE ACTIVE • 100% Zero Internet',
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
