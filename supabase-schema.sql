-- ============================================================
-- RFID Bus Payment System — Supabase Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- Users table
create table if not exists users (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  rfid_uid    text unique not null,
  balance     numeric(10,2) default 0,
  type        text default 'Passenger', -- 'Passenger' | 'Student'
  created_at  timestamptz default now()
);

-- Transactions table (RFID tap = deduction)
create table if not exists transactions (
  id            uuid primary key default gen_random_uuid(),
  rfid_uid      text not null,
  status        text not null,  -- 'APPROVED' | 'INSUFFICIENT' | 'NOT FOUND' | 'TOPUP'
  amount        numeric(10,2) default 0,
  balance_after numeric(10,2) default 0,
  created_at    timestamptz default now()
);

-- Payments table (GCash top-up via PayMongo)
create table if not exists payments (
  id           uuid primary key default gen_random_uuid(),
  rfid_uid     text not null,
  amount       numeric(10,2) not null,
  status       text default 'pending', -- 'pending' | 'paid' | 'failed'
  reference_no text,
  created_at   timestamptz default now()
);

-- Settings table (fare, etc.)
create table if not exists settings (
  id    int primary key default 1,
  fare  numeric(10,2) default 10
);

-- Seed default fare
insert into settings (id, fare) values (1, 10)
on conflict (id) do nothing;

-- Enable realtime (optional, for live dashboard)
alter publication supabase_realtime add table transactions;
alter publication supabase_realtime add table users;
