import { SignIn } from "@clerk/nextjs";
import React from "react";

export default function Login() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-nb-bg)]">
      <div className="nb-card p-2">
        <SignIn forceRedirectUrl={"/create"} />
      </div>
    </div>
  );
}
