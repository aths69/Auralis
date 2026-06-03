import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, AlertTriangle, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { AuthShell } from "./login";

type Status = "loading" | "success" | "failed" | "invalid";

export const Route = createFileRoute("/verify-email")({
  head: () => ({
    meta: [{ title: "Verify your email · Auralis" }],
  }),
  validateSearch: (s: Record<string, unknown>) => ({
    token: typeof s.token === "string" ? s.token : undefined,
  }),
  component: VerifyEmailPage,
});

function VerifyEmailPage() {
  const { token } = Route.useSearch();
  const [status, setStatus] = useState<Status>(token ? "loading" : "invalid");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      return;
    }
    let cancelled = false;
    api(`/verify-email?token=${encodeURIComponent(token)}`)
      .then(() => {
        if (!cancelled) setStatus("success");
      })
      .catch((e: Error) => {
        if (cancelled) return;
        const msg = e.message?.toLowerCase() ?? "";
        if (msg.includes("invalid") || msg.includes("expired") || msg.includes("token")) {
          setStatus("invalid");
        } else {
          setStatus("failed");
        }
        setMessage(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <AuthShell>
      <div className="text-center">
        {status === "loading" ? (
          <>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
            <h1 className="mt-5 text-2xl font-semibold tracking-tight text-foreground">
              Verifying your email…
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Hang tight. This usually takes a second.
            </p>
          </>
        ) : status === "success" ? (
          <>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-foreground text-background">
              <CheckCircle2 className="h-6 w-6" strokeWidth={1.75} />
            </div>
            <h1 className="mt-5 text-2xl font-semibold tracking-tight text-foreground">
              Email verified.
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Your account is ready. Sign in to start sharing.
            </p>
            <Link
              to="/login"
              className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-foreground px-5 text-sm font-medium text-background hover:bg-foreground/90"
            >
              Continue to sign in
            </Link>
          </>
        ) : status === "invalid" ? (
          <>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-2 text-foreground/70">
              <AlertTriangle className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <h1 className="mt-5 text-2xl font-semibold tracking-tight text-foreground">
              This link isn't valid.
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {message ??
                "Your verification link is missing or has expired. Request a new one from the sign-in page."}
            </p>
            <Link
              to="/signup"
              className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-foreground px-5 text-sm font-medium text-background hover:bg-foreground/90"
            >
              Back to sign up
            </Link>
          </>
        ) : (
          <>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <XCircle className="h-6 w-6" strokeWidth={1.75} />
            </div>
            <h1 className="mt-5 text-2xl font-semibold tracking-tight text-foreground">
              We couldn't verify your email.
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {message ?? "Something went wrong. Try the link again, or sign up once more."}
            </p>
            <Link
              to="/login"
              className="mt-6 inline-flex h-11 items-center justify-center rounded-full border border-border bg-surface px-5 text-sm font-medium text-foreground hover:bg-surface-2"
            >
              Back to sign in
            </Link>
          </>
        )}
      </div>
    </AuthShell>
  );
}
