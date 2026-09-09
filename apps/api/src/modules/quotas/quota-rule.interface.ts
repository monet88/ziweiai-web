export interface QuotaRule {
  readonly featureKey: string;
  readonly dailyLimit: number;
  readonly dailyErrorMessage: string;

  /**
   * Hạn mức ngày riêng cho người dùng ẩn danh (Anonymous IP-based).
   * Nếu không cấu hình, sẽ dùng chung `dailyLimit`.
   */
  readonly anonDailyLimit?: number;

  /**
   * If provided, the engine will use this custom function to count daily usage for SIGNED-IN users.
   * If not provided, the engine defaults to using the generic `counterStore`.
   * Note: Anonymous users ALWAYS use the `counterStore` via IP.
   */
  countSignedInDailyUsage?: (userId: string) => Promise<number>;

  /** 
   * Optional custom limit per minute if different from default API_REQUESTS_PER_MINUTE.
   */
  ipMinuteLimit?: number;
  userMinuteLimit?: number;
}
