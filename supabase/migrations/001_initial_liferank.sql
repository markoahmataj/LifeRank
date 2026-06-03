-- ════════════════════════════════════════════════════════════════════════
-- LifeRank — Initial schema (5 MVP tables + RLS)
-- Run in: Supabase Dashboard → SQL Editor → New query → paste → Run
-- Tables: profiles, life_state, checkins, mission_events, user_settings
-- Every table has RLS enabled; a user can only access their own rows.
-- ════════════════════════════════════════════════════════════════════════

-- Enable UUID extension (provides gen_random_uuid)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ────────────────────────────────────────────────────────────
-- PROFILES
-- ────────────────────────────────────────────────────────────
CREATE TABLE profiles (
  id            uuid        PRIMARY KEY DEFAULT auth.uid(),
  handle        text        NOT NULL,
  display_name  text        NOT NULL,
  provider_name text        NOT NULL,       -- 'google' | 'apple'
  avatar_url    text,
  joined_at     timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT profiles_handle_unique UNIQUE (handle)
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);
-- No DELETE policy — profiles are not deleted at the DB level for MVP.

-- ────────────────────────────────────────────────────────────
-- LIFE STATE (current snapshot — one row per user)
-- ────────────────────────────────────────────────────────────
CREATE TABLE life_state (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  is_calibrated    boolean     NOT NULL DEFAULT false,
  score            numeric(4,1) NOT NULL DEFAULT 0,
  delta            numeric(4,1) NOT NULL DEFAULT 0,
  tier             text        NOT NULL DEFAULT 'dormant',
  next_rank_at     numeric(4,1) NOT NULL DEFAULT 3.0,
  streak           integer     NOT NULL DEFAULT 0,
  pb_score         numeric(4,1),
  last_checkin     timestamptz,
  rp               integer     NOT NULL DEFAULT 0,
  categories       jsonb       NOT NULL DEFAULT '[]',
  build            jsonb,
  active_missions  jsonb       NOT NULL DEFAULT '[]',
  updated_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT life_state_user_unique UNIQUE (user_id)
);

CREATE INDEX life_state_user_idx ON life_state(user_id);
ALTER TABLE life_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "life_state_select_own" ON life_state FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "life_state_insert_own" ON life_state FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "life_state_update_own" ON life_state FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "life_state_delete_own" ON life_state FOR DELETE USING (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────
-- CHECKINS (daily log — maps to LogbookEntry[])
-- One row per user per day enforced by UNIQUE (user_id, date).
-- App must use upsert (ON CONFLICT DO UPDATE) not plain INSERT.
-- ────────────────────────────────────────────────────────────
CREATE TABLE checkins (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date                  date        NOT NULL,
  life_score            numeric(4,1) NOT NULL,
  delta                 numeric(4,1) NOT NULL DEFAULT 0,
  rank_tier             text        NOT NULL,
  streak_day            integer     NOT NULL,
  category_scores       jsonb       NOT NULL DEFAULT '[]',
  raw_ratings           jsonb,
  tags                  text[]      NOT NULL DEFAULT '{}',
  note                  text,
  completed_mission_ids text[]      NOT NULL DEFAULT '{}',
  rp_earned             integer     NOT NULL DEFAULT 0,
  created_at            timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT checkins_user_date_unique UNIQUE (user_id, date)
);

CREATE INDEX checkins_user_date_idx ON checkins(user_id, date DESC);
ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "checkins_select_own" ON checkins FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "checkins_insert_own" ON checkins FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "checkins_update_own" ON checkins FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "checkins_delete_own" ON checkins FOR DELETE USING (auth.uid() = user_id);
-- UPDATE policy is required so the daily upsert (ON CONFLICT DO UPDATE) works.

-- ────────────────────────────────────────────────────────────
-- MISSION EVENTS (append-only lifecycle log)
-- ────────────────────────────────────────────────────────────
CREATE TABLE mission_events (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  mission_id       text        NOT NULL,
  event_type       text        NOT NULL,  -- 'accepted'|'completed'|'failed'|'abandoned'
  mission_snapshot jsonb,
  rp_earned        integer     NOT NULL DEFAULT 0,
  score_impact     numeric(4,1) NOT NULL DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX mission_events_user_type_idx ON mission_events(user_id, event_type);
CREATE INDEX mission_events_user_time_idx ON mission_events(user_id, created_at DESC);
ALTER TABLE mission_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mission_events_select_own" ON mission_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "mission_events_insert_own" ON mission_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "mission_events_delete_own" ON mission_events FOR DELETE USING (auth.uid() = user_id);
-- No UPDATE policy — events are immutable.

-- ────────────────────────────────────────────────────────────
-- USER SETTINGS (privacy + notification preferences)
-- ────────────────────────────────────────────────────────────
CREATE TABLE user_settings (
  id                       uuid        PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  share_score_visible      boolean     NOT NULL DEFAULT true,
  share_categories_visible boolean     NOT NULL DEFAULT true,
  notif_mission_reminder   boolean     NOT NULL DEFAULT true,
  notif_streak_risk        boolean     NOT NULL DEFAULT true,
  notif_weekly_report      boolean     NOT NULL DEFAULT true,
  notif_rank_change        boolean     NOT NULL DEFAULT true,
  updated_at               timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_settings_select_own" ON user_settings FOR SELECT USING (auth.uid() = id);
CREATE POLICY "user_settings_insert_own" ON user_settings FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "user_settings_update_own" ON user_settings FOR UPDATE USING (auth.uid() = id);
