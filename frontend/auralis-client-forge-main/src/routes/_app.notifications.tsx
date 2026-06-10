import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck } from "lucide-react";
import { api, type Notification } from "@/lib/api";
import { UserAvatar } from "@/components/auralis/UserAvatar";
import { EmptyState, ErrorState } from "@/components/auralis/States";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications · Auralis" },
      { name: "description", content: "Likes, replies, and new followers." },
    ],
  }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["notifications"],
    queryFn: () => api<Notification[] | { items: Notification[] }>("/notifications/"),
  });

  const items: Notification[] = Array.isArray(q.data)
    ? q.data
    : ((q.data as { items?: Notification[] } | undefined)?.items ?? []);

  const markRead = useMutation({
    mutationFn: (id: string) =>
      api(`/notifications/${id}/read`, { method: "PATCH" }),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["notifications"] });
      const prev = qc.getQueryData<Notification[]>(["notifications"]);
      qc.setQueryData<Notification[] | { items: Notification[] }>(
        ["notifications"],
        (old) => {
          if (!old) return old;
          const apply = (n: Notification) => (n.id === id ? { ...n, read: true } : n);
          if (Array.isArray(old)) return old.map(apply);
          return { ...old, items: old.items.map(apply) };
        },
      );
      return { prev };
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
    },
  });

  const markAll = async () => {
    const unread = items.filter((n) => !n.read);
    if (unread.length === 0) return;
    await Promise.all(
      unread.map((n) =>
        api(`/notifications/${n.id}/read`, { method: "PATCH" }).catch(() => null),
      ),
    );
    toast.success("All caught up");
    qc.invalidateQueries({ queryKey: ["notifications"] });
    qc.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
  };

  return (
    <div>
      <header className="sticky top-14 md:top-0 z-20 -mx-4 flex items-center justify-between border-b border-border/70 bg-background/85 px-4 py-3 backdrop-blur-md md:-mx-8 md:px-8">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-foreground">Notifications</h1>
          <p className="text-xs text-muted-foreground">
            {items.filter((n) => !n.read).length} unread
          </p>
        </div>
        <button
          type="button"
          onClick={markAll}
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
        >
          <CheckCheck className="h-3.5 w-3.5" />
          Mark all read
        </button>
      </header>

      {q.isLoading ? (
        <ul className="divide-y divide-border/70">
          {Array.from({ length: 6 }).map((_, i) => (
            <li key={i} className="flex items-center gap-3 py-4">
              <div className="h-10 w-10 animate-pulse rounded-full bg-surface-2" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-2/3 animate-pulse rounded bg-surface-2" />
                <div className="h-3 w-1/4 animate-pulse rounded bg-surface-2" />
              </div>
            </li>
          ))}
        </ul>
      ) : q.isError ? (
        <ErrorState message={(q.error as Error).message} onRetry={() => q.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Bell className="h-5 w-5" />}
          title="No notifications yet."
          description="When people interact with your posts, you'll see it here."
        />
      ) : (
        <ul className="divide-y divide-border/70">
          {items.map((n) => {
            const actor = n.actor;
            const Wrap = actor ? Link : "div";
            const wrapProps = actor
              ? ({ to: "/u/$userId", params: { userId: actor.id } } as const)
              : ({} as Record<string, unknown>);
            return (
              <li key={n.id}>
                {/* @ts-expect-error polymorphic */}
                <Wrap
                  {...wrapProps}
                  onClick={() => !n.read && markRead.mutate(n.id)}
                  className={cn(
                    "flex items-center gap-3 py-4 transition-colors",
                    !n.read && "bg-brand/5 hover:bg-brand/10",
                    n.read && "hover:bg-surface-2/40",
                  )}
                >
                  <div className="relative">
                    <UserAvatar user={actor ?? null} size={40} />
                    {!n.read ? (
                      <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-brand" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-foreground">
                      {actor ? (
                        <span className="font-medium">{actor.username} </span>
                      ) : null}
                      <span className="text-muted-foreground">{n.message}</span>
                    </p>
                    <p className="a-mono text-[11px] text-muted-foreground">
                      {timeAgo(n.created_at)}
                    </p>
                  </div>
                </Wrap>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
