import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ===========================================
// Game Data Fetching Functions
// ===========================================

/**
 * Fetch all skills
 */
export async function fetchSkills() {
    const { data, error } = await supabase
        .from('skills')
        .select('*');

    if (error) {
        console.error('Error fetching skills:', error);
        return [];
    }
    return data;
}

/**
 * Fetch all hero units (master data)
 */
export async function fetchHeroes() {
    const { data, error } = await supabase
        .from('units')
        .select('*')
        .eq('unit_type', 'hero');

    if (error) {
        console.error('Error fetching heroes:', error);
        return [];
    }
    return data;
}

/**
 * Fetch all enemy units (master data)
 */
export async function fetchEnemies() {
    const { data, error } = await supabase
        .from('units')
        .select('*')
        .eq('unit_type', 'enemy');

    if (error) {
        console.error('Error fetching enemies:', error);
        return [];
    }
    return data;
}

/**
 * Fetch a stage with all related data
 */
export async function fetchStage(stageId: string) {
    // Fetch stage info
    const { data: stage, error: stageError } = await supabase
        .from('stages')
        .select('*')
        .eq('id', stageId)
        .single();

    if (stageError) {
        console.error('Error fetching stage:', stageError);
        return null;
    }

    // Fetch hero positions for this stage
    const { data: heroPositions } = await supabase
        .from('stage_hero_positions')
        .select('*')
        .eq('stage_id', stageId)
        .order('slot_index');

    // Fetch enemy spawns with unit info
    const { data: enemySpawns } = await supabase
        .from('stage_enemy_spawns')
        .select(`
      *,
      units (*)
    `)
        .eq('stage_id', stageId);

    // Fetch obstacles
    const { data: obstacles } = await supabase
        .from('stage_obstacles')
        .select('*')
        .eq('stage_id', stageId);

    return {
        ...stage,
        heroPositions: heroPositions || [],
        enemySpawns: enemySpawns || [],
        obstacles: obstacles || []
    };
}

/**
 * Fetch all published stages
 */
export async function fetchAllStages() {
    const { data, error } = await supabase
        .from('stages')
        .select('*')
        .eq('is_published', true)
        .order('chapter')
        .order('stage_order');

    if (error) {
        console.error('Error fetching stages:', error);
        return [];
    }
    return data;
}

// ===========================================
// Player Data Functions
// ===========================================

/**
 * Get player's unit collection
 */
export async function fetchPlayerUnits(playerId: string) {
    const { data, error } = await supabase
        .from('player_units')
        .select(`
      *,
      units (
        name,
        unit_type,
        sprite_url,
        portrait_url,
        magic_skill_id
      )
    `)
        .eq('player_id', playerId);

    if (error) {
        console.error('Error fetching player units:', error);
        return [];
    }
    return data;
}

/**
 * Get player's stage progress
 */
export async function fetchPlayerProgress(playerId: string) {
    const { data, error } = await supabase
        .from('player_progress')
        .select(`
      *,
      stages (
        name,
        chapter,
        stage_order,
        difficulty
      )
    `)
        .eq('player_id', playerId);

    if (error) {
        console.error('Error fetching player progress:', error);
        return [];
    }
    return data;
}

/**
 * Save/Update player progress for a stage
 */
export async function savePlayerProgress(
    playerId: string,
    stageId: string,
    progress: {
        is_completed?: boolean;
        star_rating?: number;
        best_turns?: number;
    }
) {
    const now = new Date().toISOString();

    const { data, error } = await supabase
        .from('player_progress')
        .upsert({
            player_id: playerId,
            stage_id: stageId,
            ...progress,
            last_played_at: now,
            first_cleared_at: progress.is_completed ? now : undefined,
            times_played: 1 // Will need to increment properly
        }, {
            onConflict: 'player_id,stage_id'
        })
        .select()
        .single();

    if (error) {
        console.error('Error saving progress:', error);
        return null;
    }
    return data;
}

/**
 * Add a unit to player's collection
 */
export async function addPlayerUnit(
    playerId: string,
    unitId: string,
    initialStats?: {
        current_hp?: number;
        current_atk?: number;
        current_spd?: number;
        current_def?: number;
        current_res?: number;
    }
) {
    const { data, error } = await supabase
        .from('player_units')
        .insert({
            player_id: playerId,
            unit_id: unitId,
            current_level: 1,
            current_exp: 0,
            ...initialStats
        })
        .select()
        .single();

    if (error) {
        console.error('Error adding player unit:', error);
        return null;
    }
    return data;
}

/**
 * Update player unit stats (level up)
 */
export async function updatePlayerUnit(
    playerId: string,
    unitId: string,
    updates: {
        current_level?: number;
        current_exp?: number;
        current_hp?: number;
        current_atk?: number;
        current_spd?: number;
        current_def?: number;
        current_res?: number;
    }
) {
    const { data, error } = await supabase
        .from('player_units')
        .update(updates)
        .eq('player_id', playerId)
        .eq('unit_id', unitId)
        .select()
        .single();

    if (error) {
        console.error('Error updating player unit:', error);
        return null;
    }
    return data;
}
