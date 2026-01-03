// Game Factory - Creates game instance with Supabase data
// @ts-nocheck
import Game from './game.js';
import { loadBattleDataWithFallback } from './core/gameLoader';

/**
 * Create a new game instance with data loaded from Supabase
 * @param canvas - The canvas element
 * @param ctx - Canvas 2D context
 * @param stageId - Stage ID to load (default: 'stage01')
 */
export async function createGame(
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    stageId: string = 'stage01'
) {
    console.log('[GameFactory] Creating game for stage:', stageId);

    try {
        // Load all battle data from Supabase
        const battleData = await loadBattleDataWithFallback(stageId);

        const stageName = battleData.stage.battleName || battleData.stage.name || stageId;
        console.log('[GameFactory] Battle data loaded:', {
            stage: stageName,
            heroes: battleData.heroes.length,
            enemies: battleData.enemies.length
        });

        // Create game instance with loaded data
        const game = new Game(canvas, ctx, battleData);

        console.log('[GameFactory] Game created successfully');
        return game;

    } catch (error) {
        console.error('[GameFactory] Failed to create game:', error);
        throw error;
    }
}
