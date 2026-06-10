import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { api, type Comment, type Post } from "@/lib/api";
import { timeAgo } from "@/lib/format";
import { UserAvatar } from "./UserAvatar";
import { useAuth } from "@/lib/auth";
import { Link } from "@tanstack/react-router";

export function CommentsSheet({
  post,
  open,
  onOpenChange,
}: {
  post: Post;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [text, setText] = useState("");

  const list = useQuery({
    queryKey: ["comments", post.id],
    queryFn: () => api<Comment[]>(`/posts/${post.id}/comments`),
    enabled: open,
  });

  const create = useMutation({
    mutationFn: (content: string) =>
      api<Comment>(`/posts/${post.id}/comments`, {
        method: "POST",
        body: { content },
      }),
    onMutate: async (content) => {
      await qc.cancelQueries({ queryKey: ["comments", post.id] });
      const prev = qc.getQueryData<Comment[]>(["comments", post.id]);
      const optimistic: Comment = {
        id: `tmp-${Date.now()}`,
        content,
        created_at: new Date().toISOString(),
        user: user ?? { id: "me", username: "you" },
      };
      qc.setQueryData<Comment[]>(["comments", post.id], (old) => [
        optimistic,
        ...(old ?? []),
      ]);
      setText("");
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      qc.setQueryData(["comments", post.id], ctx?.prev);
      toast.error("Couldn't post comment");
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["comments", post.id] });
      qc.invalidateQueries({ queryKey: ["feed"] });
    },
  });

  const del = useMutation({
    mutationFn: async (commentId: string) => {
      if (String(commentId).startsWith("tmp-")) return;
      return api(`/posts/${post.id}/comments/${commentId}`, { method: "DELETE" });
    },
    onMutate: async (commentId) => {
      await qc.cancelQueries({ queryKey: ["comments", post.id] });
      const prev = qc.getQueryData<Comment[]>(["comments", post.id]);
      qc.setQueryData<Comment[]>(["comments", post.id], (old) => 
        (old ?? []).filter((c) => String(c.id) !== String(commentId))
      );
      return { prev };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comments", post.id] });
      qc.invalidateQueries({ queryKey: ["feed"] });
    },
    onError: (e: Error, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["comments", post.id], ctx.prev);
      toast.error(e.message);
    },
  });

  const items = Array.isArray(list.data) ? list.data : [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="flex h-[85svh] flex-col gap-0 rounded-t-3xl border-t border-border/70 p-0 sm:h-[75svh] sm:max-w-[560px] sm:rounded-t-2xl"
      >
        <SheetHeader className="border-b border-border/70 px-5 py-4 text-left">
          <SheetTitle className="text-base font-semibold">Comments</SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            {post.comment_count} {post.comment_count === 1 ? "reply" : "replies"} to{" "}
            <span className="text-foreground">@{post.user.username}</span>
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5">
          {list.isLoading ? (
            <div className="space-y-4 py-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex gap-3">
                  <div className="h-9 w-9 animate-pulse rounded-full bg-surface-2" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-1/3 animate-pulse rounded bg-surface-2" />
                    <div className="h-3 w-2/3 animate-pulse rounded bg-surface-2" />
                  </div>
                </div>
              ))}
            </div>
          ) : list.isError ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Couldn't load comments.
            </p>
          ) : items.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No comments yet. Start the conversation.
            </p>
          ) : (
            <ul className="divide-y divide-border/70">
              {items.map((c) => {
                const mine = user?.id && c.user?.id === user.id;
                return (
                  <li key={c.id} className="flex gap-3 py-4">
                    <Link to="/u/$userId" params={{ userId: c.user.id }}>
                      <UserAvatar user={c.user} size={36} />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-1.5 text-sm">
                        <Link
                          to="/u/$userId"
                          params={{ userId: c.user.id }}
                          className="font-medium text-foreground hover:underline underline-offset-4"
                        >
                          {c.user.username}
                        </Link>
                        <span className="text-xs text-muted-foreground">
                          {timeAgo(c.created_at)}
                        </span>
                        {mine ? (
                          <button
                            type="button"
                            onClick={() => del.mutate(c.id)}
                            aria-label="Delete comment"
                            disabled={String(c.id).startsWith("tmp-")}
                            className="ml-auto rounded-md p-1 text-muted-foreground hover:bg-surface-2 hover:text-destructive disabled:opacity-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        ) : null}
                      </div>
                      <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground">
                        {c.content}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            const t = text.trim();
            if (!t) return;
            create.mutate(t);
          }}
          className="flex items-end gap-2 border-t border-border/70 bg-surface-2/40 px-4 py-3 pb-[max(env(safe-area-inset-bottom),12px)]"
        >
          <UserAvatar user={user} size={32} />
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Reply…"
            className="max-h-32 min-h-10 flex-1 resize-none rounded-2xl border border-border/70 bg-surface px-3 py-2 text-sm shadow-none focus-visible:ring-1 focus-visible:ring-ring"
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault();
                const t = text.trim();
                if (t) create.mutate(t);
              }
            }}
          />
          <Button
            type="submit"
            size="sm"
            disabled={!text.trim() || create.isPending}
            className="h-9 rounded-full bg-foreground px-4 text-background hover:bg-foreground/90"
          >
            Reply
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
