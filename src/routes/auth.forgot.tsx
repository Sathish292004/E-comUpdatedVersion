import { createFileRoute, Link } from "@tanstack/react-router";
import { Mail, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/auth/forgot")({
  head: () => ({ meta: [{ title: "Reset password — SK" }] }),
  component: Forgot,
});

function Forgot() {
  const [sent, setSent] = useState(false);
  return (
    <>
      <Link to="/auth/login" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft className="h-3 w-3" />Back to sign in</Link>
      <h1 className="mt-3 text-3xl font-black">Reset password</h1>
      <p className="mt-1 text-sm text-muted-foreground">{sent ? "Check your inbox for a reset link." : "Enter your email and we'll send a reset link."}</p>
      {!sent && (
        <form onSubmit={(e) => { e.preventDefault(); setSent(true); toast.success("Reset link sent"); }} className="mt-6 space-y-3">
          <label className="relative block">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"><Mail className="h-4 w-4" /></span>
            <input type="email" required placeholder="Email address" className="w-full rounded-full border bg-background px-10 py-3 text-sm outline-none focus:border-indigo focus:ring-2 focus:ring-indigo/20" />
          </label>
          <button className="mt-2 w-full rounded-full bg-gradient-cta px-5 py-3 text-sm font-bold text-white shadow-glow">Send reset link</button>
        </form>
      )}
    </>
  );
}
