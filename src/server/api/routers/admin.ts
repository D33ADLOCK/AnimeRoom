import z from "zod";
import { adminProcedure, createTRPCRouter } from "../trpc";
import { userCreditAccountTable } from "~/server/db/schema";
import { desc, lt } from "drizzle-orm";
import { grantCredits } from "~/server/credits/creditHelper";
import { randomUUID } from "crypto";
import { TRPCError } from "@trpc/server";

export const adminRouter = createTRPCRouter({
  getAllUsers: adminProcedure
    .input(
      z.object({
        limit: z.number(),
        cursor: z.string().datetime().nullish(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const users = await ctx.db
        .select()
        .from(userCreditAccountTable)
        .where(
          input.cursor
            ? lt(userCreditAccountTable.createdAt, new Date(input.cursor))
            : undefined,
        )
        .orderBy(desc(userCreditAccountTable.createdAt))
        .limit(input.limit + 1);

      if (users.length === 0) return { users: [], cursor: null };

      const hasNextPage = users.length === input.limit + 1;
      const items = users.slice(0, input.limit);
      const nextCursor = hasNextPage
        ? items[items.length - 1]!.createdAt?.toISOString()
        : null;

      return { users: items, cursor: nextCursor };
    }),

  addCredits: adminProcedure
    .input(z.object({ userId: z.string(), amount: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const added = await ctx.db.transaction(async (tx) => {
        return await grantCredits({
          tx,
          userId: input.userId,
          amount: input.amount,
          eventType: "manual_adjustment",
          metaData: { note: "Credits added manually" },
          sourceId: randomUUID(),
          sourceType: "admin",
          transactionId: randomUUID(),
        });
      });

      if (!added)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to add credits",
        });

      return added;
    }),
});
