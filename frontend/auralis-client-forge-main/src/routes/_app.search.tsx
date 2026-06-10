import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, X, Clock } from "lucide-react";
import { api, type User } from "@/lib/api";
import { UserAvatar } from "@/components/auralis/UserAvatar";
import { EmptyState, ErrorState } from "@/components/auralis/States";
import { compactCount } from "@/lib/format";

export const Route = createFileRoute("/_app/search")({
  head: () => ({
    meta: [
      { title: "Search · Auralis" },
      { name: "description", content: "Find builders on Auralis." },
    ],
  }),
  component: SearchPage,
});

const RECENT_KEY = "auralis_recent_searches";

function SearchPage() {
  const [raw, setRaw] = useState("");
  const [q, setQ] = useState("");
  const [recents, setRecents] = useState<string[]>([]);

  useEffect(() => {
    try {
      const r = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
      if (Array.isArray(r)) setRecents(r.slice(0, 8));
    } catch {/* noop */}
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setQ(raw.trim()), 250);
    return () => clearTimeout(t);
  }, [raw]);

  const query = useQuery({
    queryKey: ["search-users", q],
    queryFn: () => api<User[] | { items: User[] }>(`/search/users?q=${encodeURIComponent(q)}`),
    enabled: q.length > 0,
  });

  const results: User[] = useMemo(() => {
    const d = query.data;
    if (!d) return [];
    return Array.isArray(d) ? d : ((d as { items?: User[] }).items ?? []);
  }, [query.data]);

  const pushRecent = (term: string) => {
    const t = term.trim();
    if (!t) return;
    const next = [t, ...recents.filter((r) => r !== t)].slice(0, 8);
    setRecents(next);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  };

  const clearRecents = () => {
    setRecents([]);
    localStorage.removeItem(RECENT_KEY);
  };

  return (
    <div>
      <header className="sticky top-14 md:top-0 z-20 -mx-4 border-b border-border/70 bg-background/85 px-4 py-3 backdrop-blur-md md:-mx-8 md:px-8">
        <h1 className="mb-3 text-lg font-semibold tracking-tight text-foreground">Search</h1>
        <div className="relative">
          <Search className="pointer-events-none absolute inset-y-0 left-3 my-auto h-4 w-4 text-muted-foreground" />
          <input
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            onBlur={() => raw.trim() && pushRecent(raw.trim())}
            placeholder="Search by username"
            className="h-11 w-full rounded-full border border-border bg-surface pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
            autoComplete="off"
          />
          {raw ? (
            <button
              type="button"
              onClick={() => setRaw("")}
              aria-label="Clear"
              className="absolute inset-y-0 right-2 my-auto flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-surface-2 hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </header>

      {q.length === 0 ? (
        recents.length === 0 ? (
          <EmptyState
            icon={<Search className="h-5 w-5" />}
            title="Find builders."
            description="Search by username to discover people on Auralis."
          />
        ) : (
          <div className="py-4">
            <div className="mb-2 flex items-center justify-between px-1">
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                Recent
              </p>
              <button
                type="button"
                onClick={clearRecents}
                className="text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            </div>
            <ul className="divide-y divide-border/70">
              {recents.map((r) => (
                <li key={r}>
                  <button
                    type="button"
                    onClick={() => setRaw(r)}
                    className="flex w-full items-center gap-3 py-3 text-left text-sm text-foreground hover:bg-surface-2/40"
                  >
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    {r}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )
      ) : query.isLoading ? (
        <ResultsSkeleton />
      ) : query.isError ? (
        <ErrorState
          message={(query.error as Error).message}
          onRetry={() => query.refetch()}
        />
      ) : results.length === 0 ? (
        <EmptyState
          title={`No users for "${q}".`}
          description="Try a different username."
        />
      ) : (
        <ul className="divide-y divide-border/70">
          {results.map((u) => (
            <li key={u.id}>
              <Link
                to="/u/$userId"
                params={{ userId: u.id }}
                onClick={() => pushRecent(raw)}
                className="flex items-center gap-3 py-3.5 transition-colors hover:bg-surface-2/40"
              >
                <UserAvatar user={u} size={44} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {u.username}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {u.bio || "Builder on Auralis"}
                  </p>
                </div>
                <span className="a-mono text-[11px] text-muted-foreground">
                  {compactCount(u.followers_count)} followers
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ResultsSkeleton() {
  return (
    <ul className="divide-y divide-border/70">
      {Array.from({ length: 6 }).map((_, i) => (
        <li key={i} className="flex items-center gap-3 py-3.5">
          <div className="h-11 w-11 animate-pulse rounded-full bg-surface-2" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-32 animate-pulse rounded bg-surface-2" />
            <div className="h-3 w-56 animate-pulse rounded bg-surface-2" />
          </div>
        </li>
      ))}
    </ul>
  );
}
