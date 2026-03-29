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
  amount,
  eventType,
  sourceType,
  metaData,
}: {
  tx: DbOrTransaction;
  transactionId: string;
  userId: string;
  sourceId: string;
  amount: number;
  eventType: TransactionType;
  sourceType: SourceType;
  metaData: TransactionMetadataType;
}) {
  if (amount <= 0) throw new Error("Amount must be positive");

  const [check] = await tx
    .select({ id: creditTransactionsTable.id })
    .from(creditTransactionsTable)
    .where(eq(creditTransactionsTable.sourceId, sourceId));

  if (check) return { success: true };

  const [balance] = await tx
    .insert(userCreditAccountTable)
    .values({
      userId: userId,
      balanceCredits: amount,
      lifetimeGrantedCredits: amount,
      lifetimeSpentCredits: 0,
    })
    .onConflictDoUpdate({
      target: userCreditAccountTable.userId,
      set: {
        balanceCredits: sql`${userCreditAccountTable.balanceCredits}+ ${amount}`,
        lifetimeGrantedCredits: sql`${userCreditAccountTable.lifetimeGrantedCredits}+${amount}`,
      },
    })
    .returning({
      currentBalance: userCreditAccountTable.balanceCredits,
    });

  if (!balance) throw new Error("Failed to update balance");

  const updateTransaction = await tx.insert(creditTransactionsTable).values({
    id: transactionId,
    userId: userId,
    type: eventType,
    creditsDelta: amount,
    sourceType: sourceType,
    balanceAfter: balance.currentBalance,
    sourceId: sourceId,
    metaData: metaData,
  });
}

export async function spendCredtis({
  tx,
  transactionId,
  userId,
  sourceId,
  amount,
  sourceType,
  metaData,
}: {
  tx: DbOrTransaction;
  transactionId: string;
  userId: string;
  sourceId: string;
  amount: number;
  sourceType: SourceType;
  metaData: TransactionMetadataType;
}) {
  if (amount <= 0) throw new Error("Amount must be positive");

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

  if (account.balanceCredits < amount) throw new Error("Insufficient credits");

  const [updated] = await tx
    .update(userCreditAccountTable)
    .set({
      balanceCredits: sql`${userCreditAccountTable.balanceCredits}-${amount}`,
      lifetimeSpentCredits: sql`${userCreditAccountTable.lifetimeSpentCredits} + ${amount}`,
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
    creditsDelta: -amount,
    userId,
    id: transactionId,
  });
}
