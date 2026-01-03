// Game Data Loader - Fetches from Supabase with CACHING
import { supabase } from '../../lib/supabase';
import { Hero } from '../entities/hero.js';
import { Enemy } from '../entities/enemy.js';

// ====== CACHE SYSTEM ======
// Prevents duplicate API calls - data cached for session lifetime
interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

const cache: Map<string, CacheEntry<any>> = new Map();
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes cache

// Track ongoing requests to prevent duplicates
const pendingRequests: Map<string, Promise<any>> = new Map();

function getCached<T>(key: string): T | null {
    const entry = cache.get(key);
    if (entry && Date.now() - entry.timestamp < CACHE_DURATION_MS) {
        console.log(`[GameLoader] Cache HIT: ${key}`);
        return entry.data;
    }
    return null;
}

function setCache<T>(key: string, data: T): void {
    cache.set(key, { data, timestamp: Date.now() });
}

// Clear cache on demand (e.g., after data changes)
export function clearGameCache(): void {
    cache.clear();
    console.log('[GameLoader] Cache cleared');
}

export async function loadStageFromSupabase(stageId: string) {
    console.log(`[GameLoader] Loading stage: ${stageId}`);

    try {
        // Fetch stage info
        const { data: stage, error: stageError } = await supabase
            .from('stages')
            .select('*')
            .eq('id', stageId)
            .single();

        if (stageError) throw stageError;
        if (!stage) throw new Error(`Stage ${stageId} not found`);

        // Fetch hero positions for this stage
        const { data: heroPositions, error: hpError } = await supabase
            .from('stage_hero_positions')
            .select('*')
            .eq('stage_id', stageId)
            .order('slot_index');

        if (hpError) console.warn('[GameLoader] Hero positions error:', hpError);

        // Fetch enemy spawns with unit data
        const { data: enemySpawns, error: esError } = await supabase
            .from('stage_enemy_spawns')
            .select(`
        *,
        units (*)
      `)
            .eq('stage_id', stageId);

        if (esError) console.warn('[GameLoader] Enemy spawns error:', esError);

        // Fetch obstacles
        const { data: obstacles, error: obError } = await supabase
            .from('stage_obstacles')
            .select('*')
            .eq('stage_id', stageId);

        if (obError) console.warn('[GameLoader] Obstacles error:', obError);

        // Transform to game format
        const stageData = {
            id: stage.id,
            name: stage.name,
            battleName: stage.name,
            backgroundUrl: stage.background_url,
            maxHeroes: stage.max_heroes,
            difficulty: stage.difficulty,
            recommendedLevel: stage.recommended_level,
            expReward: stage.exp_reward,
            goldReward: stage.gold_reward,

            // Effects
            effects: {
                clouds: stage.has_clouds,
                rain: stage.has_rain,
                snow: stage.has_snow
            },

            // Positions - transform from DB format
            heroPositions: (heroPositions || []).map(hp => ({
                slotIndex: hp.slot_index,
                col: hp.spawn_col,
                row: hp.spawn_row
            })),

            // Enemy spawns with unit data
            enemySpawns: (enemySpawns || []).map(es => ({
                unitId: es.unit_id,
                col: es.spawn_col,
                row: es.spawn_row,
                aiType: es.ai_type,
                levelOverride: es.level_override,
                hpOverride: es.hp_override,
                atkOverride: es.atk_override,
                unit: es.units // Joined unit data
            })),

            // Obstacles
            obstacles: (obstacles || []).map(ob => ({
                col: ob.col,
                row: ob.row,
                type: ob.obstacle_type
            }))
        };

        console.log('[GameLoader] Stage loaded:', stageData.name);
        return stageData;

    } catch (error) {
        console.error('[GameLoader] Error loading stage:', error);
        return null;
    }
}

/**
 * Load heroes from Supabase (master data)
 * For battle, we'll use player's units if available, otherwise master data
 */
export async function loadHeroesFromSupabase(stageData: any, maxHeroes: number = 4) {
    console.log('[GameLoader] Loading heroes...');

    try {
        // Fetch hero units from master data
        const { data: heroUnits, error } = await supabase
            .from('units')
            .select('*')
            .eq('unit_type', 'hero')
            .limit(maxHeroes);

        if (error) throw error;
        if (!heroUnits || heroUnits.length === 0) {
            console.warn('[GameLoader] No heroes found');
            return [];
        }

        // Create Hero instances with positions from stageData
        const heroes = heroUnits.map((data, index) => {
            const position = stageData.heroPositions[index] || { col: 0, row: 0 };

            return new Hero(
                data.name,
                position.col,
                position.row,
                data.base_hp,
                data.base_atk,
                data.movement_range,
                data.sprite_url,
                data.portrait_url,
                data.level,
                data.star,
                data.base_spd,
                data.base_def,
                data.base_res,
                data.attack_range
            );
        });

        console.log(`[GameLoader] Loaded ${heroes.length} heroes`);
        return heroes;

    } catch (error) {
        console.error('[GameLoader] Error loading heroes:', error);
        return [];
    }
}

/**
 * Load enemies from stage spawn data
 */
export async function loadEnemiesFromSupabase(stageData: any) {
    console.log('[GameLoader] Loading enemies...');

    try {
        if (!stageData.enemySpawns || stageData.enemySpawns.length === 0) {
            console.warn('[GameLoader] No enemy spawns in stage data');
            return [];
        }

        // Create Enemy instances from spawn data
        const enemies = stageData.enemySpawns.map((spawn: any) => {
            const unit = spawn.unit;
            if (!unit) {
                console.warn('[GameLoader] Missing unit data for spawn:', spawn.unitId);
                return null;
            }

            // Apply overrides if present
            const hp = spawn.hpOverride || unit.base_hp;
            const atk = spawn.atkOverride || unit.base_atk;
            const level = spawn.levelOverride || unit.level;

            return new Enemy(
                unit.name,
                spawn.col,
                spawn.row,
                hp,
                atk,
                unit.sprite_url,
                unit.movement_range,
                unit.portrait_url,
                level,
                unit.star,
                unit.base_spd,
                unit.base_def,
                unit.base_res
            );
        }).filter(Boolean); // Remove nulls

        console.log(`[GameLoader] Loaded ${enemies.length} enemies`);
        return enemies;

    } catch (error) {
        console.error('[GameLoader] Error loading enemies:', error);
        return [];
    }
}

/**
 * Main loader function - loads complete battle data WITH CACHING
 */
export async function loadBattleData(stageId: string) {
    const cacheKey = `battle_${stageId}`;

    // Check cache first
    const cached = getCached<any>(cacheKey);
    if (cached) {
        console.log(`[GameLoader] Using cached battle data for: ${stageId}`);
        return cached;
    }

    // Check if there's already a request in progress for this stage
    if (pendingRequests.has(cacheKey)) {
        console.log(`[GameLoader] Waiting for existing request: ${stageId}`);
        return pendingRequests.get(cacheKey);
    }

    // Create the request promise
    const requestPromise = (async () => {
        console.log(`[GameLoader] Fetching NEW battle data for: ${stageId}`);

        // Load stage first
        const stageData = await loadStageFromSupabase(stageId);
        if (!stageData) {
            throw new Error(`Failed to load stage: ${stageId}`);
        }

        // Load heroes and enemies
        const [heroes, enemies] = await Promise.all([
            loadHeroesFromSupabase(stageData, stageData.maxHeroes),
            loadEnemiesFromSupabase(stageData)
        ]);

        const result = {
            stage: stageData,
            heroes,
            enemies
        };

        // Cache the result
        setCache(cacheKey, result);

        // Remove from pending
        pendingRequests.delete(cacheKey);

        return result;
    })();

    // Store in pending requests
    pendingRequests.set(cacheKey, requestPromise);

    return requestPromise;
}

/**
 * Fallback loader - uses local JSON if Supabase fails
 */
export async function loadBattleDataWithFallback(stageId: string) {
    try {
        return await loadBattleData(stageId);
    } catch (error) {
        console.warn('[GameLoader] Supabase failed, using local fallback:', error);

        // Import local data as fallback
        const { loadStageData } = await import('../stage/stage01.js');
        const { loadHeroData } = await import('./herodata.js');
        const { loadEnemyData } = await import('./enemydata.js');

        const stage = loadStageData();
        const heroes = await loadHeroData();
        const enemies = await loadEnemyData();

        return {
            stage: {
                ...stage,
                heroPositions: stage.heroPositions,
                obstacles: stage.obstacles
            },
            heroes,
            enemies
        };
    }
}
