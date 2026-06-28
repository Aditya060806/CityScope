-- ============================================================================
-- PRAD live bridge hardening
-- Goal: mobile app writes -> Supabase -> website listens and charts update live
-- ============================================================================

-- Add metadata needed for source-aware realtime charts.
alter table public.road_anomalies
  add column if not exists source text,
  add column if not exists device_id text,
  add column if not exists intensity double precision;

update public.road_anomalies
set source = 'web'
where source is null;

alter table public.road_anomalies
  alter column source set default 'web';

alter table public.road_anomalies
  alter column source set not null;

-- Keep source values explicit and bounded.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'road_anomalies_source_check'
      and conrelid = 'public.road_anomalies'::regclass
  ) then
    alter table public.road_anomalies
      add constraint road_anomalies_source_check
      check (source in ('app', 'web', 'manual'));
  end if;
end $$;

-- Indexes to accelerate graph bootstrap and filtered live views.
create index if not exists idx_road_anomalies_source_created_at
  on public.road_anomalies(source, created_at desc);

create index if not exists idx_road_anomalies_reporter_created_at
  on public.road_anomalies(reporter_id, created_at desc);

create index if not exists idx_road_anomalies_trip_created_at
  on public.road_anomalies(trip_id, created_at desc);

create index if not exists idx_road_anomalies_device_id
  on public.road_anomalies(device_id)
  where device_id is not null;

-- Ensure all PRAD bridge tables are published to Supabase realtime.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'road_anomalies'
  ) then
    alter publication supabase_realtime add table public.road_anomalies;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'anomaly_clusters'
  ) then
    alter publication supabase_realtime add table public.anomaly_clusters;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'trips'
  ) then
    alter publication supabase_realtime add table public.trips;
  end if;
exception
  when undefined_object then
    raise notice 'Publication supabase_realtime not found; skipping realtime publication updates.';
end $$;
