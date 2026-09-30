-- =============================================================================
-- WashFlow M3b: indeks untuk papan pesanan, dasbor, dan ringkasan harian
-- =============================================================================
create index if not exists payments_paid_at_idx on public.payments (paid_at);
create index if not exists orders_completed_at_idx on public.orders (completed_at) where completed_at is not null;
create index if not exists orders_active_due_idx on public.orders (branch_id, due_at) where status <> 'completed';
