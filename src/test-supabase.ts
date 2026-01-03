// Quick test script for Supabase connection (Node.js compatible)
import { createClient } from '@supabase/supabase-js';

// Direct config for testing (don't use in production)
const supabaseUrl = 'https://krunwsckkjtnvpmxgzzt.supabase.co';
const supabaseAnonKey = 'sb_publishable_Ceds0NV6OEBgOZ7GMBJ5cg_bB2_OvdH';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSupabaseConnection() {
    console.log('🔄 Testing Supabase connection...\n');

    // Test 1: Fetch heroes
    console.log('1. Fetching heroes...');
    const { data: heroes, error: heroError } = await supabase
        .from('units')
        .select('*')
        .eq('unit_type', 'hero');

    if (heroError) {
        console.log('   ❌ Error:', heroError.message);
    } else {
        console.log(`   ✅ Found ${heroes?.length || 0} heroes:`, heroes?.map(h => h.name));
    }

    // Test 2: Fetch enemies
    console.log('\n2. Fetching enemies...');
    const { data: enemies, error: enemyError } = await supabase
        .from('units')
        .select('*')
        .eq('unit_type', 'enemy');

    if (enemyError) {
        console.log('   ❌ Error:', enemyError.message);
    } else {
        console.log(`   ✅ Found ${enemies?.length || 0} enemies:`, enemies?.map(e => e.name));
    }

    // Test 3: Fetch stages
    console.log('\n3. Fetching stages...');
    const { data: stages, error: stageError } = await supabase
        .from('stages')
        .select('*');

    if (stageError) {
        console.log('   ❌ Error:', stageError.message);
    } else {
        console.log(`   ✅ Found ${stages?.length || 0} stages:`, stages?.map(s => s.name));
    }

    // Test 4: Fetch stage with relations
    console.log('\n4. Fetching stage01 positions...');
    const { data: heroPositions } = await supabase
        .from('stage_hero_positions')
        .select('*')
        .eq('stage_id', 'stage01');

    const { data: enemySpawns } = await supabase
        .from('stage_enemy_spawns')
        .select('*, units(*)')
        .eq('stage_id', 'stage01');

    console.log(`   📍 Hero positions: ${heroPositions?.length || 0}`);
    console.log(`   👹 Enemy spawns: ${enemySpawns?.length || 0}`);

    console.log('\n✨ Supabase connection test complete!');
}

// Run test
testSupabaseConnection().catch(console.error);
