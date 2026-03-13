create table if not exists coach_reviews (
  id uuid primary key default gen_random_uuid(),
  player_profile_id uuid references player_profiles(id) on delete cascade not null,
  reviewer_name text not null,
  reviewer_title text,
  rating integer check (rating between 1 and 5),
  review_text text,
  categories jsonb, -- { technical: 4, tactical: 3, physical: 5, mental: 4 }
  created_at timestamptz default now()
);
alter table coach_reviews enable row level security;
create policy "Public read coach reviews" on coach_reviews for select using (true);
create policy "Authenticated insert" on coach_reviews for insert with check (auth.uid() is not null);
