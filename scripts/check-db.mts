import "dotenv/config";
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL!);

for (const name of ["jobs", "upload_sessions", "users_assets"]) {
  const cols = await sql`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = ${name}
    ORDER BY ordinal_position;
  `;
  console.log(`\n${name}:`);
  cols.forEach((c: any) => console.log(`  ${c.column_name}: ${c.data_type}`));
}

await sql.end();
