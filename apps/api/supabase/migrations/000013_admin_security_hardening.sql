-- Migration: Admin Security Hardening
-- Creates admin_roles, admin_audit_logs, system_configs tables

CREATE TYPE public.admin_role_enum AS ENUM ('SUPER_ADMIN', 'MODERATOR');

-- 1. admin_roles Table
CREATE TABLE public.admin_roles (
    email TEXT PRIMARY KEY,
    role public.admin_role_enum NOT NULL DEFAULT 'MODERATOR',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;
-- Only Super Admins can manage roles, but read can be by any admin for their own role, 
-- or we can use service_role to bypass RLS in the API. Since the API uses service_role,
-- we don't strictly need complex policies for now, just close it off to public.

-- 2. admin_audit_logs Table
CREATE TABLE public.admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_email TEXT NOT NULL,
    action TEXT NOT NULL,
    target_id TEXT,
    payload JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- 3. system_configs Table
CREATE TABLE public.system_configs (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_by TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.system_configs ENABLE ROW LEVEL SECURITY;

-- Insert initial rate limits config
INSERT INTO public.system_configs (key, value)
VALUES 
    ('RATE_LIMIT_ANON', '{"limit": 10, "ttl": 60}'::jsonb),
    ('RATE_LIMIT_AUTH', '{"limit": 60, "ttl": 60}'::jsonb);
