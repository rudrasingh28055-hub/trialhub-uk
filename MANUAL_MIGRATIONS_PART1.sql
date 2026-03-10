-- Manual Migration Script for Sprint 1
-- Run these commands in your Supabase SQL Editor in order

-- 1. Enable extensions and create enums
create extension if not exists pgcrypto;
create extension if not exists citext;

do $$ begin
  create type app_role as enum ('athlete', 'club', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type account_status as enum ('active', 'pending_review', 'suspended', 'deleted');
exception when duplicate_object then null; end $$;

do $$ begin
  create type account_visibility as enum ('public', 'private');
exception when duplicate_object then null; end $$;

do $$ begin
  create type message_policy as enum ('open', 'requests', 'restricted');
exception when duplicate_object then null; end $$;

do $$ begin
  create type discoverability_policy as enum ('everyone', 'logged_in_only', 'limited');
exception when duplicate_object then null; end $$;

do $$ begin
  create type follow_status as enum ('pending', 'approved', 'rejected', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type verification_status as enum ('unverified', 'pending', 'verified', 'rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type trusted_status as enum ('none', 'basic', 'official_partner');
exception when duplicate_object then null; end $$;

-- 2. Create lookup tables
create table if not exists public.sports (
  code text primary key,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.countries (
  code text primary key,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.sports (code, name)
values ('football', 'Football')
on conflict (code) do nothing;

insert into public.countries (code, name)
values ('GB', 'United Kingdom')
on conflict (code) do nothing;
