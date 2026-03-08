import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../src/server/db/schema.js";
import { randomUUID } from "crypto";

const conn = postgres(process.env.DATABASE_URL!);
const db = drizzle(conn, { schema });

const JOB_ID = "test-job-" + randomUUID().slice(0, 8);

// You MUST replace this with your actual Clerk userId.
// Find it by logging ctx.userId in any tRPC call, or from Clerk dashboard.
const USER_ID = "REPLACE_WITH_YOUR_CLERK_USER_ID";

async function seed() {
  if (USER_ID === "REPLACE_WITH_YOUR_CLERK_USER_ID") {
    console.error(
      "❌ Please replace USER_ID in this file with your actual Clerk user ID!",
    );
    console.log(
      "   Tip: check Clerk dashboard or log ctx.userId in a tRPC call.",
    );
    process.exit(1);
  }

  const [job] = await db
    .insert(schema.jobsTable)
    .values({
      id: JOB_ID,
      userId: USER_ID,
      prompt: "Test prompt for upload testing",
      jobStatus: "draft",
    })
    .returning({ id: schema.jobsTable.id });

  console.log(`✅ Created test job with ID: ${job!.id}`);
  console.log(`\n📋 Copy this into your testingUpload/page.tsx:`);
  console.log(`   const jobId = "${job!.id}";`);

  await conn.end();
}

seed().catch(console.error);
