import { auth } from "@clerk/nextjs/server";
import { db } from "~/server/db";

const INTERVAL_TIMER = 3000;

export async function GET(
  req: Request,
  ctx: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await ctx.params;

  console.log(jobId);
  const { userId } = await auth();

  if (!userId) return new Response("Unauthorized", { status: 401 });

  const job = await db.query.jobsTable.findFirst({
    where: (t, { and, eq }) => and(eq(t.id, jobId), eq(t.userId, userId)),
    columns: { id: true },
  });

  if (!job) return new Response("Not found", { status: 404 });

  const encoder = new TextEncoder();
  const { signal } = req;
  let lastStatus: string | null = null;

  //   let lastUpdatedAt: string | null = null;
  const stream = new ReadableStream({
    start(controller) {
      const interval = setInterval(async () => {
        try {
          const current = await db.query.jobsTable.findFirst({
            where: (t, { eq }) => eq(t.id, jobId),
            columns: { id: true, jobStatus: true },
          });

          if (!current) {
            clearInterval(interval);
            controller.close();
            return;
          }

          let status = current.jobStatus;
          console.log("sse: ", status);

          if (status !== lastStatus) {
            lastStatus = status;

            const message = `data: ${JSON.stringify(status)}\n\n`;

            controller.enqueue(encoder.encode(message));
          }

          if (status === "complete" || status === "failed") {
            controller.close();
            clearInterval(interval);
          }
        } catch {
          controller.close();
          clearInterval(interval);
        }
      }, INTERVAL_TIMER);

      signal.addEventListener("abort", () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
