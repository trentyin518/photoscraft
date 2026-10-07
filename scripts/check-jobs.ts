import 'dotenv/config';
import postgres from 'postgres';

async function main() {
  const sql = postgres(process.env.DATABASE_URL!, { prepare: false });
  const rows = await sql`
    SELECT id, tool, status, error, created_at
    FROM photo_job
    ORDER BY created_at DESC
    LIMIT 5
  `;
  console.log(JSON.stringify(rows, null, 2));
  await sql.end();
}

main();
