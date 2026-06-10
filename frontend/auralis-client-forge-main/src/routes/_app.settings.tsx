import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Camera, Eye, EyeOff, LogOut } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { UserAvatar } from "@/components/auralis/UserAvatar";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({ meta: [{ title: "Settings · Auralis" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user, refresh, logout } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  if (!user) {
    return <div className="py-10 text-sm text-muted-foreground">Loading…</div>;
  }

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["profile"] });
    qc.invalidateQueries({ queryKey: ["feed"] });
  };

  return (
    <div className="pb-12">
      <header className="sticky top-14 md:top-0 z-20 -mx-4 border-b border-border/70 bg-background/85 px-4 py-3 backdrop-blur-md md:-mx-8 md:px-8">
        <h1 className="text-lg font-semibold tracking-tight text-foreground">Settings</h1>
        <p className="text-xs text-muted-foreground">Manage your account.</p>
      </header>

      <div className="space-y-8 pt-6">
        <AvatarSection user={user} onDone={() => { refresh(); invalidate(); }} />
        <Separator />
        <UsernameSection
          initial={user.username}
          onDone={() => { refresh(); invalidate(); }}
        />
        <Separator />
        <BioSection
          initial={user.bio ?? ""}
          onDone={() => { refresh(); invalidate(); }}
        />
        <Separator />
        <PasswordSection />
        <Separator />
        <section>
          <h2 className="text-sm font-semibold text-foreground">Sign out</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            You'll need to sign in again to continue.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              logout();
              navigate({ to: "/login" });
            }}
            className="mt-3 h-9 rounded-full border-border text-sm"
          >
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </Button>
        </section>
      </div>
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      {description ? (
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      ) : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function AvatarSection({
  user,
  onDone,
}: {
  user: { username: string; avatar_url?: string | null };
  onDone: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);

  const upload = async (f: File) => {
    setPending(true);
    try {
      const form = new FormData();
      form.append("image", f);
      await api("/profile/picture", { method: "PATCH", form });
      toast.success("Profile picture updated");
      onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't update picture");
    } finally {
      setPending(false);
    }
  };

  return (
    <Section title="Profile picture">
      <div className="flex items-center gap-4">
        <UserAvatar user={user} size={64} />
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => ref.current?.click()}
            disabled={pending}
            className="h-9 rounded-full border-border text-sm"
          >
            <Camera className="mr-2 h-4 w-4" />
            {pending ? "Uploading…" : "Change"}
          </Button>
        </div>
        <input
          ref={ref}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) upload(f);
            e.target.value = "";
          }}
        />
      </div>
    </Section>
  );
}

function UsernameSection({
  initial,
  onDone,
}: {
  initial: string;
  onDone: () => void;
}) {
  const [v, setV] = useState(initial);
  const [pending, setPending] = useState(false);
  const dirty = v.trim() && v !== initial;
  const submit = async () => {
    if (!/^[a-zA-Z0-9_]{3,24}$/.test(v)) {
      toast.error("3–24 letters, numbers, or underscores.");
      return;
    }
    setPending(true);
    try {
      await api("/profile/username", { method: "PATCH", body: { username: v } });
      toast.success("Username updated");
      onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't update username");
    } finally {
      setPending(false);
    }
  };
  return (
    <Section title="Username">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute inset-y-0 left-3 my-auto h-5 text-sm text-muted-foreground">
            @
          </span>
          <Input
            value={v}
            onChange={(e) => setV(e.target.value.toLowerCase())}
            className="pl-7"
          />
        </div>
        <Button
          disabled={!dirty || pending}
          onClick={submit}
          className="h-10 rounded-full bg-foreground text-background hover:bg-foreground/90"
        >
          {pending ? "Saving…" : "Save"}
        </Button>
      </div>
    </Section>
  );
}

function BioSection({ initial, onDone }: { initial: string; onDone: () => void }) {
  const [v, setV] = useState(initial);
  const [pending, setPending] = useState(false);
  const dirty = v !== initial;
  const submit = async () => {
    setPending(true);
    try {
      await api("/profile/bio", { method: "PATCH", body: { bio: v } });
      toast.success("Bio updated");
      onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't update bio");
    } finally {
      setPending(false);
    }
  };
  return (
    <Section title="Bio" description="A short line about what you're working on.">
      <Textarea
        value={v}
        onChange={(e) => setV(e.target.value)}
        maxLength={160}
        className="min-h-[88px] resize-none"
      />
      <div className="mt-3 flex items-center justify-between">
        <span className="a-mono text-[11px] text-muted-foreground">{v.length}/160</span>
        <Button
          disabled={!dirty || pending}
          onClick={submit}
          className="h-9 rounded-full bg-foreground text-background hover:bg-foreground/90"
        >
          {pending ? "Saving…" : "Save"}
        </Button>
      </div>
    </Section>
  );
}

function PasswordSection() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState<{ c: boolean; n: boolean; r: boolean }>({
    c: false,
    n: false,
    r: false,
  });
  const [pending, setPending] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (next.length < 8) return toast.error("New password must be at least 8 characters.");
    if (next !== confirm) return toast.error("Passwords don't match.");
    setPending(true);
    try {
      await api("/profile/password", {
        method: "PATCH",
        body: { current_password: current, new_password: next },
      });
      toast.success("Password updated");
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't update password");
    } finally {
      setPending(false);
    }
  };

  return (
    <Section title="Password">
      <form onSubmit={submit} className="space-y-3">
        <PwField
          id="cur"
          label="Current password"
          value={current}
          onChange={setCurrent}
          show={show.c}
          toggle={() => setShow((s) => ({ ...s, c: !s.c }))}
        />
        <PwField
          id="new"
          label="New password"
          value={next}
          onChange={setNext}
          show={show.n}
          toggle={() => setShow((s) => ({ ...s, n: !s.n }))}
        />
        <PwField
          id="conf"
          label="Confirm new password"
          value={confirm}
          onChange={setConfirm}
          show={show.r}
          toggle={() => setShow((s) => ({ ...s, r: !s.r }))}
        />
        <Button
          type="submit"
          disabled={pending || !current || !next || !confirm}
          className="h-10 rounded-full bg-foreground text-background hover:bg-foreground/90"
        >
          {pending ? "Updating…" : "Update password"}
        </Button>
      </form>
    </Section>
  );
}

function PwField({
  id,
  label,
  value,
  onChange,
  show,
  toggle,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  toggle: () => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-medium text-foreground">
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pr-10"
          autoComplete={id === "cur" ? "current-password" : "new-password"}
        />
        <button
          type="button"
          onClick={toggle}
          aria-label={show ? "Hide password" : "Show password"}
          className="absolute inset-y-0 right-2 my-auto flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-surface-2 hover:text-foreground"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
