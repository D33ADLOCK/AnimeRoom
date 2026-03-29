import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import AdminPanel from "./_components/AdminPanel";
import AdminNavbar from "./_components/AdminNavbar";

export default async function AdminPage() {
  const { userId } = await auth();

  if (userId !== process.env.ADMIN_USER) {
    redirect("/");
  }

  return (
    <div className="min-h-screen">
      <AdminNavbar />
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-8 border-b-[3px] border-[var(--color-nb-border)] pb-4">
          <h1 className="text-3xl font-extrabold uppercase tracking-tight">
            Admin Panel
          </h1>
          <p className="mt-1 text-sm font-semibold text-[var(--color-nb-text)]/60">
            Manage users and credits
          </p>
        </div>
        <AdminPanel />
      </div>
    </div>
  );
}
