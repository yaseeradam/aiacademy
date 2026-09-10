import 'package:flutter/material.dart';

class PickupCardDialog extends StatelessWidget {
  final Map<String, dynamic> studentData;
  final VoidCallback onApprove;
  final VoidCallback onClose;

  const PickupCardDialog({
    super.key,
    required this.studentData,
    required this.onApprove,
    required this.onClose,
  });

  @override
  Widget build(BuildContext context) {
    final String fullName = '${studentData['fn'] ?? ''} ${studentData['ln'] ?? ''}'.trim();
    final String classArm = studentData['cls'] ?? 'N/A';
    final String formNumber = studentData['form'] ?? 'N/A';
    final String fatherName = studentData['fa'] ?? 'N/A';
    final String phone = studentData['ph'] ?? 'N/A';

    return Dialog(
      backgroundColor: Colors.transparent,
      insetPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
      child: Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFF0F3822), Color(0xFF061A0F)],
          ),
          borderRadius: BorderRadius.circular(32),
          border: Border.all(color: const Color(0xFF4ADE80), width: 2),
          boxShadow: const [
            BoxShadow(
              color: Colors.black87,
              blurRadius: 40,
              spreadRadius: 10,
            ),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Status Header Badge
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
              decoration: BoxDecoration(
                color: const Color(0x33FFB703),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: const Color(0xFFFFB703)),
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.verified, color: Color(0xFFFFB703), size: 16),
                  SizedBox(width: 6),
                  Text(
                    'AUTHENTICATED PICKUP PASS',
                    style: TextStyle(
                      color: Color(0xFFFFB703),
                      fontSize: 11,
                      fontWeight: FontWeight.black,
                      letterSpacing: 1,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Student Photo Avatar & Name
            Container(
              width: 80,
              height: 90,
              decoration: BoxDecoration(
                color: const Color(0xFF163E27),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: const Color(0xFF4ADE80)),
                boxShadow: const [
                  BoxShadow(color: Colors.black45, blurRadius: 10),
                ],
              ),
              child: Center(
                child: Text(
                  fullName.isNotEmpty ? fullName[0] : 'S',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 32,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 14),

            Text(
              fullName,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 22,
                fontWeight: FontWeight.black,
              ),
              textAlign: TextAlign.center,
            ),

            const SizedBox(height: 6),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
              decoration: BoxDecoration(
                color: const Color(0xFF0F7343),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                classArm,
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.extrabold,
                  fontSize: 13,
                ),
              ),
            ),
            const SizedBox(height: 4),
            Text(
              'Form No: $formNumber',
              style: const TextStyle(color: Colors.grey, fontSize: 12),
            ),
            const SizedBox(height: 16),

            // Parent Info Card
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: const Color(0xFF06140D),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFF1A452E)),
              ),
              child: Column(
                children: [
                  Row(
                    children: [
                      const Icon(Icons.person, color: Colors.grey, size: 18),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'Parent: $fatherName',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      const Icon(Icons.phone, color: Color(0xFF4ADE80), size: 18),
                      const SizedBox(width: 8),
                      Text(
                        'Phone: $phone',
                        style: const TextStyle(
                          color: Color(0xFF4ADE80),
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Action Buttons
            Row(
              children: [
                Expanded(
                  child: TextButton(
                    onPressed: onClose,
                    style: TextButton.styleFrom(
                      padding: const EdgeInsets.vertical(14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                    ),
                    child: const Text(
                      'Cancel',
                      style: TextStyle(color: Colors.grey, fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  flex: 2,
                  child: ElevatedButton.icon(
                    onPressed: onApprove,
                    icon: const Icon(Icons.check_circle, color: Colors.white),
                    label: const Text(
                      'APPROVE PICKUP',
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.black,
                        fontSize: 13,
                      ),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF0F7343),
                      padding: const EdgeInsets.vertical(14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                      elevation: 8,
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
