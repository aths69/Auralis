import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Inbox, RefreshCw } from "lucide-react";
import { api, type Post } from "@/lib/api";
import { PostCard } from "@/components/auralis/PostCard";
import { EmptyState, ErrorState, PostSkeleton } from "@/components/auralis/States";

export const Route = createFileRoute("/_app/feed")({
  head: () => ({
    meta: [
      { title: "Home · Auralis" },
      { name: "description", content: "What builders are shipping today." },
    ],
  }),
  component: FeedPage,
});

function FeedPage() {
  const q = useQuery({
    queryKey: ["feed"],
    queryFn: () => api<Post[] | { items: Post[] }>("/posts/feed"),
  });

  const items: Post[] = Array.isArray(q.data)
    ? q.data
    : ((q.data as { items?: Post[] } | undefined)?.items ?? []);

  return (
    <div>
      <header className="sticky top-0 z-20 -mx-4 flex items-center justify-between border-b border-border/70 bg-background/85 px-4 py-3 backdrop-blur-md md:-mx-8 md:px-8">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-foreground">Home</h1>
          <p className="text-xs text-muted-foreground">Latest from people you follow.</p>
        </div>
        <button
          type="button"
          onClick={() => q.refetch()}
          aria-label="Refresh"
          className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
        >
          <RefreshCw
            className={`h-4 w-4 ${q.isFetching ? "animate-spin" : ""}`}
            strokeWidth={1.75}
          />
        </button>
      </header>

      {q.isLoading ? (
        <div>
          {Array.from({ length: 5 }).map((_, i) => (
            <PostSkeleton key={i} />
          ))}
        </div>
      ) : q.isError ? (
        <ErrorState
          message={(q.error as Error).message}
          onRetry={() => q.refetch()}
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Inbox className="h-5 w-5" />}
          title="Your feed is quiet."
          description="Follow people, or be the first to post something. Share what you shipped today."
        />
      ) : (
        <div>
          {items.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </div>
      )}
    </div>
  );
}
