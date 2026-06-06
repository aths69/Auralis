import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
} from "@tanstack/react-query";
import { Settings as SettingsIcon } from "lucide-react";
import { api, type Post, type User, getImageUrl } from "@/lib/api";
import { UserAvatar } from "./UserAvatar";
import { PostCard } from "./PostCard";
import { EmptyState, ErrorState, PostSkeleton } from "./States";
import { Button } from "@/components/ui/button";
import { compactCount } from "@/lib/format";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Tab = "posts" | "followers" | "following";

export function ProfileView({
  user,
  isSelf,
}: {
  user: User;
  isSelf: boolean;
}) {
  const [tab, setTab] = useState<Tab>("posts");
  const qc = useQueryClient();

  const posts = useQuery({
    queryKey: ["user-posts", user.id],
    queryFn: () => api<Post[] | { items: Post[] }>(`/posts/user/${user.id}`),
    enabled: tab === "posts",
  });

  const followers = useQuery({
    queryKey: ["followers", user.id],
    queryFn: () => api<User[] | { items: User[] }>(`/follow/followers/${user.id}`),
    enabled: tab === "followers",
  });

  const following = useQuery({
    queryKey: ["following", user.id],
    queryFn: () => api<User[] | { items: User[] }>(`/follow/following/${user.id}`),
    enabled: tab === "following",
  });

  const follow = useMutation({
    mutationFn: async (next: boolean) =>
      api(`/follow/${user.id}`, { method: next ? "POST" : "DELETE" }),
    onMutate: async (next) => {
      const key = ["profile", String(user.id)];
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<User>(key);
      qc.setQueryData<User>(key, (old) =>
        old
          ? {
              ...old,
              is_following: next,
              followers_count: Math.max(
                0,
                (old.followers_count ?? 0) + (next ? 1 : -1),
              ),
            }
          : old,
      );
      return { prev, key };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev && ctx?.key) qc.setQueryData(ctx.key, ctx.prev);
      toast.error("Couldn't update follow");
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["profile", String(user.id)] });
    },
  });

  return (
    <div>
      {/* Profile header */}
      <header className="px-1 pt-4 pb-6">
        <div className="flex items-start justify-between gap-4">
          <UserAvatar user={user} size={88} className="ring-2 ring-background" />
          <div className="flex gap-2">
            {isSelf ? (
              <Button
                asChild
                variant="outline"
                className="h-9 rounded-full border-border bg-surface px-4 text-sm"
              >
                <Link to="/settings">
                  <SettingsIcon className="mr-1.5 h-3.5 w-3.5" />
                  Edit
                </Link>
              </Button>
            ) : (
              <Button
                onClick={() => follow.mutate(!user.is_following)}
                className={cn(
                  "h-9 rounded-full px-5 text-sm font-medium",
                  user.is_following
                    ? "border border-border bg-surface text-foreground hover:bg-surface-2"
                    : "bg-foreground text-background hover:bg-foreground/90",
                )}
              >
                {user.is_following ? "Following" : "Follow"}
              </Button>
            )}
          </div>
        </div>

        <div className="mt-4">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            {user.username}
          </h1>
          {user.bio ? (
            <p className="mt-1.5 max-w-prose whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
              {user.bio}
            </p>
          ) : (
            <p className="mt-1.5 text-sm italic text-muted-foreground/70">
              No bio yet.
            </p>
          )}
        </div>

        <div className="mt-5 flex gap-5 text-sm">
          <Stat label="Posts" value={user.posts_count} />
          <button
            type="button"
            onClick={() => setTab("followers")}
            className="text-left transition-colors hover:opacity-80"
          >
            <Stat label="Followers" value={user.followers_count} />
          </button>
          <button
            type="button"
            onClick={() => setTab("following")}
            className="text-left transition-colors hover:opacity-80"
          >
            <Stat label="Following" value={user.following_count} />
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="sticky top-0 z-10 -mx-4 border-y border-border/70 bg-background/85 px-4 backdrop-blur-md md:-mx-8 md:px-8">
        <nav className="flex gap-1">
          {(["posts", "followers", "following"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                "relative -mb-px py-3 px-3 text-sm font-medium capitalize transition-colors",
                tab === t
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t}
              <span
                className={cn(
                  "absolute inset-x-3 -bottom-px h-[2px] rounded-full transition-colors",
                  tab === t ? "bg-foreground" : "bg-transparent",
                )}
              />
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {tab === "posts" ? (
        posts.isLoading ? (
          <div>
            {Array.from({ length: 3 }).map((_, i) => (
              <PostSkeleton key={i} />
            ))}
          </div>
        ) : posts.isError ? (
          <ErrorState
            message={(posts.error as Error).message}
            onRetry={() => posts.refetch()}
          />
        ) : (() => {
            const items: Post[] = Array.isArray(posts.data)
              ? posts.data
              : ((posts.data as { items?: Post[] } | undefined)?.items ?? []);
            return items.length === 0 ? (
              <EmptyState
                title={isSelf ? "You haven't posted yet." : "No posts yet."}
                description={
                  isSelf
                    ? "Share something you're working on. A blocker, a win, a question."
                    : "When this person posts, you'll see it here."
                }
              />
            ) : (
              <div className="grid grid-cols-3 gap-1">
                {items.map((p) => (
                  <div key={p.id} className="relative aspect-square overflow-hidden bg-surface-2 group">
                    {p.image_url ? (
                      <img
                        src={getImageUrl(p.image_url)}
                        alt=""
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center p-4">
                        <p className="line-clamp-3 text-xs font-medium text-muted-foreground text-center">
                          {p.content || p.captions}
                        </p>
                      </div>
                    )}
                    <Link
                      to="/feed"
                      className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100"
                    />
                  </div>
                ))}
              </div>
            );
          })()
      ) : tab === "followers" ? (
        <UserList q={followers} emptyTitle="No followers yet." />
      ) : (
        <UserList q={following} emptyTitle="Not following anyone yet." />
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value?: number }) {
  return (
    <div>
      <span className="a-mono text-sm font-medium text-foreground">
        {compactCount(value)}
      </span>{" "}
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

function UserList({
  q,
  emptyTitle,
}: {
  q: UseQueryResult<User[] | { items: User[] }, Error>;
  emptyTitle: string;
}) {
  if (q.isLoading) {
    return (
      <ul className="divide-y divide-border/70">
        {Array.from({ length: 5 }).map((_, i) => (
          <li key={i} className="flex items-center gap-3 py-3.5">
            <div className="h-10 w-10 animate-pulse rounded-full bg-surface-2" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-32 animate-pulse rounded bg-surface-2" />
              <div className="h-3 w-48 animate-pulse rounded bg-surface-2" />
            </div>
          </li>
        ))}
      </ul>
    );
  }
  if (q.isError) {
    return <ErrorState message={(q.error as Error).message} onRetry={() => q.refetch()} />;
  }
  const items: User[] = Array.isArray(q.data)
    ? q.data
    : ((q.data as { items?: User[] } | undefined)?.items ?? []);
  if (items.length === 0) {
    return <EmptyState title={emptyTitle} />;
  }
  return (
    <ul className="divide-y divide-border/70">
      {items.map((u) => (
        <li key={u.id}>
          <Link
            to="/u/$userId"
            params={{ userId: u.id }}
            className="flex items-center gap-3 py-3.5 transition-colors hover:bg-surface-2/40"
          >
            <UserAvatar user={u} size={40} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {u.username}
              </p>
              {u.bio ? (
                <p className="truncate text-xs text-muted-foreground">{u.bio}</p>
              ) : null}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
