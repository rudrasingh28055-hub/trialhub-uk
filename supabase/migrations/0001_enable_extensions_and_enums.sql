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
