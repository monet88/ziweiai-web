import type { FullConfig } from '@playwright/test';
import { provisionWorkerUsers } from './test-user';

// globalSetup chạy MỘT lần trước mọi test, sau khi webServer (api + web) đã sẵn sàng. Tiến trình
// này KHÔNG biết từng worker index, nên provision sẵn cả tập user theo số worker đã resolve
// (config.workers) + user dùng chung làm fallback. Mỗi worker sau đó tự chọn email của mình qua
// getTestUserForWorker() (backlog #21: tách user theo worker để tránh đụng quota/rate-limit).
export default async function globalSetup(config: FullConfig): Promise<void> {
  await provisionWorkerUsers(config.workers);
}
