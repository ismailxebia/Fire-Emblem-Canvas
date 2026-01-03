-- =================================================
-- Fire Emblem Canvas - Seed Data (Supabase Ready)
-- =================================================
-- Data awal untuk testing dan development
-- Jalankan setelah schema.sql
-- =================================================

-- =================================================
-- SKILLS
-- =================================================
INSERT INTO skills (id, name, skill_type, base_damage, damage_type, target_type, range, description) VALUES
('fireball', 'Fireball', 'magic', 15, 'magic', 'single', 2, 'Melemparkan bola api ke musuh'),
('ice_shard', 'Ice Shard', 'magic', 12, 'magic', 'single', 3, 'Menembakkan pecahan es tajam'),
('lightning', 'Lightning', 'magic', 18, 'magic', 'single', 2, 'Menyambar musuh dengan petir'),
('heal', 'Heal', 'buff', 20, 'magic', 'single', 1, 'Memulihkan HP ally'),
('dark_slash', 'Dark Slash', 'physical', 10, 'physical', 'single', 1, 'Serangan fisik dengan elemen kegelapan'),
('shadow_bolt', 'Shadow Bolt', 'magic', 14, 'magic', 'single', 2, 'Proyektil bayangan'),
('poison_mist', 'Poison Mist', 'magic', 8, 'magic', 'area', 2, 'Kabut beracun yang meracuni musuh'),
('curse', 'Curse', 'debuff', 0, 'magic', 'single', 2, 'Mengutuk musuh, mengurangi DEF');

-- =================================================
-- HERO UNITS
-- =================================================
INSERT INTO units (id, name, unit_type, base_hp, base_atk, base_spd, base_def, base_res, attack_range, movement_range, level, star, sprite_url, portrait_url, magic_skill_id) VALUES
('hero1', 'Leonardo', 'hero', 100, 20, 10, 5, 3, 1, 3, 1, 3, 
    'https://ik.imagekit.io/ij05ikv7z/Hero/Orlandeau.png', 
    'https://ik.imagekit.io/ij05ikv7z/Hero/pot-orlandeau.png', 
    'fireball'),
('hero2', 'Da Vinci', 'hero', 90, 18, 12, 4, 3, 3, 2, 1, 1, 
    'https://ik.imagekit.io/ij05ikv7z/Hero/Idle%20(2).png', 
    'https://ik.imagekit.io/ij05ikv7z/Hero/pot-unit.png', 
    'ice_shard'),
('hero3', 'Artoria', 'hero', 120, 22, 8, 7, 4, 1, 2, 1, 4, 
    'https://ik.imagekit.io/ij05ikv7z/Hero/Orlandeau.png', 
    'https://ik.imagekit.io/ij05ikv7z/Hero/pot-orlandeau.png', 
    'lightning'),
('hero4', 'Merlin', 'hero', 80, 25, 9, 3, 8, 2, 2, 1, 5, 
    'https://ik.imagekit.io/ij05ikv7z/Hero/Idle%20(2).png', 
    'https://ik.imagekit.io/ij05ikv7z/Hero/pot-unit.png', 
    'heal');

-- =================================================
-- ENEMY UNITS
-- =================================================
INSERT INTO units (id, name, unit_type, base_hp, base_atk, base_spd, base_def, base_res, attack_range, movement_range, level, star, sprite_url, portrait_url, magic_skill_id) VALUES
('enemy1', 'Goblin Scout', 'enemy', 50, 15, 8, 5, 3, 1, 3, 1, 1, 
    'https://ik.imagekit.io/ij05ikv7z/Hero/Enemy%20(1).png', 
    'https://ik.imagekit.io/ij05ikv7z/Hero/pot-enemy.png', 
    'dark_slash'),
('enemy2', 'Goblin Warrior', 'enemy', 60, 18, 8, 6, 3, 1, 3, 1, 2, 
    'https://ik.imagekit.io/ij05ikv7z/Hero/Enemy%20(1).png', 
    'https://ik.imagekit.io/ij05ikv7z/Hero/pot-enemy.png', 
    'shadow_bolt'),
('enemy3', 'Goblin Archer', 'enemy', 40, 12, 10, 4, 2, 2, 2, 1, 1, 
    'https://ik.imagekit.io/ij05ikv7z/Hero/Enemy%20(1).png', 
    'https://ik.imagekit.io/ij05ikv7z/Hero/pot-enemy.png', 
    'poison_mist'),
('enemy4', 'Goblin Chief', 'enemy', 80, 20, 7, 8, 4, 1, 3, 1, 3, 
    'https://ik.imagekit.io/ij05ikv7z/Hero/Enemy%20(1).png', 
    'https://ik.imagekit.io/ij05ikv7z/Hero/pot-enemy.png', 
    'curse'),
('enemy5', 'Orc Brute', 'enemy', 100, 25, 5, 10, 2, 1, 2, 3, 2, 
    'https://ik.imagekit.io/ij05ikv7z/Hero/Enemy%20(1).png', 
    'https://ik.imagekit.io/ij05ikv7z/Hero/pot-enemy.png', 
    'dark_slash'),
('enemy6', 'Dark Mage', 'enemy', 45, 22, 9, 3, 7, 2, 2, 2, 2, 
    'https://ik.imagekit.io/ij05ikv7z/Hero/Enemy%20(1).png', 
    'https://ik.imagekit.io/ij05ikv7z/Hero/pot-enemy.png', 
    'shadow_bolt');

-- =================================================
-- STAGES (with max_heroes per stage)
-- =================================================
INSERT INTO stages (id, name, chapter, stage_order, background_url, max_heroes, difficulty, recommended_level, exp_reward, gold_reward, has_clouds, has_rain, is_published) VALUES
('stage01', 'Battle of Armageddon', 1, 1, 
    'https://ik.imagekit.io/ij05ikv7z/Hero/HD%20Back.png', 
    4, 'normal', 1, 100, 50, TRUE, FALSE, TRUE),
('stage02', 'Forest Ambush', 1, 2, 
    'https://ik.imagekit.io/ij05ikv7z/Hero/HD%20Back.png', 
    2, 'normal', 3, 150, 75, TRUE, TRUE, FALSE),    -- Hanya 2 hero!
('stage03', 'Castle Siege', 1, 3, 
    'https://ik.imagekit.io/ij05ikv7z/Hero/HD%20Back.png', 
    4, 'hard', 5, 250, 120, FALSE, FALSE, FALSE);

-- =================================================
-- STAGE 01 - Hero Spawn Positions
-- =================================================
INSERT INTO stage_hero_positions (stage_id, slot_index, spawn_col, spawn_row) VALUES
('stage01', 0, 2, 2),
('stage01', 1, 3, 2),
('stage01', 2, 2, 3),
('stage01', 3, 3, 3);

-- =================================================
-- STAGE 01 - Enemy Spawns
-- =================================================
INSERT INTO stage_enemy_spawns (stage_id, unit_id, spawn_col, spawn_row, ai_type) VALUES
('stage01', 'enemy1', 0, 8, 'aggressive'),
('stage01', 'enemy2', 1, 8, 'aggressive'),
('stage01', 'enemy3', 2, 9, 'aggressive'),
('stage01', 'enemy4', 3, 8, 'aggressive');

-- =================================================
-- STAGE 01 - Obstacles
-- =================================================
INSERT INTO stage_obstacles (stage_id, col, row, obstacle_type) VALUES
('stage01', 0, 1, 'water'),
('stage01', 0, 2, 'water'),
('stage01', 5, 1, 'mountain'),
('stage01', 5, 2, 'mountain'),
('stage01', 5, 3, 'mountain'),
('stage01', 4, 2, 'forest'),
('stage01', 4, 3, 'forest');

-- =================================================
-- STAGE 02 - Hero Spawn Positions
-- =================================================
INSERT INTO stage_hero_positions (stage_id, slot_index, spawn_col, spawn_row) VALUES
('stage02', 0, 1, 1),
('stage02', 1, 2, 1),
('stage02', 2, 1, 2),
('stage02', 3, 2, 2);

-- =================================================
-- STAGE 02 - Enemy Spawns
-- =================================================
INSERT INTO stage_enemy_spawns (stage_id, unit_id, spawn_col, spawn_row, ai_type) VALUES
('stage02', 'enemy3', 6, 4, 'aggressive'),
('stage02', 'enemy3', 7, 5, 'aggressive'),
('stage02', 'enemy5', 5, 8, 'defensive'),
('stage02', 'enemy6', 6, 8, 'aggressive');
