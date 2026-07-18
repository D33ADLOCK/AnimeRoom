import { ensureSignupGrant } from "~/server/credits/creditHelper";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const creditRouter = createTRPCRouter({
  getBalance: protectedProcedure.query(async ({ ctx }) => {
    // Safety net: grant the signup bonus if the Clerk webhook never landed it.
    await ensureSignupGrant(ctx.userId);

    const balance = await ctx.db.query.userCreditAccountTable.findFirst({
      where: (t, { eq }) => eq(t.userId, ctx.userId),
      columns: { balanceCredits: true },
    });

    if (!balance) return 0;

    return balance.balanceCredits;
  }),
});
