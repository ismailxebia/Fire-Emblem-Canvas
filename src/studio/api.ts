// CRUD operations for studio. Uses the same Supabase client as the game.
// Writes require RLS policies allowing the current user — see README_STUDIO.md.

import { supabase } from '../lib/supabase';
import type {
    Skill, Unit, Stage,
    StageHeroPosition, StageEnemySpawn, StageObstacle,
} from './types';

// === Generic CRUD helpers ===========================================

async function listAll<T>(table: string, orderBy?: string): Promise<T[]> {
    let query = supabase.from(table).select('*');
    if (orderBy) query = query.order(orderBy);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as T[];
}

async function upsertOne<T extends { id?: string | number }>(
    table: string,
    row: Partial<T>,
    onConflict?: string,
): Promise<T> {
    const { data, error } = await supabase
        .from(table)
        .upsert(row, onConflict ? { onConflict } : undefined)
        .select()
        .single();
    if (error) throw error;
    return data as T;
}

async function deleteOne(table: string, idColumn: string, id: string | number): Promise<void> {
    const { error } = await supabase.from(table).delete().eq(idColumn, id);
    if (error) throw error;
}

// === Skills =========================================================

export const skillsApi = {
    list: () => listAll<Skill>('skills', 'id'),
    save: (s: Partial<Skill>) => upsertOne<Skill>('skills', s),
    delete: (id: string) => deleteOne('skills', 'id', id),
};

// === Units ==========================================================

export const unitsApi = {
    list: () => listAll<Unit>('units', 'id'),
    save: (u: Partial<Unit>) => upsertOne<Unit>('units', u),
    delete: (id: string) => deleteOne('units', 'id', id),
};

// === Stages =========================================================

export const stagesApi = {
    list: () => listAll<Stage>('stages', 'chapter'),
    save: (s: Partial<Stage>) => upsertOne<Stage>('stages', s),
    delete: (id: string) => deleteOne('stages', 'id', id),
};

// === Stage sub-tables ===============================================

export const stageHeroPosApi = {
    listByStage: async (stageId: string): Promise<StageHeroPosition[]> => {
        const { data, error } = await supabase
            .from('stage_hero_positions')
            .select('*')
            .eq('stage_id', stageId)
            .order('slot_index');
        if (error) throw error;
        return (data ?? []) as StageHeroPosition[];
    },
    save: async (row: Partial<StageHeroPosition>): Promise<StageHeroPosition> => {
        // Use composite key for conflict resolution
        const { data, error } = await supabase
            .from('stage_hero_positions')
            .upsert(row, { onConflict: 'stage_id,slot_index' })
            .select()
            .single();
        if (error) throw error;
        return data as StageHeroPosition;
    },
    delete: (id: number) => deleteOne('stage_hero_positions', 'id', id),
};

export const stageEnemySpawnApi = {
    listByStage: async (stageId: string): Promise<(StageEnemySpawn & { units?: Unit })[]> => {
        const { data, error } = await supabase
            .from('stage_enemy_spawns')
            .select('*, units(*)')
            .eq('stage_id', stageId)
            .order('id');
        if (error) throw error;
        return (data ?? []) as (StageEnemySpawn & { units?: Unit })[];
    },
    save: async (row: Partial<StageEnemySpawn>): Promise<StageEnemySpawn> => {
        const { data, error } = await supabase
            .from('stage_enemy_spawns')
            .upsert(row)
            .select()
            .single();
        if (error) throw error;
        return data as StageEnemySpawn;
    },
    delete: (id: number) => deleteOne('stage_enemy_spawns', 'id', id),
};

export const stageObstacleApi = {
    listByStage: async (stageId: string): Promise<StageObstacle[]> => {
        const { data, error } = await supabase
            .from('stage_obstacles')
            .select('*')
            .eq('stage_id', stageId)
            .order('id');
        if (error) throw error;
        return (data ?? []) as StageObstacle[];
    },
    save: async (row: Partial<StageObstacle>): Promise<StageObstacle> => {
        const { data, error } = await supabase
            .from('stage_obstacles')
            .upsert(row, { onConflict: 'stage_id,col,row' })
            .select()
            .single();
        if (error) throw error;
        return data as StageObstacle;
    },
    delete: (id: number) => deleteOne('stage_obstacles', 'id', id),
};
