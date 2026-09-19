import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import '../data/models/chart_snapshot.dart';
import '../data/models/horoscope_models.dart';

class ZiweiPdfService {
  static Future<Uint8List> generateZiweiReportPdf({
    required ChartSnapshot snapshot,
    AnnualReportResponse? annualReport,
    required String systemKey,
    String? userName,
  }) async {
    final pdf = pw.Document();

    // Load Unicode font for Vietnamese rendering
    pw.Font? ttfRegular;
    pw.Font? ttfBold;
    try {
      ttfRegular = await PdfGoogleFonts.beVietnamProRegular();
      ttfBold = await PdfGoogleFonts.beVietnamProBold();
    } catch (_) {
      // Fallback to standard fonts if network is unavailable
      ttfRegular = pw.Font.helvetica();
      ttfBold = pw.Font.helveticaBold();
    }

    final summary = snapshot.summary ?? {};
    final birth = snapshot.birth ?? {};
    final palaces = snapshot.palaces ?? [];

    final name = userName ?? birth['name']?.toString() ?? 'Quý Khách';
    final solarDate = birth['solarDate']?.toString() ?? summary['solarDate']?.toString() ?? 'N/A';
    final lunarDate = birth['lunarDate']?.toString() ?? summary['lunarDate']?.toString() ?? 'N/A';
    final solarTime = birth['solarTime']?.toString() ?? summary['solarTime']?.toString() ?? 'N/A';
    final gender = birth['gender']?.toString() == 'male' ? 'Nam Mạng' : (birth['gender']?.toString() == 'female' ? 'Nữ Mạng' : 'N/A');
    String extractPillar(dynamic pillar) {
      if (pillar == null) return 'N/A';
      if (pillar is Map) {
        return pillar['stemBranch']?.toString() ?? pillar.toString();
      }
      return pillar.toString();
    }

    final stemBranchYear = extractPillar(summary['yearPillar']);
    final stemBranchMonth = extractPillar(summary['monthPillar']);
    final stemBranchDay = extractPillar(summary['dayPillar']);
    final stemBranchHour = extractPillar(summary['hourPillar']);

    final fiveElements = summary['fiveElements']?.toString() ?? 'N/A';
    final destinyYinYang = summary['destinyYinYang']?.toString() ?? 'N/A';
    final bodyPalace = summary['bodyPalace']?.toString() ?? 'N/A';

    final theme = pw.ThemeData.withFont(
      base: ttfRegular,
      bold: ttfBold,
    );

    const goldColor = PdfColor.fromInt(0xFFD4AF37);
    const redStarColor = PdfColor.fromInt(0xFFD32F2F);
    const blueStarColor = PdfColor.fromInt(0xFF0288D1);

    // ==========================================
    // TRANG 1: BÌA BÁO CÁO & THÔNG TIN BẢN MỆNH
    // ==========================================
    pdf.addPage(
      pw.Page(
        pageFormat: PdfPageFormat.a4,
        theme: theme,
        build: (pw.Context context) {
          return pw.Container(
            padding: const pw.EdgeInsets.all(24),
            decoration: pw.BoxDecoration(
              border: pw.Border.all(color: goldColor, width: 2),
            ),
            child: pw.Column(
              crossAxisAlignment: pw.CrossAxisAlignment.center,
              children: [
                pw.SizedBox(height: 16),
                pw.Text(
                  'TỬ VI TOÀN TẬP',
                  style: pw.TextStyle(
                    font: ttfBold,
                    fontSize: 26,
                    color: goldColor,
                    letterSpacing: 2,
                  ),
                ),
                pw.SizedBox(height: 6),
                pw.Text(
                  'BÁO CÁO VẬN MỆNH & LƯU NIÊN CHUYÊN SÂU',
                  style: pw.TextStyle(
                    font: ttfBold,
                    fontSize: 14,
                    color: PdfColors.grey800,
                    letterSpacing: 1.5,
                  ),
                ),
                pw.Divider(color: goldColor, thickness: 1, height: 24),
                pw.SizedBox(height: 12),

                // Thẻ Thông Tin Đương Số
                pw.Container(
                  padding: const pw.EdgeInsets.all(16),
                  decoration: pw.BoxDecoration(
                    color: PdfColors.grey100,
                    borderRadius: const pw.BorderRadius.all(pw.Radius.circular(8)),
                    border: pw.Border.all(color: PdfColors.grey300),
                  ),
                  child: pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.start,
                    children: [
                      pw.Text(
                        'THÔNG TIN ĐƯƠNG SỐ',
                        style: pw.TextStyle(font: ttfBold, fontSize: 13, color: goldColor),
                      ),
                      pw.SizedBox(height: 10),
                      pw.Row(
                        mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                        children: [
                          pw.Text('Họ và tên: $name', style: pw.TextStyle(font: ttfBold, fontSize: 12)),
                          pw.Text('Giới tính: $gender', style: const pw.TextStyle(fontSize: 12)),
                        ],
                      ),
                      pw.SizedBox(height: 6),
                      pw.Row(
                        mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                        children: [
                          pw.Text('Dương lịch: $solarDate ($solarTime)', style: const pw.TextStyle(fontSize: 11)),
                          pw.Text('Âm lịch: $lunarDate', style: const pw.TextStyle(fontSize: 11)),
                        ],
                      ),
                      pw.SizedBox(height: 6),
                      pw.Row(
                        mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                        children: [
                          pw.Text('Bản Mệnh / Cục: $fiveElements', style: const pw.TextStyle(fontSize: 11)),
                          pw.Text('Âm Dương: $destinyYinYang', style: const pw.TextStyle(fontSize: 11)),
                        ],
                      ),
                      pw.SizedBox(height: 6),
                      pw.Text('Thân cư: $bodyPalace', style: const pw.TextStyle(fontSize: 11)),
                    ],
                  ),
                ),

                pw.SizedBox(height: 16),

                // Bảng Bát Tự Tứ Trụ
                pw.Container(
                  padding: const pw.EdgeInsets.all(12),
                  decoration: pw.BoxDecoration(
                    border: pw.Border.all(color: goldColor, width: 0.8),
                    borderRadius: const pw.BorderRadius.all(pw.Radius.circular(6)),
                  ),
                  child: pw.Column(
                    children: [
                      pw.Text(
                        'BÁT TỰ TỨ TRỤ (NĂM - THÁNG - NGÀY - GIỜ)',
                        style: pw.TextStyle(font: ttfBold, fontSize: 11, color: goldColor),
                      ),
                      pw.SizedBox(height: 8),
                      pw.Row(
                        mainAxisAlignment: pw.MainAxisAlignment.spaceAround,
                        children: [
                          pw.Column(children: [
                            pw.Text('Trụ Năm', style: pw.TextStyle(font: ttfBold, fontSize: 10)),
                            pw.SizedBox(height: 2),
                            pw.Text(stemBranchYear, style: const pw.TextStyle(fontSize: 11, color: redStarColor)),
                          ]),
                          pw.Column(children: [
                            pw.Text('Trụ Tháng', style: pw.TextStyle(font: ttfBold, fontSize: 10)),
                            pw.SizedBox(height: 2),
                            pw.Text(stemBranchMonth, style: const pw.TextStyle(fontSize: 11, color: redStarColor)),
                          ]),
                          pw.Column(children: [
                            pw.Text('Trụ Ngày', style: pw.TextStyle(font: ttfBold, fontSize: 10)),
                            pw.SizedBox(height: 2),
                            pw.Text(stemBranchDay, style: const pw.TextStyle(fontSize: 11, color: redStarColor)),
                          ]),
                          pw.Column(children: [
                            pw.Text('Trụ Giờ', style: pw.TextStyle(font: ttfBold, fontSize: 10)),
                            pw.SizedBox(height: 2),
                            pw.Text(stemBranchHour, style: const pw.TextStyle(fontSize: 11, color: redStarColor)),
                          ]),
                        ],
                      ),
                    ],
                  ),
                ),

                pw.SizedBox(height: 20),

                // Tóm tắt các cung then chốt
                pw.Text(
                  'TỔNG HỢP CÁC CUNG VỊ THEN CHỐT',
                  style: pw.TextStyle(font: ttfBold, fontSize: 12, color: goldColor),
                ),
                pw.SizedBox(height: 8),
                pw.Expanded(
                  child: pw.ListView.builder(
                    itemCount: palaces.length > 6 ? 6 : palaces.length,
                    itemBuilder: (context, idx) {
                      final p = palaces[idx];
                      final stars = p.majorStars.map((s) => s.displayName ?? s.nameKey).join(', ');
                      return pw.Padding(
                        padding: const pw.EdgeInsets.only(bottom: 6),
                        child: pw.Row(
                          crossAxisAlignment: pw.CrossAxisAlignment.start,
                          children: [
                            pw.Container(
                              width: 100,
                              child: pw.Text(
                                '${p.displayName ?? p.nameKey} (${p.heavenlyStemKey.split('.').last} ${p.earthlyBranchKey.split('.').last}):',
                                style: pw.TextStyle(font: ttfBold, fontSize: 10),
                              ),
                            ),
                            pw.Expanded(
                              child: pw.Text(
                                stars.isNotEmpty ? stars : 'Vô chính diệu',
                                style: const pw.TextStyle(fontSize: 10, color: redStarColor),
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ),

                pw.Divider(color: PdfColors.grey300, thickness: 0.5),
                pw.Row(
                  mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                  children: [
                    pw.Text('Hệ thuật số: $systemKey', style: const pw.TextStyle(fontSize: 8, color: PdfColors.grey600)),
                    pw.Text('Tử Vi Toàn Tập AI Engine', style: const pw.TextStyle(fontSize: 8, color: PdfColors.grey600)),
                  ],
                ),
              ],
            ),
          );
        },
      ),
    );

    // ==========================================
    // TRANG 2: MA TRẬN 12 CUNG THIÊN BÀN TỬ VI
    // ==========================================
    pdf.addPage(
      pw.Page(
        pageFormat: PdfPageFormat.a4,
        theme: theme,
        build: (pw.Context context) {
          // Xây dựng ma trận 4x4 cho Thiên Bàn
          // Row 0: Cung Tỵ (5), Ngọ (6), Mùi (7), Thân (8)
          // Row 1: Cung Thìn (4), [Trung Cung], Dậu (9)
          // Row 2: Cung Mão (3), [Trung Cung], Tuất (10)
          // Row 3: Cung Dần (2), Sửu (1), Tý (0), Hợi (11)

          Palace? getPalaceByIndex(int idx) {
            try {
              return palaces.firstWhere((p) => p.index == idx);
            } catch (_) {
              return null;
            }
          }

          pw.Widget buildPalaceCell(int? index) {
            if (index == null) {
              return pw.Container();
            }
            final p = getPalaceByIndex(index);
            if (p == null) {
              return pw.Container();
            }

            final majorStars = p.majorStars.map((s) => s.displayName ?? s.nameKey).join('\n');
            final minorStars = p.minorStars.take(3).map((s) => s.displayName ?? s.nameKey).join(', ');

            return pw.Container(
              padding: const pw.EdgeInsets.all(6),
              decoration: pw.BoxDecoration(
                border: pw.Border.all(color: goldColor, width: 0.5),
                color: p.isBodyPalace || p.isOriginalPalace ? PdfColors.amber50 : PdfColors.white,
              ),
              child: pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                children: [
                  pw.Row(
                    mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                    children: [
                      pw.Text(
                        p.displayName ?? p.nameKey,
                        style: pw.TextStyle(font: ttfBold, fontSize: 10, color: goldColor),
                      ),
                      pw.Text(
                        '${p.heavenlyStemKey.split('.').last} ${p.earthlyBranchKey.split('.').last}',
                        style: const pw.TextStyle(fontSize: 8, color: PdfColors.grey700),
                      ),
                    ],
                  ),
                  pw.SizedBox(height: 2),
                  pw.Text(
                    majorStars.isNotEmpty ? majorStars : 'Vô chính diệu',
                    style: pw.TextStyle(font: ttfBold, fontSize: 8, color: redStarColor),
                  ),
                  if (minorStars.isNotEmpty)
                    pw.Text(
                      minorStars,
                      style: const pw.TextStyle(fontSize: 7, color: blueStarColor),
                      maxLines: 2,
                    ),
                  pw.Row(
                    mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                    children: [
                      pw.Text(
                        'Hạn: ${p.ages.isNotEmpty ? p.ages.first : ''}',
                        style: const pw.TextStyle(fontSize: 7, color: PdfColors.grey600),
                      ),
                      if (p.isBodyPalace)
                        pw.Text('(Thân)', style: pw.TextStyle(font: ttfBold, fontSize: 7, color: redStarColor)),
                    ],
                  ),
                ],
              ),
            );
          }

          return pw.Container(
            padding: const pw.EdgeInsets.all(16),
            child: pw.Column(
              children: [
                pw.Text(
                  'THIÊN BÀN 12 CUNG VỊ',
                  style: pw.TextStyle(font: ttfBold, fontSize: 16, color: goldColor),
                ),
                pw.SizedBox(height: 12),
                pw.Expanded(
                  child: pw.Table(
                    border: pw.TableBorder.all(color: goldColor, width: 0.8),
                    children: [
                      // Row 0
                      pw.TableRow(
                        children: [
                          buildPalaceCell(5),
                          buildPalaceCell(6),
                          buildPalaceCell(7),
                          buildPalaceCell(8),
                        ],
                      ),
                      // Row 1
                      pw.TableRow(
                        children: [
                          buildPalaceCell(4),
                          pw.Container(
                            padding: const pw.EdgeInsets.all(8),
                            child: pw.Center(
                              child: pw.Text(
                                'TỬ VI TOÀN TẬP\n$name - $gender',
                                textAlign: pw.TextAlign.center,
                                style: pw.TextStyle(font: ttfBold, fontSize: 9, color: goldColor),
                              ),
                            ),
                          ),
                          pw.Container(
                            padding: const pw.EdgeInsets.all(8),
                            child: pw.Center(
                              child: pw.Text(
                                'Năm sinh: $stemBranchYear\nBản mệnh: $fiveElements',
                                textAlign: pw.TextAlign.center,
                                style: const pw.TextStyle(fontSize: 8, color: PdfColors.grey800),
                              ),
                            ),
                          ),
                          buildPalaceCell(9),
                        ],
                      ),
                      // Row 2
                      pw.TableRow(
                        children: [
                          buildPalaceCell(3),
                          pw.Container(
                            padding: const pw.EdgeInsets.all(8),
                            child: pw.Center(
                              child: pw.Text(
                                'Dương lịch: $solarDate\nÂm lịch: $lunarDate',
                                textAlign: pw.TextAlign.center,
                                style: const pw.TextStyle(fontSize: 8, color: PdfColors.grey800),
                              ),
                            ),
                          ),
                          pw.Container(
                            padding: const pw.EdgeInsets.all(8),
                            child: pw.Center(
                              child: pw.Text(
                                'Thân cư: $bodyPalace\nCục: $destinyYinYang',
                                textAlign: pw.TextAlign.center,
                                style: const pw.TextStyle(fontSize: 8, color: PdfColors.grey800),
                              ),
                            ),
                          ),
                          buildPalaceCell(10),
                        ],
                      ),
                      // Row 3
                      pw.TableRow(
                        children: [
                          buildPalaceCell(2),
                          buildPalaceCell(1),
                          buildPalaceCell(0),
                          buildPalaceCell(11),
                        ],
                      ),
                    ],
                  ),
                ),
                pw.SizedBox(height: 8),
                pw.Text(
                  'Ghi chú: Màu đỏ là Chính Tinh, Màu xanh là Phụ Tinh then chốt.',
                  style: const pw.TextStyle(fontSize: 8, color: PdfColors.grey600),
                ),
              ],
            ),
          );
        },
      ),
    );

    // =======================================================
    // TRANG 3+: VẬN HẠN LƯU NIÊN & LUẬN GIẢI CHUYÊN SÂU TỪ AI
    // =======================================================
    if (annualReport != null) {
      pdf.addPage(
        pw.MultiPage(
          pageFormat: PdfPageFormat.a4,
          theme: theme,
          margin: const pw.EdgeInsets.all(28),
          header: (pw.Context context) {
            return pw.Container(
              margin: const pw.EdgeInsets.only(bottom: 12),
              padding: const pw.EdgeInsets.only(bottom: 6),
              decoration: const pw.BoxDecoration(
                border: pw.Border(bottom: pw.BorderSide(color: goldColor, width: 0.8)),
              ),
              child: pw.Row(
                mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                children: [
                  pw.Text(
                    'BÁO CÁO VẬN HẠN NĂM ${annualReport.year} - $name',
                    style: pw.TextStyle(font: ttfBold, fontSize: 10, color: goldColor),
                  ),
                  pw.Text(
                    'Trang ${context.pageNumber} / ${context.pagesCount}',
                    style: const pw.TextStyle(fontSize: 9, color: PdfColors.grey600),
                  ),
                ],
              ),
            );
          },
          build: (pw.Context context) {
            final yearly = annualReport.frame.yearly;
            final monthly = annualReport.frame.monthly;

            return [
              pw.Text(
                'I. TỔNG QUAN LƯU NIÊN NĂM ${annualReport.year}',
                style: pw.TextStyle(font: ttfBold, fontSize: 13, color: goldColor),
              ),
              pw.SizedBox(height: 8),
              pw.Container(
                padding: const pw.EdgeInsets.all(10),
                decoration: pw.BoxDecoration(
                  color: PdfColors.grey100,
                  borderRadius: const pw.BorderRadius.all(pw.Radius.circular(6)),
                ),
                child: pw.Column(
                  crossAxisAlignment: pw.CrossAxisAlignment.start,
                  children: [
                    pw.Text(
                      'Lưu Niên: Can ${yearly.heavenlyStemKey.split('.').last} - Chi ${yearly.earthlyBranchKey.split('.').last} (Cung vị: ${yearly.index})',
                      style: pw.TextStyle(font: ttfBold, fontSize: 10),
                    ),
                    pw.SizedBox(height: 4),
                    pw.Text(
                      'Cung Lưu: ${yearly.palaceNameKeys.map((k) => k.split('.').last).join(', ')}',
                      style: const pw.TextStyle(fontSize: 10),
                    ),
                    if (yearly.mutagenStarKeys.isNotEmpty)
                      pw.Text(
                        'Tứ Hóa Lưu Niên: ${yearly.mutagenStarKeys.map((k) => k.split('.').last).join(', ')}',
                        style: const pw.TextStyle(fontSize: 10, color: redStarColor),
                      ),
                  ],
                ),
              ),
              pw.SizedBox(height: 14),

              // Bảng 12 Lưu Nguyệt
              pw.Text(
                'II. VẬN HẠN 12 THÁNG LƯU NGUYỆT',
                style: pw.TextStyle(font: ttfBold, fontSize: 13, color: goldColor),
              ),
              pw.SizedBox(height: 8),
              pw.TableHelper.fromTextArray(
                border: pw.TableBorder.all(color: PdfColors.grey300, width: 0.5),
                headerStyle: pw.TextStyle(font: ttfBold, fontSize: 9, color: PdfColors.white),
                headerDecoration: const pw.BoxDecoration(color: goldColor),
                cellStyle: const pw.TextStyle(fontSize: 8),
                headers: ['Tháng', 'Can Chi', 'Cung Vị', 'Tứ Hóa / Lưu Tinh'],
                data: List<List<String>>.generate(monthly.length, (i) {
                  final m = monthly[i];
                  return [
                    'Tháng ${i + 1}',
                    '${m.heavenlyStemKey.split('.').last} ${m.earthlyBranchKey.split('.').last}',
                    m.palaceNameKeys.map((k) => k.split('.').last).join(', '),
                    m.mutagenStarKeys.map((k) => k.split('.').last).join(', '),
                  ];
                }),
              ),
              pw.SizedBox(height: 16),

              // Toàn văn bài Luận Giải AI
              pw.Text(
                'III. LUẬN GIẢI CHI TIẾT TỪ AI TỬ VI CHUYÊN SÂU',
                style: pw.TextStyle(font: ttfBold, fontSize: 13, color: goldColor),
              ),
              pw.SizedBox(height: 8),
              pw.Paragraph(
                text: annualReport.markdown.replaceAll(RegExp(r'[#*`_]'), ''),
                style: const pw.TextStyle(fontSize: 10, lineSpacing: 3),
              ),
            ];
          },
        ),
      );
    }

    return pdf.save();
  }

  static Future<void> shareOrPrintPdf(
    BuildContext context, {
    required Uint8List pdfBytes,
    required String filename,
  }) async {
    try {
      await Printing.sharePdf(
        bytes: pdfBytes,
        filename: filename,
      );
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Lỗi chia sẻ PDF: $e')),
        );
      }
    }
  }
}
