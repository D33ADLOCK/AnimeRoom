import { eq, sql } from "drizzle-orm";
import { db } from "../db";
import {
  creditTransactionsTable,
  userCreditAccountTable,
  type SourceType,
  type TransactionMetadataType,
  type TransactionType,
} from "../db/schema";

type DbOrTransaction =
  | typeof db
  | Parameters<Parameters<typeof db.transaction>[0]>[0];

export async function getBalance({ userId }: { userId: string }) {
  const result = await db.query.userCreditAccountTable.findFirst({
    where: (t, { eq }) => eq(t.userId, userId),
    columns: { balanceCredits: true, userId: true, createdAt: true },
  });

  if (!result) return { userId: userId, balanceCredits: 0 };

  return result;
}

export async function grantCredits({
  tx,
  transactionId,
  userId,
  sourceId,
  creditAmount,
  eventType,
  sourceType,
  metaData,
}: {
  tx: DbOrTransaction;
  transactionId: string;
  userId: string;
  sourceId: string;
  creditAmount: number;
  eventType: TransactionType;
  sourceType: SourceType;
  metaData: TransactionMetadataType;
}) {
  if (creditAmount <= 0) throw new Error("Amount must be positive");

  const [check] = await tx
    .select({ id: creditTransactionsTable.id })
    .from(creditTransactionsTable)
    .where(eq(creditTransactionsTable.sourceId, sourceId));

  if (check) return { success: true };

  const [balance] = await tx
    .insert(userCreditAccountTable)
    .values({
      userId: userId,
      balanceCredits: creditAmount,
      lifetimeGrantedCredits: creditAmount,
      lifetimeSpentCredits: 0,
    })
    .onConflictDoUpdate({
      target: userCreditAccountTable.userId,
      set: {
        balanceCredits: sql`${userCreditAccountTable.balanceCredits}+ ${creditAmount}`,
        lifetimeGrantedCredits: sql`${userCreditAccountTable.lifetimeGrantedCredits}+${creditAmount}`,
      },
    })
    .returning({
      currentBalance: userCreditAccountTable.balanceCredits,
    });

  if (!balance) throw new Error("Failed to update balance");

  const updateTransaction = await tx
    .insert(creditTransactionsTable)
    .values({
      id: transactionId,
      userId: userId,
      type: eventType,
      creditsDelta: creditAmount,
      sourceType: sourceType,
      balanceAfter: balance.currentBalance,
      sourceId: sourceId,
      metaData: metaData,
    })
    .returning({ id: creditTransactionsTable.id });

  if (!updateTransaction) throw new Error("Failed to update balance");

  return { success: true };
}

export async function spendCredtis({
  tx,
  transactionId,
  userId,
  sourceId,
  creditAmount,
  sourceType,
  metaData,
}: {
  tx: DbOrTransaction;
  transactionId: string;
  userId: string;
  sourceId: string;
  creditAmount: number;
  sourceType: SourceType;
  metaData: TransactionMetadataType;
}) {
  if (creditAmount <= 0) throw new Error("Amount must be positive");

  const verify = await tx.query.creditTransactionsTable.findFirst({
    where: (t, { eq }) => eq(t.sourceId, sourceId),
    columns: { id: true },
  });

  if (verify) return { success: true };

  const [account] = await tx
    .select()
    .from(userCreditAccountTable)
    .where(eq(userCreditAccountTable.userId, userId))
    .for("update");

  if (!account) throw new Error("No credit account found");

  if (account.balanceCredits < creditAmount)
    throw new Error("Insufficient credits");

  const [updated] = await tx
    .update(userCreditAccountTable)
    .set({
      balanceCredits: sql`${userCreditAccountTable.balanceCredits}-${creditAmount}`,
      lifetimeSpentCredits: sql`${userCreditAccountTable.lifetimeSpentCredits} + ${creditAmount}`,
    })
    .where(eq(userCreditAccountTable.userId, userId))
    .returning({ currentBalance: userCreditAccountTable.balanceCredits });

  if (!updated) throw new Error("Failed to update");

  await tx.insert(creditTransactionsTable).values({
    balanceAfter: updated.currentBalance,
    type: "job_debit",
    sourceType,
    sourceId,
    metaData,
    creditsDelta: -creditAmount,
    userId,
    id: transactionId,
  });
}
