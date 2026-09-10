import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import '../data/models/dossier_models.dart';

class RoyalDossierPdfService {
  static const PdfColor royalGold = PdfColor.fromInt(0xFFD4AF37);
  static const PdfColor royalGoldLight = PdfColor.fromInt(0xFFF9E8A2);
  static const PdfColor royalCrimson = PdfColor.fromInt(0xFF8C1D40);
  static const PdfColor parchmentDark = PdfColor.fromInt(0xFF13111C);
  static const PdfColor parchmentBorder = PdfColor.fromInt(0xFF2A2438);
  static const PdfColor textGold = PdfColor.fromInt(0xFFE8D49E);
  static const PdfColor textSecondary = PdfColor.fromInt(0xFFA59EBA);

  /// Tạo tệp PDF 19 trang vector A4 chất lượng cao
  static Future<Uint8List> generatePdf(RoyalDossierData dossier) async {
    final pdf = pw.Document();

    pw.Font? ttfRegular;
    pw.Font? ttfBold;
    try {
      ttfRegular = await PdfGoogleFonts.beVietnamProRegular();
      ttfBold = await PdfGoogleFonts.beVietnamProBold();
    } catch (_) {
      ttfRegular = pw.Font.helvetica();
      ttfBold = pw.Font.helveticaBold();
    }

    final theme = pw.ThemeData.withFont(
      base: ttfRegular,
      bold: ttfBold,
    );

    for (final page in dossier.pages) {
      pdf.addPage(
        pw.Page(
          pageFormat: PdfPageFormat.a4,
          theme: theme,
          margin: const pw.EdgeInsets.all(32),
          build: (context) {
            return pw.Container(
              decoration: pw.BoxDecoration(
                border: pw.Border.all(color: royalGold, width: 2),
                borderRadius: pw.BorderRadius.circular(8),
              ),
              padding: const pw.EdgeInsets.all(24),
              child: pw.Stack(
                children: [
                  // Thủy Ấn Bảo Mật Chìm Xoay Nghiêng
                  pw.Positioned.fill(
                    child: pw.Center(
                      child: pw.Transform.rotate(
                        angle: -0.35,
                        child: pw.Opacity(
                          opacity: 0.04,
                          child: pw.Text(
                            'VIOS-ROYAL-8899\nKHÂM THIÊN BẢO MẬT',
                            textAlign: pw.TextAlign.center,
                            style: pw.TextStyle(
                              fontSize: 34,
                              fontWeight: pw.FontWeight.bold,
                              color: royalGold,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),

                  // Nội dung từng trang
                  pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.start,
                    children: [
                      // Header
                      _buildHeader(page),
                      pw.SizedBox(height: 16),
                      pw.Divider(color: royalGold, thickness: 1),
                      pw.SizedBox(height: 16),

                      // Tiêu đề trang
                      pw.Text(
                        page.title,
                        style: pw.TextStyle(
                          fontSize: 20,
                          fontWeight: pw.FontWeight.bold,
                          color: royalGold,
                        ),
                      ),
                      if (page.subTitle != null) ...[
                        pw.SizedBox(height: 4),
                        pw.Text(
                          page.subTitle!,
                          style: const pw.TextStyle(
                            fontSize: 12,
                            color: textSecondary,
                          ),
                        ),
                      ],
                      pw.SizedBox(height: 16),

                      // Khối Drop Cap & Nội dung
                      pw.Expanded(
                        child: pw.Column(
                          crossAxisAlignment: pw.CrossAxisAlignment.start,
                          children: [
                            pw.Text(
                              page.content,
                              style: const pw.TextStyle(
                                fontSize: 11,
                                height: 1.6,
                                color: textGold,
                              ),
                              textAlign: pw.TextAlign.justify,
                            ),
                            pw.SizedBox(height: 16),

                            // Bảng Key Attributes
                            if (page.keyAttributes != null && page.keyAttributes!.isNotEmpty)
                              _buildAttributesTable(page.keyAttributes!),

                            pw.Spacer(),

                            // Nếu là trang 19: Vẽ Dấu Triện Son Đỏ Khâm Thiên Giám Ngự Bút
                            if (page.pageNumber == 19)
                              _buildImperialRedSeal(),
                          ],
                        ),
                      ),

                      // Footer
                      pw.SizedBox(height: 12),
                      pw.Divider(color: parchmentBorder, thickness: 0.5),
                      pw.SizedBox(height: 8),
                      _buildFooter(page, dossier.totalPages),
                    ],
                  ),
                ],
              ),
            );
          },
        ),
      );
    }

    return pdf.save();
  }

  static pw.Widget _buildHeader(DossierPageData page) {
    return pw.Row(
      mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
      children: [
        pw.Text(
          'KHÂM THIÊN GIÁM · ĐẠI VIỆT HOÀNG TRIỀU',
          style: pw.TextStyle(
            fontSize: 9,
            fontWeight: pw.FontWeight.bold,
            color: royalGold,
            letterSpacing: 1.5,
          ),
        ),
        pw.Text(
          page.category.toUpperCase(),
          style: const pw.TextStyle(
            fontSize: 9,
            color: textSecondary,
          ),
        ),
      ],
    );
  }

  static pw.Widget _buildAttributesTable(Map<String, String> attributes) {
    return pw.Container(
      decoration: pw.BoxDecoration(
        border: pw.Border.all(color: royalGold, width: 0.8),
        borderRadius: pw.BorderRadius.circular(4),
      ),
      padding: const pw.EdgeInsets.all(10),
      child: pw.Column(
        crossAxisAlignment: pw.CrossAxisAlignment.start,
        children: attributes.entries.map((entry) {
          return pw.Padding(
            padding: const pw.EdgeInsets.symmetric(vertical: 2.5),
            child: pw.Row(
              children: [
                pw.SizedBox(
                  width: 120,
                  child: pw.Text(
                    entry.key,
                    style: pw.TextStyle(
                      fontSize: 10,
                      fontWeight: pw.FontWeight.bold,
                      color: royalGold,
                    ),
                  ),
                ),
                pw.Expanded(
                  child: pw.Text(
                    entry.value,
                    style: const pw.TextStyle(
                      fontSize: 10,
                      color: textGold,
                    ),
                  ),
                ),
              ],
            ),
          );
        }).toList(),
      ),
    );
  }

  static pw.Widget _buildImperialRedSeal() {
    return pw.Align(
      alignment: pw.Alignment.centerRight,
      child: pw.Container(
        width: 120,
        height: 120,
        decoration: pw.BoxDecoration(
          border: pw.Border.all(color: royalCrimson, width: 3),
          borderRadius: pw.BorderRadius.circular(8),
        ),
        padding: const pw.EdgeInsets.all(8),
        child: pw.Column(
          mainAxisAlignment: pw.MainAxisAlignment.center,
          children: [
            pw.Text(
              'KHÂM THIÊN',
              style: pw.TextStyle(
                color: royalCrimson,
                fontSize: 13,
                fontWeight: pw.FontWeight.bold,
                letterSpacing: 2,
              ),
            ),
            pw.SizedBox(height: 4),
            pw.Text(
              'GIÁM',
              style: pw.TextStyle(
                color: royalCrimson,
                fontSize: 13,
                fontWeight: pw.FontWeight.bold,
                letterSpacing: 2,
              ),
            ),
            pw.SizedBox(height: 4),
            pw.Text(
              'NGỰ BÚT',
              style: pw.TextStyle(
                color: royalCrimson,
                fontSize: 11,
                fontWeight: pw.FontWeight.bold,
                letterSpacing: 2,
              ),
            ),
          ],
        ),
      ),
    );
  }

  static pw.Widget _buildFooter(DossierPageData page, int totalPages) {
    return pw.Row(
      mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
      children: [
        pw.Text(
          'VIOS ROYAL IMPERIAL DOSSIER · BÍ TRUYỀN',
          style: const pw.TextStyle(fontSize: 8, color: textSecondary),
        ),
        pw.Text(
          'Trang ${page.pageNumber} / $totalPages',
          style: pw.TextStyle(
            fontSize: 8,
            fontWeight: pw.FontWeight.bold,
            color: royalGold,
          ),
        ),
      ],
    );
  }

  /// Chia sẻ hoặc In ấn trực tiếp trên thiết bị di động
  static Future<void> exportAndShare(BuildContext context, RoyalDossierData dossier) async {
    try {
      final pdfBytes = await generatePdf(dossier);
      await Printing.sharePdf(
        bytes: pdfBytes,
        filename: 'Ho_So_Menh_Ly_Hoang_Gia_19_Trang_${DateTime.now().millisecondsSinceEpoch}.pdf',
      );
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Lỗi xuất bản PDF: $e'),
            backgroundColor: Colors.redAccent,
          ),
        );
      }
    }
  }
}
