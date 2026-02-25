import { SignIn } from "@clerk/nextjs";
import React from "react";

export default function Login() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignIn forceRedirectUrl={"create"} />
    </div>
  );
}
