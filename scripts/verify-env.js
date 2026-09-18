const fs = require('fs');
const path = '.env';
const text = fs.existsSync(path) ? fs.readFileSync(path, 'utf8') : '';
const keys = ['DATABASE_URL', 'DATABASE_DIRECT_URL', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];

const result = {
  exists: fs.existsSync(path),
  keys: keys.map((key) => {
    const match = text.match(new RegExp(`^${key}=(.*)$`, 'm'));
    const value = match ? match[1].trim() : '';
    return {
      key,
      present: Boolean(match),
      nonEmpty: Boolean(value),
    };
  }),
};

console.log(JSON.stringify(result, null, 2));
