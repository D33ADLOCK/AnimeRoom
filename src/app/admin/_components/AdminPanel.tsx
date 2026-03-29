"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { Loader2, ChevronDown } from "lucide-react";

export default function AdminPanel() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    api.admin.getAllUsers.useInfiniteQuery(
      { limit: 20 },
      { getNextPageParam: (page) => page.cursor },
    );

  const users = data?.pages.flatMap((page) => page.users) ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 font-bold">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading users...
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="border-[3px] border-[var(--color-nb-border)] p-6 text-center font-bold">
        No users found.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Table Header */}
      <div className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 border-[3px] border-[var(--color-nb-border)] bg-[var(--color-nb-yellow)] px-4 py-2 text-xs font-extrabold tracking-wider uppercase">
        <span>User ID</span>
        <span>Balance</span>
        <span>Granted</span>
        <span>Spent</span>
        <span>Action</span>
      </div>

      {/* Rows */}
      {users.map((user) => (
        <UserRow key={user.userId} user={user} />
      ))}

      {/* Load More */}
      {hasNextPage && (
        <button
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
          className="mt-2 flex w-full items-center justify-center gap-2 border-[3px] border-[var(--color-nb-border)] py-3 font-extrabold uppercase shadow-[4px_4px_0px_var(--color-nb-shadow)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_var(--color-nb-shadow)] disabled:opacity-50"
        >
          {isFetchingNextPage ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
          Load More
        </button>
      )}
    </div>
  );
}

function UserRow({
  user,
}: {
  user: {
    userId: string;
    balanceCredits: number;
    lifetimeGrantedCredits: number;
    lifetimeSpentCredits: number;
  };
}) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const utils = api.useUtils();

  const { mutate: addCredits, isPending } = api.admin.addCredits.useMutation({
    onSuccess: () => {
      void utils.admin.getAllUsers.invalidate();
      setOpen(false);
      setAmount("");
    },
  });

  const handleAdd = () => {
    const parsed = parseInt(amount);
    if (!parsed || parsed <= 0) return;
    addCredits({ userId: user.userId, amount: parsed });
  };

  return (
    <div className="flex flex-col border-[3px] border-[var(--color-nb-border)] shadow-[3px_3px_0px_var(--color-nb-shadow)]">
      {/* Main row */}
      <div className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] items-center gap-4 px-4 py-3">
        <span className="font-mono text-sm font-semibold">
          {user.userId.length > 20
            ? `${user.userId.slice(0, 20)}…`
            : user.userId}
        </span>
        <span className="font-extrabold">{user.balanceCredits}</span>
        <span className="font-semibold text-[var(--color-nb-text)]/60">
          {user.lifetimeGrantedCredits}
        </span>
        <span className="font-semibold text-[var(--color-nb-text)]/60">
          {user.lifetimeSpentCredits}
        </span>
        <button
          onClick={() => setOpen((v) => !v)}
          className="border-[2px] border-[var(--color-nb-border)] bg-[var(--color-nb-mint)] px-3 py-1 text-xs font-extrabold uppercase shadow-[2px_2px_0px_var(--color-nb-shadow)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_var(--color-nb-shadow)]"
        >
          + Credits
        </button>
      </div>

      {/* Inline credit form */}
      {open && (
        <div className="flex items-center gap-2 border-t-[3px] border-[var(--color-nb-border)] bg-[var(--color-nb-bg)] px-4 py-3">
          <input
            type="number"
            min={1}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount"
            className="w-32 border-[2px] border-[var(--color-nb-border)] bg-white px-3 py-1.5 text-sm font-semibold focus:outline-none"
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            autoFocus
          />
          <button
            onClick={handleAdd}
            disabled={isPending || !amount}
            className="flex items-center gap-1 border-[2px] border-[var(--color-nb-border)] bg-[var(--color-nb-pink)] px-3 py-1.5 text-xs font-extrabold uppercase shadow-[2px_2px_0px_var(--color-nb-shadow)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_var(--color-nb-shadow)] disabled:opacity-50"
          >
            {isPending && <Loader2 className="h-3 w-3 animate-spin" />}
            Confirm
          </button>
          <button
            onClick={() => {
              setOpen(false);
              setAmount("");
            }}
            className="text-xs font-bold text-[var(--color-nb-text)]/50 hover:text-[var(--color-nb-text)]"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
