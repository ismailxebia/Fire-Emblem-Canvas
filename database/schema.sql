-- =================================================
-- Fire Emblem Canvas - Database Schema (Supabase Ready)
-- =================================================
-- Database untuk menyimpan data game termasuk:
-- - Units (Heroes & Enemies)
-- - Stages (Battle Maps)
-- - Skills
-- - Player Progress (future)
-- =================================================
-- Note: Grid size (6 cols x 12 rows) dan tile_padding (8px)
-- adalah konstanta di code game (grid.js), bukan di database.
-- =================================================

-- =================================================
-- 1. SKILLS TABLE  
-- Daftar semua skill/magic yang bisa digunakan
-- =================================================
CREATE TABLE skills (
    id VARCHAR(50) PRIMARY KEY,               -- 'fireball', 'ice_shard'
    name VARCHAR(100) NOT NULL,               -- 'Fireball', 'Ice Shard'
    skill_type VARCHAR(30) NOT NULL,          -- 'magic', 'physical', 'buff', 'debuff'
    
    -- Damage & Effect
    base_damage INT DEFAULT 0,                -- Damage dasar (ditambah ATK user)
    damage_type VARCHAR(20) DEFAULT 'magic',  -- 'physical', 'magic', 'true'
    effect_multiplier DECIMAL(3,2) DEFAULT 1.0, -- Multiplier damage
    
    -- Targeting
    target_type VARCHAR(20) DEFAULT 'single', -- 'single', 'area', 'line', 'self'
    range INT DEFAULT 1,                      -- Jarak jangkauan skill
    area_size INT DEFAULT 0,                  -- Ukuran area jika AOE
    
    -- Cost & Cooldown
    mp_cost INT DEFAULT 0,                    -- Mana/SP cost
    cooldown INT DEFAULT 0,                   -- Turns cooldown
    
    -- Visual
    icon_url TEXT,                            -- URL icon skill
    animation_id VARCHAR(50),                 -- ID animasi di game
    
    -- Description
    description TEXT,                         -- Deskripsi skill
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =================================================
-- 2. UNITS TABLE
-- Master data untuk semua unit (hero & enemy)
-- =================================================
CREATE TABLE units (
    id VARCHAR(50) PRIMARY KEY,               -- 'hero1', 'enemy1', etc.
    name VARCHAR(100) NOT NULL,               -- 'Leonardo', 'Da Vinci'
    unit_type VARCHAR(20) NOT NULL,           -- 'hero' atau 'enemy'
    
    -- Stats Dasar
    base_hp INT NOT NULL DEFAULT 100,         -- Health Point
    base_atk INT NOT NULL DEFAULT 10,         -- Attack
    base_spd INT NOT NULL DEFAULT 5,          -- Speed
    base_def INT NOT NULL DEFAULT 5,          -- Defense
    base_res INT NOT NULL DEFAULT 3,          -- Resistance (magic defense)
    
    -- Range & Movement
    attack_range INT NOT NULL DEFAULT 1,      -- 1 = melee, 2-3 = ranged
    movement_range INT NOT NULL DEFAULT 3,    -- Jangkauan gerak (hexRange)
    
    -- Progression
    level INT NOT NULL DEFAULT 1,             -- Level saat ini
    star INT NOT NULL DEFAULT 1,              -- Rarity/Bintang (1-5)
    
    -- Visual Assets
    sprite_url TEXT,                          -- URL spritesheet
    portrait_url TEXT,                        -- URL portrait/avatar
    
    -- Skill Reference
    magic_skill_id VARCHAR(50) REFERENCES skills(id),
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index untuk query berdasarkan tipe
CREATE INDEX idx_units_type ON units(unit_type);

-- =================================================
-- 3. STAGES TABLE
-- Data untuk battle/level/map
-- =================================================
CREATE TABLE stages (
    id VARCHAR(50) PRIMARY KEY,               -- 'stage01', 'stage02'
    name VARCHAR(100) NOT NULL,               -- 'Battle of Armageddon'
    chapter INT DEFAULT 1,                    -- Chapter/World number
    stage_order INT DEFAULT 1,                -- Urutan dalam chapter
    
    -- Visual
    background_url TEXT,                      -- URL background image
    
    -- Stage Restrictions
    max_heroes INT DEFAULT 4,                 -- Maks hero di stage ini (1-4)
    
    -- Difficulty & Rewards
    difficulty VARCHAR(20) DEFAULT 'normal',  -- 'easy', 'normal', 'hard', 'nightmare'
    recommended_level INT DEFAULT 1,          -- Level rekomendasi
    exp_reward INT DEFAULT 100,               -- EXP yang didapat
    gold_reward INT DEFAULT 50,               -- Gold yang didapat
    
    -- Effects
    has_clouds BOOLEAN DEFAULT TRUE,          -- Efek awan
    has_rain BOOLEAN DEFAULT FALSE,           -- Efek hujan
    has_snow BOOLEAN DEFAULT FALSE,           -- Efek salju
    
    -- Status
    is_published BOOLEAN DEFAULT FALSE,       -- Apakah sudah release
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =================================================
-- 5. STAGE_HERO_POSITIONS TABLE
-- Posisi spawn hero di setiap stage
-- =================================================
CREATE TABLE stage_hero_positions (
    id BIGSERIAL PRIMARY KEY,                 -- Supabase uses BIGSERIAL
    stage_id VARCHAR(50) NOT NULL REFERENCES stages(id) ON DELETE CASCADE,
    slot_index INT NOT NULL,                  -- 0, 1, 2, 3 (max 4 heroes)
    spawn_col INT NOT NULL,                   -- Kolom spawn
    spawn_row INT NOT NULL,                   -- Baris spawn
    
    UNIQUE(stage_id, slot_index)
);

-- =================================================
-- 6. STAGE_ENEMY_SPAWNS TABLE
-- Posisi & konfigurasi spawn enemy di setiap stage
-- =================================================
CREATE TABLE stage_enemy_spawns (
    id BIGSERIAL PRIMARY KEY,
    stage_id VARCHAR(50) NOT NULL REFERENCES stages(id) ON DELETE CASCADE,
    unit_id VARCHAR(50) NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    spawn_col INT NOT NULL,                   -- Kolom spawn
    spawn_row INT NOT NULL,                   -- Baris spawn
    
    -- Override stats untuk stage ini (optional)
    level_override INT,                       -- Override level
    hp_override INT,                          -- Override HP
    atk_override INT,                         -- Override ATK
    
    -- AI Behavior
    ai_type VARCHAR(30) DEFAULT 'aggressive'  -- 'aggressive', 'defensive', 'patrol'
);

-- Index untuk query berdasarkan stage
CREATE INDEX idx_enemy_spawns_stage ON stage_enemy_spawns(stage_id);

-- =================================================
-- 7. STAGE_OBSTACLES TABLE
-- Posisi obstacle/collision tiles di stage
-- =================================================
CREATE TABLE stage_obstacles (
    id BIGSERIAL PRIMARY KEY,
    stage_id VARCHAR(50) NOT NULL REFERENCES stages(id) ON DELETE CASCADE,
    col INT NOT NULL,
    row INT NOT NULL,
    obstacle_type VARCHAR(30) DEFAULT 'block', -- 'block', 'water', 'mountain', 'forest'
    
    UNIQUE(stage_id, col, row)
);

-- Index
CREATE INDEX idx_obstacles_stage ON stage_obstacles(stage_id);

-- =================================================
-- 8. PLAYER_UNITS TABLE (Player's Collection)
-- Unit yang dimiliki player
-- =================================================
CREATE TABLE player_units (
    id BIGSERIAL PRIMARY KEY,
    player_id UUID NOT NULL,                  -- Supabase Auth user ID
    unit_id VARCHAR(50) NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    
    -- Instance-specific stats (leveling up modifies these)
    current_level INT DEFAULT 1,
    current_exp INT DEFAULT 0,
    current_hp INT,
    current_atk INT,
    current_spd INT,
    current_def INT,
    current_res INT,
    
    -- Equipment slots (future)
    weapon_id VARCHAR(50),
    armor_id VARCHAR(50),
    accessory_id VARCHAR(50),
    
    -- Status
    is_favorite BOOLEAN DEFAULT FALSE,
    acquired_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(player_id, unit_id)
);

-- Index for player queries
CREATE INDEX idx_player_units_player ON player_units(player_id);

-- =================================================
-- 9. PLAYER_PROGRESS TABLE (Save Game)
-- Progress player untuk setiap stage
-- =================================================
CREATE TABLE player_progress (
    id BIGSERIAL PRIMARY KEY,
    player_id UUID NOT NULL,                  -- Supabase Auth user ID
    stage_id VARCHAR(50) NOT NULL REFERENCES stages(id) ON DELETE CASCADE,
    
    -- Completion status
    is_completed BOOLEAN DEFAULT FALSE,
    star_rating INT DEFAULT 0,                -- 0-3 stars
    best_turns INT,                           -- Best clear in turns
    times_played INT DEFAULT 0,
    
    -- Timestamps
    first_cleared_at TIMESTAMP,
    last_played_at TIMESTAMP,
    
    UNIQUE(player_id, stage_id)
);

-- Index for player queries
CREATE INDEX idx_player_progress_player ON player_progress(player_id);

-- =================================================
-- ROW LEVEL SECURITY (RLS) untuk Supabase
-- =================================================

-- Enable RLS
ALTER TABLE player_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_progress ENABLE ROW LEVEL SECURITY;

-- Policy: Players can only see/modify their own data
CREATE POLICY "Users can view own units" ON player_units
    FOR SELECT USING (auth.uid() = player_id);

CREATE POLICY "Users can insert own units" ON player_units
    FOR INSERT WITH CHECK (auth.uid() = player_id);

CREATE POLICY "Users can update own units" ON player_units
    FOR UPDATE USING (auth.uid() = player_id);

CREATE POLICY "Users can view own progress" ON player_progress
    FOR SELECT USING (auth.uid() = player_id);

CREATE POLICY "Users can insert own progress" ON player_progress
    FOR INSERT WITH CHECK (auth.uid() = player_id);

CREATE POLICY "Users can update own progress" ON player_progress
    FOR UPDATE USING (auth.uid() = player_id);

-- Public tables (read-only for all)
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE stage_hero_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stage_enemy_spawns ENABLE ROW LEVEL SECURITY;
ALTER TABLE stage_obstacles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read skills" ON skills FOR SELECT USING (true);
CREATE POLICY "Public read units" ON units FOR SELECT USING (true);
CREATE POLICY "Public read stages" ON stages FOR SELECT USING (true);
CREATE POLICY "Public read hero_positions" ON stage_hero_positions FOR SELECT USING (true);
CREATE POLICY "Public read enemy_spawns" ON stage_enemy_spawns FOR SELECT USING (true);
CREATE POLICY "Public read obstacles" ON stage_obstacles FOR SELECT USING (true);

