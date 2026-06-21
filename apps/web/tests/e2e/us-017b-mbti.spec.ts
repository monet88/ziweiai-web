import { test, expect } from '@playwright/test';
import { signInViaUi } from './sign-in';

// US-017b (live): luồng MBTI end-to-end. Cờ EXTENDED_SYSTEM_MBTI_ENABLED bật ở playwright
// webServer env. Trả lời TOÀN BỘ câu ở mức trung lập (nút "Trung lập" = Likert 4) → mọi trục
// hòa điểm → scoring deterministic ra ESTJ (cực đầu mỗi trục), chứng minh đường
// /quizzes/mbti chạy thật qua UI. Selector bám nhãn/role tiếng Việt (KHÔNG class CSS).

test('US-017b: làm trắc nghiệm MBTI qua UI → ra kết quả ESTJ (toàn bộ trung lập)', async ({
  page,
}) => {
  await signInViaUi(page);

  await page.goto('/mbti');
  await expect(page.getByRole('heading', { name: 'Trắc nghiệm tính cách MBTI' })).toBeVisible();

  const neutral = page.getByRole('button', { name: 'Trung lập', exact: true });
  const nextButton = page.getByRole('button', { name: 'Câu tiếp theo', exact: true });
  const submitButton = page.getByRole('button', { name: 'Xem kết quả', exact: true });

  // Trả lời lần lượt: chọn trung lập rồi sang câu kế; ở câu cuối nút đổi thành "Xem kết quả".
  // Vòng lặp có trần an toàn (200) để không treo nếu UI đổi ngoài dự kiến.
  for (let step = 0; step < 200; step += 1) {
    await neutral.click();
    if (await submitButton.isVisible()) {
      await submitButton.click();
      break;
    }
    await nextButton.click();
  }

  // Kết quả: tiêu đề + kiểu tính cách ESTJ (toàn bộ trung lập → cực đầu mỗi trục).
  await expect(page.getByText('Kiểu tính cách của bạn', { exact: true })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('ESTJ', { exact: true })).toBeVisible();
});
