-- ==============================================================================
-- Migration 000044: Add balance_after and metadata to xu_transactions
-- Đảm bảo bảng xu_transactions có đầy đủ các cột sổ cái (ledger columns)
-- phục vụ RPC daily_checkin, claim_welcome_bonus và hệ thống kiểm toán tài chính.
-- ==============================================================================

ALTER TABLE public.xu_transactions 
ADD COLUMN IF NOT EXISTS balance_after integer,
ADD COLUMN IF NOT EXISTS metadata jsonb;
