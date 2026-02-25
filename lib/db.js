const { createClient } = require('@supabase/supabase-js');

let supabase = null;

function getDb() {
    if (!supabase) {
        supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_KEY
        );
    }
    return supabase;
}

module.exports = { getDb };
