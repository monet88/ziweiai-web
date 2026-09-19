-- Migration: 000022_user_fcm_tokens.sql
-- Description: Add fcm_token and device_platform columns to profiles table

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS fcm_token text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS device_platform text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS fcm_updated_at timestamptz;
