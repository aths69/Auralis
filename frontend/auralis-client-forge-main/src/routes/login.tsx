import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Logo } from "@/components/auralis/Logo";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in · Auralis" },
      { name: "description", content: "Sign in to Auralis to share what you're building." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [show, setShow] = useState(false);
  const [pending, setPending] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setErr("Enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setErr("Password is too short.");
      return;
    }
    setPending(true);
    try {
      await login(email, password);
      if (!remember) sessionStorage.setItem("auralis_session_only", "1");
      toast.success("Welcome back");
      await router.invalidate();
      navigate({ to: "/feed" });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Couldn't sign in.");
    } finally {
      setPending(false);
    }
  };

  return (
    <AuthShell>
      <div className="mb-8">
        <h1 className="text-[28px] font-semibold leading-tight tracking-tight text-foreground">
          Welcome back.
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Sign in to continue to Auralis.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-5">
        <Field label="Email" htmlFor="email">
          <Input
            id="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@domain.com"
            required
          />
        </Field>

        <Field
          label="Password"
          htmlFor="password"
          right={
            <Link
              to="/login"
              className="text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              Forgot?
            </Link>
          }
        >
          <div className="relative">
            <Input
              id="password"
              type={show ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              required
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              aria-label={show ? "Hide password" : "Show password"}
              className="absolute inset-y-0 right-2 my-auto flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-surface-2 hover:text-foreground"
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>

        <label className="flex select-none items-center gap-2 text-sm text-muted-foreground">
          <Checkbox
            checked={remember}
            onCheckedChange={(v) => setRemember(v === true)}
            className="border-border"
          />
          Keep me signed in
        </label>

        {err ? (
          <p
            role="alert"
            className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
          >
            {err}
          </p>
        ) : null}

        <Button
          type="submit"
          disabled={pending}
          className="h-11 w-full rounded-full bg-foreground text-background hover:bg-foreground/90"
        >
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        New to Auralis?{" "}
        <Link to="/signup" className="font-medium text-foreground hover:underline underline-offset-4">
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-svh grid-cols-1 bg-background lg:grid-cols-2">
      <div className="flex flex-col px-6 py-8 sm:px-10 md:px-14">
        <Link to="/login" className="text-foreground">
          <Logo />
        </Link>
        <div className="mx-auto my-auto w-full max-w-[400px] py-12">{children}</div>
        <p className="mt-auto text-center text-[11px] text-muted-foreground">
          © {new Date().getFullYear()} Auralis
        </p>
      </div>
      <aside className="relative hidden overflow-hidden border-l border-border/70 bg-surface-2 lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,oklch(0.96_0.01_80)_0%,oklch(0.93_0.012_80)_100%)]" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <div className="space-y-6">
            <p className="a-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              Auralis · Builder Network
            </p>
            <h2 className="text-[34px] font-semibold leading-[1.1] tracking-tight text-foreground">
              A quieter place to share<br />what you're building.
            </h2>
            <p className="max-w-md text-[15px] leading-relaxed text-muted-foreground">
              No algorithmic noise. No influencer theater. Just engineers,
              designers, and indie founders posting honest work-in-progress.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Tile label="Today" value="Shipped JWT auth" />
            <Tile label="Now" value="API v2 in review" />
            <Tile label="Note" value="Looking for feedback" />
            <Tile label="Repo" value="auralis/web · main" mono />
          </div>
        </div>
      </aside>
    </div>
  );
}

function Tile({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-surface/80 p-4 shadow-soft backdrop-blur-sm">
      <p className="a-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className={`mt-1.5 text-sm text-foreground ${mono ? "a-mono" : "font-medium"}`}>
        {value}
      </p>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  right,
  children,
}: {
  label: string;
  htmlFor: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label htmlFor={htmlFor} className="text-xs font-medium text-foreground">
          {label}
        </Label>
        {right}
      </div>
      {children}
    </div>
  );
}
