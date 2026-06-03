import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Camera, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth";
import { AuthShell } from "./login";
import { initials } from "@/lib/format";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create your account · Auralis" },
      { name: "description", content: "Join Auralis — a calm network for builders." },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  const { signup } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatar, setAvatar] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [bio, setBio] = useState("");
  const [show, setShow] = useState(false);
  const [pending, setPending] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const onFile = (f: File | null) => {
    setAvatar(f);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(f ? URL.createObjectURL(f) : null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!/^\S+@\S+\.\S+$/.test(email)) return setErr("Enter a valid email.");
    if (!/^[a-zA-Z0-9_]{3,24}$/.test(username))
      return setErr("Username must be 3–24 letters, numbers, or underscores.");
    if (password.length < 8) return setErr("Password must be at least 8 characters.");
    if (bio.length > 160) return setErr("Bio must be under 160 characters.");

    const form = new FormData();
    form.append("email", email);
    form.append("username", username);
    form.append("password", password);
    form.append("bio", bio);
    if (avatar) form.append("avatar", avatar);

    setPending(true);
    try {
      await signup(form);
      setDone(true);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Couldn't create account.");
    } finally {
      setPending(false);
    }
  };

  if (done) {
    return (
      <AuthShell>
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-foreground text-background">
            <CheckCircle2 className="h-6 w-6" strokeWidth={1.75} />
          </div>
          <h1 className="mt-5 text-2xl font-semibold tracking-tight text-foreground">
            Check your email
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            We sent a verification link to{" "}
            <span className="text-foreground">{email}</span>. Click the link to
            verify your account, then sign in.
          </p>
          <Link
            to="/login"
            className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-foreground px-5 text-sm font-medium text-background hover:bg-foreground/90"
          >
            Back to sign in
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <div className="mb-8">
        <h1 className="text-[28px] font-semibold leading-tight tracking-tight text-foreground">
          Create your account.
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Join the builders' network. Takes a minute.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-5">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="group relative h-16 w-16 overflow-hidden rounded-full border border-dashed border-border bg-surface-2 text-muted-foreground transition-colors hover:border-foreground/30 hover:bg-surface"
          >
            {preview ? (
              <img src={preview} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center">
                {username ? (
                  <span className="text-sm font-medium text-foreground/70">
                    {initials(username)}
                  </span>
                ) : (
                  <Camera className="h-5 w-5" strokeWidth={1.75} />
                )}
              </span>
            )}
            <span className="absolute inset-0 flex items-center justify-center bg-foreground/0 text-white opacity-0 transition group-hover:bg-foreground/30 group-hover:opacity-100">
              <Camera className="h-4 w-4" />
            </span>
          </button>
          <div>
            <p className="text-sm font-medium text-foreground">Profile picture</p>
            <p className="text-xs text-muted-foreground">Optional. PNG or JPG, up to 4MB.</p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0] ?? null)}
          />
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Username" htmlFor="username">
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              autoComplete="username"
              placeholder="yourhandle"
              required
            />
          </Field>
          <Field label="Email" htmlFor="email">
            <Input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@domain.com"
              required
            />
          </Field>
        </div>

        <Field label="Password" htmlFor="password">
          <div className="relative">
            <Input
              id="password"
              type={show ? "text" : "password"}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
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

        <Field label="Bio" htmlFor="bio" hint={`${bio.length}/160`}>
          <Textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Backend engineer. Building dev tools."
            maxLength={160}
            className="min-h-[88px] resize-none"
          />
        </Field>

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
          {pending ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-foreground hover:underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label htmlFor={htmlFor} className="text-xs font-medium text-foreground">
          {label}
        </Label>
        {hint ? (
          <span className="a-mono text-[10px] text-muted-foreground">{hint}</span>
        ) : null}
      </div>
      {children}
    </div>
  );
}
