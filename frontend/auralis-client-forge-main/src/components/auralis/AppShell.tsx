import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  Bell,
  Home,
  Plus,
  Search,
  Settings,
  LogOut,
  User as UserIcon,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { api, type User } from "@/lib/api";
import { Logo } from "./Logo";
import { UserAvatar } from "./UserAvatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState, type ReactNode } from "react";
import { ComposeDialog } from "./ComposeDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const nav = [
  { to: "/feed", label: "Home", icon: Home },
  { to: "/search", label: "Search", icon: Search },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/profile", label: "Profile", icon: UserIcon },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [composeOpen, setComposeOpen] = useState(false);

  const unread = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: () => api<{ count: number } | number>("/notifications/unread-count"),
    refetchInterval: 60_000,
    retry: false,
  });
  const unreadCount =
    typeof unread.data === "number"
      ? unread.data
      : (unread.data as { count?: number } | undefined)?.count ?? 0;

  const isActive = (to: string) =>
    to === "/feed" ? path === "/feed" || path === "/" : path.startsWith(to);

  return (
    <div className="min-h-svh bg-background text-foreground">
      {/* Desktop / tablet shell */}
      <div className="mx-auto flex w-full max-w-[1400px]">
        {/* Left rail */}
        <aside className="sticky top-0 hidden h-svh w-[240px] shrink-0 flex-col border-r border-border/70 px-4 py-6 md:flex lg:w-[260px]">
          <Link to="/feed" className="px-2 text-foreground">
            <Logo />
          </Link>

          <nav className="mt-8 flex flex-col gap-1">
            {nav.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                    active
                      ? "bg-surface-2 text-foreground"
                      : "text-muted-foreground hover:bg-surface-2/60 hover:text-foreground",
                  )}
                >
                  <span className="relative">
                    <Icon
                      className={cn(
                        "h-[18px] w-[18px]",
                        active ? "text-foreground" : "text-muted-foreground",
                      )}
                      strokeWidth={active ? 2.25 : 1.75}
                    />
                    {item.to === "/notifications" && unreadCount > 0 ? (
                      <span className="absolute -right-1 -top-1 h-1.5 w-1.5 rounded-full bg-brand" />
                    ) : null}
                  </span>
                  <span className="font-medium">{item.label}</span>
                  {item.to === "/notifications" && unreadCount > 0 ? (
                    <span className="ml-auto rounded-md bg-foreground/90 px-1.5 py-0.5 text-[10px] font-medium text-background">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>

          <Button
            onClick={() => setComposeOpen(true)}
            className="mt-6 h-10 w-full justify-center gap-2 rounded-full bg-foreground text-background shadow-soft hover:bg-foreground/90"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            New post
          </Button>

          <div className="mt-auto">
            <UserMenu user={user} onLogout={() => { logout(); navigate({ to: "/login" }); }} />
          </div>
        </aside>

        {/* Main */}
        <main className="min-w-0 flex-1 pb-24 md:pb-10">
          <div className="mx-auto w-full max-w-[640px] px-4 pt-4 md:px-8 md:pt-8">
            {children}
          </div>
        </main>

        {/* Right utility */}
        <aside className="sticky top-0 hidden h-svh w-[320px] shrink-0 flex-col gap-4 border-l border-border/70 px-6 py-8 lg:flex">
          <UtilityPanel />
        </aside>
      </div>

      {/* Mobile top bar */}
      <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-border/70 bg-background/85 px-4 backdrop-blur-md md:hidden">
        <Link to="/feed" className="text-foreground">
          <Logo size={20} />
        </Link>
        <Link
          to="/notifications"
          className="relative -m-2 p-2 text-foreground/80"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" strokeWidth={1.75} />
          {unreadCount > 0 ? (
            <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-brand" />
          ) : null}
        </Link>
      </header>
      <div className="h-14 md:hidden" />

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <ul className="mx-auto flex max-w-[480px] items-center justify-around">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.to);
            return (
              <li key={item.to} className="flex-1">
                <Link
                  to={item.to}
                  className={cn(
                    "flex h-14 flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors",
                    active ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  <Icon
                    className="h-[22px] w-[22px]"
                    strokeWidth={active ? 2.25 : 1.75}
                  />
                  <span className="tracking-wide">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Mobile compose FAB */}
      <button
        type="button"
        onClick={() => setComposeOpen(true)}
        aria-label="New post"
        className="fixed bottom-[84px] right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-foreground text-background shadow-pop transition-transform active:scale-95 md:hidden"
      >
        <Plus className="h-6 w-6" strokeWidth={2.5} />
      </button>

      <ComposeDialog open={composeOpen} onOpenChange={setComposeOpen} />
    </div>
  );
}

function UserMenu({ user, onLogout }: { user: User | null; onLogout: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-surface-2"
        >
          <UserAvatar user={user} size={36} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">
              {user?.username ?? "Signed in"}
            </div>
            <div className="truncate text-xs text-muted-foreground">
              {user?.email ?? "Manage account"}
            </div>
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="top" className="w-56">
        <DropdownMenuItem asChild>
          <Link to="/profile" className="flex items-center gap-2">
            <UserIcon className="h-4 w-4" /> Your profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" /> Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onLogout} className="text-destructive focus:text-destructive">
          <LogOut className="mr-2 h-4 w-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function UtilityPanel() {
  return (
    <>
      <div className="rounded-2xl border border-border/70 bg-surface p-5 shadow-soft">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
          A quieter network
        </p>
        <h3 className="mt-3 text-base font-semibold leading-snug text-foreground">
          For people who build things.
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Auralis is a calm place for developers, designers, and indie builders
          to share progress and trade ideas.
        </p>
      </div>

      <div className="rounded-2xl border border-border/70 bg-surface p-5 shadow-soft">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Community guidelines
        </p>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li className="flex gap-2">
            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-foreground/40" />
            Share what you're building, not what you're selling.
          </li>
          <li className="flex gap-2">
            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-foreground/40" />
            Be specific. Concrete beats clever.
          </li>
          <li className="flex gap-2">
            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-foreground/40" />
            Help when you can. Ask when you can't.
          </li>
        </ul>
      </div>

      <p className="mt-auto px-1 text-[11px] leading-relaxed text-muted-foreground/80">
        Auralis · A small, quiet network for builders.
      </p>
    </>
  );
}
