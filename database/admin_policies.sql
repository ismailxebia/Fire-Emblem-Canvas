-- =================================================
-- Studio Admin Policies (apply ONLY to dev / staging Supabase)
-- =================================================
-- The default schema only has "public read" policies. The Maker Studio
-- (/studio in the app) needs INSERT/UPDATE/DELETE access on game data.
--
-- TWO OPTIONS — pick whichever fits your workflow:
--
--   Option A: Open writes for anonymous (DEV ONLY — never production!)
--   Option B: Restrict writes to authenticated admin users
--
-- =================================================

-- =================================================
-- OPTION A — DEV ONLY: anyone with anon key can write
-- =================================================
-- Use this only in your local / personal dev project.
-- DO NOT apply to a production Supabase that real users connect to.

-- Skills
CREATE POLICY "DEV anon write skills" ON skills FOR ALL TO anon USING (true) WITH CHECK (true);
-- Units
CREATE POLICY "DEV anon write units" ON units FOR ALL TO anon USING (true) WITH CHECK (true);
-- Stages
CREATE POLICY "DEV anon write stages" ON stages FOR ALL TO anon USING (true) WITH CHECK (true);
-- Stage hero positions
CREATE POLICY "DEV anon write hero_positions" ON stage_hero_positions FOR ALL TO anon USING (true) WITH CHECK (true);
-- Stage enemy spawns
CREATE POLICY "DEV anon write enemy_spawns" ON stage_enemy_spawns FOR ALL TO anon USING (true) WITH CHECK (true);
-- Stage obstacles
CREATE POLICY "DEV anon write obstacles" ON stage_obstacles FOR ALL TO anon USING (true) WITH CHECK (true);


-- =================================================
-- OPTION B — restrict to admin (recommended for staging/prod)
-- =================================================
-- Requires (1) a Supabase Auth user that is an admin, and
--          (2) the studio to be opened while signed in as that user.
-- The studio app currently does NOT include a login flow, so use
-- Option A for now and switch to Option B once you add Supabase Auth.
--
-- Pre-req: create a profiles table or use auth.users.raw_user_meta_data:
--
--   CREATE TABLE IF NOT EXISTS public.admins (user_id UUID PRIMARY KEY);
--
-- Then grant write access to that admin set:
--
--   CREATE POLICY "Admin write skills" ON skills FOR ALL
--       USING ( auth.uid() IN (SELECT user_id FROM public.admins) )
--       WITH CHECK ( auth.uid() IN (SELECT user_id FROM public.admins) );
--   -- repeat for units, stages, stage_hero_positions, stage_enemy_spawns, stage_obstacles


-- =================================================
-- ROLLBACK (drop the dev policies)
-- =================================================
-- DROP POLICY IF EXISTS "DEV anon write skills" ON skills;
-- DROP POLICY IF EXISTS "DEV anon write units" ON units;
-- DROP POLICY IF EXISTS "DEV anon write stages" ON stages;
-- DROP POLICY IF EXISTS "DEV anon write hero_positions" ON stage_hero_positions;
-- DROP POLICY IF EXISTS "DEV anon write enemy_spawns" ON stage_enemy_spawns;
-- DROP POLICY IF EXISTS "DEV anon write obstacles" ON stage_obstacles;
