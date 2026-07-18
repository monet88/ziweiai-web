import type { VisionKind } from '@ziweiai/contracts';

/**
 * US-017e/f: prompt người dùng (promptOverride) cho luận giải vision Xem Tướng / Xem Tay.
 *
 * Port phần CỐT LÕI prompt từ .ref/taibu/src/lib/divination/{face,palm}.ts nhưng viết hoàn toàn bằng
 * tiếng Việt (bất biến 0 chữ Hán — system prompt EXPLANATION_SYSTEM_PROMPT đã ép tiếng Việt + chốt
 * giọng + mục "## Tóm lại"; CJK guard ở provider từ chối nếu lọt chữ Hán). Chỉ port luận giải, KHÔNG
 * port annual-report/share/history nâng cao (Non-Goals E17).
 *
 * Lưu ý đạo đức (giữ từ taibu): không chẩn đoán y tế, không phán xét ngoại hình, giọng tham khảo -
 * tích cực. Đường vision đặt persona + nhiệm vụ vào user prompt; ảnh đính kèm qua imageInput.
 */

const FACE_PERSONA = [
  'Bạn là chuyên gia nhân tướng học, đọc nét mặt theo tướng pháp phương Đông truyền thống.',
  'Phân tích dựa trên đặc điểm khuôn mặt thấy được trong ảnh; diễn giải tính cách và vận thế một cách gợi mở.',
  'Nguyên tắc: KHÔNG chẩn đoán bệnh tật hay sức khỏe; KHÔNG bình phẩm đẹp/xấu; tôn trọng người trong ảnh.',
  'Nếu thấy thuận lợi hay bất lợi đều nêu kèm gợi ý cải thiện tích cực; nhấn mạnh "tướng tùy tâm sinh".',
].join(' ');

const PALM_PERSONA = [
  'Bạn là chuyên gia xem chỉ tay, kết hợp thủ tướng học phương Đông và phương Tây.',
  'Phân tích dựa trên các đường chỉ tay và gò bàn tay thấy được trong ảnh; diễn giải một cách gợi mở.',
  'Nguyên tắc: KHÔNG chẩn đoán bệnh tật; giọng tham khảo - tích cực; chỉ tay thay đổi theo thời gian, phản ánh trạng thái hiện tại.',
].join(' ');

const FACE_STRUCTURE = [
  'Hãy phân tích theo cấu trúc sau, mỗi mục một đoạn ngắn dễ hiểu:',
  '1. Ấn tượng tổng thể.',
  '2. Tam đình:',
  '   - Thượng đình (từ chân tóc tới lông mày) ứng với vận thời trẻ và trí tuệ: trán rộng đầy gợi sớm có thành tựu, được người trên nâng đỡ; trán hẹp lõm gợi giai đoạn đầu nhiều thử thách, phải tự lập.',
  '   - Trung đình (từ lông mày tới chóp mũi) ứng với vận trung niên và ý chí: sống mũi và chóp mũi đầy đặn gợi ý chí vững, sự nghiệp và tài chính trung niên ổn; vùng này phẳng lép gợi cần thêm quý nhân hỗ trợ.',
  '   - Hạ đình (từ chóp mũi tới cằm) ứng với vận về sau và quan hệ với người dưới: cằm tròn đầy, địa các vuông vắn gợi hậu vận an nhàn, có chốn nương tựa; cằm nhọn vát gợi về sau vất vả hơn.',
  '3. Ngũ quan (đọc theo nét thấy được, gắn với ý nghĩa đời sống):',
  '   - Lông mày (tình anh em, bạn bè): mày thanh dài đều gợi tình nghĩa bền, làm việc có trước có sau; mày thưa rối gợi nên chủ động giữ các mối quan hệ.',
  '   - Mắt (thần thái, trí tuệ): mắt sáng, lòng đen lòng trắng phân minh gợi tinh anh, phân biệt phải trái rõ; mắt thiếu thần gợi nên giữ gìn sức tập trung.',
  '   - Mũi (ý chí, tài lộc): sống mũi thẳng, chóp mũi có thịt, cánh mũi đầy gợi giữ tiền có chừng mực, chính tài ổn định.',
  '   - Miệng (giao tiếp, tình cảm): môi tươi cân đối, khóe miệng hơi hếch gợi lạc quan, ăn nói được lòng người; môi quá mỏng gợi nên ý tứ lời nói.',
  '   - Tai (tiếp thu, phúc khí): tai dày dặn, vành rõ, dái tai đầy gợi tính cẩn trọng và phúc khí; tai mỏng nhỏ gợi nên dưỡng sức và tích phúc.',
  '4. Thần khí - sắc diện: nét hồng hào tươi sáng gợi trạng thái đang lên; nét xám tối, thiếu sức sống chỉ là dấu hiệu cần nghỉ ngơi, KHÔNG suy diễn thành bệnh tật.',
  '5. Luận về tính cách và xu hướng vận thế (sự nghiệp, tình cảm, tài lộc) ở mức gợi mở, dựa trên các nét đã quan sát.',
  '6. Gợi ý điều chỉnh tích cực; nhấn mạnh "tướng tùy tâm sinh" - nét tướng đổi theo tâm tính và lối sống.',
].join('\n');

const PALM_STRUCTURE = [
  'Hãy phân tích theo cấu trúc sau, mỗi mục một đoạn ngắn dễ hiểu:',
  '1. Ấn tượng tổng thể và dáng tay: tay vuông gợi tư duy mạch lạc, làm việc có kế hoạch; tay tròn mềm gợi giàu cảm xúc, khéo giao tiếp; tay thuôn dài nhiều đốt gợi thiên về suy tư, sáng tạo; tay dày chắc gợi thực tế, hành động.',
  '2. Ba đường chính (đọc theo nét thấy được, gắn ý nghĩa đời sống):',
  '   - đường sinh đạo (vòng quanh gốc ngón cái): nói về sức sống và thể trạng. Sâu rõ gợi thể lực sung; mờ hoặc đứt đoạn chỉ gợi nên chú ý nghỉ ngơi, KHÔNG kết luận bệnh tật.',
  '   - đường trí đạo (vắt ngang lòng bàn tay): nói về cách tư duy. Dài và thẳng gợi lý trí, phân tích tốt; dài và cong gợi trực giác, giàu sáng tạo; ngắn gợi thiên về thực dụng.',
  '   - đường tâm đạo (phía trên, hướng về ngón trỏ): nói về tình cảm. Bằng và rõ gợi tình cảm ổn định; cong lên gợi nồng nhiệt chủ động; nhiều nhánh gợi đời sống tình cảm phong phú nhưng phức tạp.',
  '3. Đường phụ thấy được: đường vận mệnh (từ cổ tay lên ngón giữa) gợi hướng đi sự nghiệp; đường thành công (dưới ngón áp út) gợi tài năng được ghi nhận; đường hôn nhân (cạnh dưới ngón út) gợi nhịp tình cảm.',
  '4. Hình ngón và gò bàn tay: ngón cái mạnh gợi ý chí và khả năng dẫn dắt; gò Kim tinh (gốc ngón cái) đầy gợi sức sống và sự nồng ấm; gò Mộc tinh (gốc ngón trỏ) đầy gợi tự tin, có chí tiến thủ; gò Thái âm/Nguyệt (mép ngoài lòng tay) đầy gợi giàu tưởng tượng và trực giác.',
  '5. Luận về tính cách và xu hướng vận thế (sức khỏe tổng quát ở mức gợi mở, sự nghiệp, tình cảm), dựa trên các nét đã quan sát.',
  '6. Gợi ý điều chỉnh tích cực; nhắc rằng chỉ tay thay đổi theo thời gian, phản ánh trạng thái hiện tại chứ không định đoạt số phận.',
].join('\n');

/** Dựng user prompt cho luận giải vision theo loại (face/palm) + câu hỏi tuỳ chọn của người dùng. */
export function buildVisionUserPrompt(kind: VisionKind, question?: string): string {
  const persona = kind === 'face' ? FACE_PERSONA : PALM_PERSONA;
  const structure = kind === 'face' ? FACE_STRUCTURE : PALM_STRUCTURE;
  const subject = kind === 'face' ? 'khuôn mặt' : 'lòng bàn tay';

  const trimmedQuestion = question?.trim();

  // Có câu hỏi: ĐẶT câu hỏi làm trọng tâm ngay đầu prompt + chỉ thị bám sát, để model không trả lời
  // theo khuôn 6 mục cứng rồi bỏ qua điều người dùng thật sự muốn biết (bug: hỏi "tình duyên" nhưng
  // chỉ nhận luận giải tổng quát). Các mục cấu trúc lúc này là BẰNG CHỨNG quan sát để trả lời câu hỏi,
  // không phải bản tường thuật độc lập; chốt bằng một đoạn trả lời thẳng câu hỏi.
  if (trimmedQuestion) {
    return [
      persona,
      '',
      `Người dùng gửi ảnh ${subject} kèm câu hỏi cụ thể, và điều họ muốn biết nhất là:`,
      `"${trimmedQuestion}"`,
      '',
      `Nhiệm vụ chính của bạn là TRẢ LỜI trực tiếp câu hỏi này dựa trên những gì quan sát được trên ${subject} trong ảnh.`,
      'Hãy soi kỹ các nét tướng LIÊN QUAN tới câu hỏi và diễn giải chúng để phục vụ câu trả lời; có thể tham chiếu các nét khác làm bối cảnh, nhưng đừng sa đà liệt kê đầy đủ mọi bộ phận một cách máy móc.',
      '',
      'Tham khảo khung quan sát sau để rút ra dẫn chứng (KHÔNG cần trình bày tuần tự hết các mục nếu không liên quan tới câu hỏi):',
      structure,
      '',
      `Cuối bài, viết một đoạn "## Trả lời câu hỏi của bạn" đúc kết trực tiếp cho câu hỏi "${trimmedQuestion}", kèm gợi ý tích cực.`,
      '',
      'Nếu ảnh không đủ rõ hoặc góc chụp không phù hợp để trả lời câu hỏi, hãy nói rõ cần tấm ảnh như thế nào thay vì suy đoán.',
    ].join('\n');
  }

  // Không có câu hỏi: luận giải tổng quát theo khung cấu trúc đầy đủ (luồng cũ).
  return [
    persona,
    '',
    `Hãy phân tích tấm ảnh ${subject} được đính kèm.`,
    structure,
    '',
    'Nếu ảnh không đủ rõ hoặc góc chụp không phù hợp, hãy nói rõ cần tấm ảnh như thế nào thay vì suy đoán.',
  ].join('\n');
}
