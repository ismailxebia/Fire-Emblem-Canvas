// Type definitions matching database/schema.sql tables.

export type UnitType = 'hero' | 'enemy';
export type SkillType = 'magic' | 'physical' | 'buff' | 'debuff';
export type DamageType = 'physical' | 'magic' | 'true';
export type TargetType = 'single' | 'area' | 'line' | 'self';
export type Difficulty = 'easy' | 'normal' | 'hard' | 'nightmare';
export type AIType = 'aggressive' | 'defensive' | 'patrol';
export type ObstacleType = 'block' | 'water' | 'mountain' | 'forest';

export interface Skill {
    id: string;
    name: string;
    skill_type: SkillType;
    base_damage: number;
    damage_type: DamageType;
    effect_multiplier: number;
    target_type: TargetType;
    range: number;
    area_size: number;
    mp_cost: number;
    cooldown: number;
    icon_url: string | null;
    animation_id: string | null;
    description: string | null;
    created_at?: string;
}

export interface Unit {
    id: string;
    name: string;
    unit_type: UnitType;
    base_hp: number;
    base_atk: number;
    base_spd: number;
    base_def: number;
    base_res: number;
    attack_range: number;
    movement_range: number;
    level: number;
    star: number;
    sprite_url: string | null;
    portrait_url: string | null;
    magic_skill_id: string | null;
    created_at?: string;
    updated_at?: string;
}

export interface Stage {
    id: string;
    name: string;
    chapter: number;
    stage_order: number;
    background_url: string | null;
    max_heroes: number;
    difficulty: Difficulty;
    recommended_level: number;
    exp_reward: number;
    gold_reward: number;
    has_clouds: boolean;
    has_rain: boolean;
    has_snow: boolean;
    is_published: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface StageHeroPosition {
    id?: number;
    stage_id: string;
    slot_index: number;
    spawn_col: number;
    spawn_row: number;
}

export interface StageEnemySpawn {
    id?: number;
    stage_id: string;
    unit_id: string;
    spawn_col: number;
    spawn_row: number;
    level_override: number | null;
    hp_override: number | null;
    atk_override: number | null;
    ai_type: AIType;
}

export interface StageObstacle {
    id?: number;
    stage_id: string;
    col: number;
    row: number;
    obstacle_type: ObstacleType;
}

// Field descriptor for generic forms
export type FieldType =
    | 'text'
    | 'number'
    | 'textarea'
    | 'select'
    | 'boolean'
    | 'url';

export interface FieldDef {
    key: string;
    label: string;
    type: FieldType;
    required?: boolean;
    options?: Array<{ value: string | number; label: string }>;
    min?: number;
    max?: number;
    step?: number;
    placeholder?: string;
    help?: string;
    width?: 'full' | 'half' | 'third';
}
