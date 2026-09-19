-- Migration: 000029_sepay_live_reconcile_and_analytics.sql
-- Description: Allow nullable owner_user_id on transactions for manual reconciliation, add content column for transfer memo, and remove ambiguous RPC function overload.

-- 1. Allow owner_user_id to be NULL for unmatched transactions
ALTER TABLE public.transactions ALTER COLUMN owner_user_id DROP NOT NULL;

-- 2. Add content column to transactions for tracking raw bank transfer memo
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS content text;

-- 3. Drop obsolete function overload that causes candidate ambiguity in Supabase RPC
DROP FUNCTION IF EXISTS public.get_admin_analytics(integer);
