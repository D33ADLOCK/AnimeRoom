import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const creditRouter = createTRPCRouter({
  getBalance: protectedProcedure.query(async ({ ctx }) => {
    const balance = await ctx.db.query.userCreditAccountTable.findFirst({
      where: (t, { eq }) => eq(t.userId, ctx.userId),
      columns: { balanceCredits: true },
    });

    if (!balance) return 0;

    return balance.balanceCredits;
  }),
});
