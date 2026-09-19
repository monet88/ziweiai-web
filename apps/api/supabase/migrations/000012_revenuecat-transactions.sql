-- Support for both SePay and RevenueCat transactions
alter table public.transactions alter column sepay_transaction_id drop not null;
alter table public.transactions add column if not exists revenuecat_transaction_id text unique;

-- A transaction must come from either SePay or RevenueCat, not neither, not both
alter table public.transactions add constraint transactions_payment_source_check
  check (
    (sepay_transaction_id is not null and revenuecat_transaction_id is null) or
    (sepay_transaction_id is null and revenuecat_transaction_id is not null)
  );
