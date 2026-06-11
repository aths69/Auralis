import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2, Reply, X } from "lucide-react";
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
import { cn } from "@/lib/utils";

function CommentItem({
  comment,
  replies,
  depth = 0,
  onReply,
  onDelete,
  currentUserId,
}: {
  comment: Comment;
  replies: Comment[];
  depth?: number;
  onReply: (c: Comment) => void;
  onDelete: (id: string) => void;
  currentUserId?: string;
}) {
  const mine = currentUserId && comment.user?.id === currentUserId;
  const childReplies = replies.filter((r) => String(r.parent_id) === String(comment.id));

  return (
    <li className={cn("flex flex-col gap-3 py-3", depth > 0 && "pt-2 pb-0")}>
      <div className="flex gap-3">
        <Link to="/u/$userId" params={{ userId: comment.user.id }} className="shrink-0">
          <UserAvatar user={comment.user} size={depth > 0 ? 28 : 36} />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-1.5 text-sm">
            <Link
              to="/u/$userId"
              params={{ userId: comment.user.id }}
              className="font-medium text-foreground hover:underline underline-offset-4"
            >
              {comment.user.username}
            </Link>
            <span className="text-xs text-muted-foreground">
              {timeAgo(comment.created_at)}
            </span>
            {mine ? (
              <button
                type="button"
                onClick={() => onDelete(comment.id)}
                aria-label="Delete comment"
                disabled={String(comment.id).startsWith("tmp-")}
                className="ml-auto rounded-md p-1 text-muted-foreground hover:bg-surface-2 hover:text-destructive disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>
          <p className={cn("mt-0.5 whitespace-pre-wrap break-words leading-relaxed text-foreground", depth > 0 ? "text-[13px]" : "text-sm")}>
            {comment.content}
          </p>
          <div className="mt-1 flex items-center gap-3">
            <button
              onClick={() => onReply(comment)}
              className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              <Reply className="h-3 w-3" />
              Reply
            </button>
          </div>
        </div>
      </div>
      {childReplies.length > 0 && (
        <ul className={cn("ml-4 pl-4 border-l border-border/50", depth >= 3 && "ml-2 pl-2 border-l-0")}>
          {childReplies.map((r) => (
            <CommentItem
              key={r.id}
              comment={r}
              replies={replies}
              depth={depth + 1}
              onReply={onReply}
              onDelete={onDelete}
              currentUserId={currentUserId}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

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
  const [replyTo, setReplyTo] = useState<Comment | null>(null);

  const list = useQuery({
    queryKey: ["comments", post.id],
    queryFn: () => api<Comment[]>(`/posts/${post.id}/comments`),
    enabled: open,
  });

  const create = useMutation({
    mutationFn: (content: string) =>
      api<Comment>(`/posts/${post.id}/comments`, {
        method: "POST",
        body: { content, parent_id: replyTo?.id },
      }),
    onMutate: async (content) => {
      await qc.cancelQueries({ queryKey: ["comments", post.id] });
      const prev = qc.getQueryData<Comment[]>(["comments", post.id]);
      const optimistic: Comment = {
        id: `tmp-${Date.now()}`,
        content,
        created_at: new Date().toISOString(),
        user: user ?? { id: "me", username: "you" },
        parent_id: replyTo?.id,
      };
      qc.setQueryData<Comment[]>(["comments", post.id], (old) => [
        optimistic,
        ...(old ?? []),
      ]);
      setText("");
      setReplyTo(null);
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
      // Optimistically remove comment and all nested children
      qc.setQueryData<Comment[]>(["comments", post.id], (old) => {
        if (!old) return old;
        const toDelete = new Set<string>([String(commentId)]);
        let size = 0;
        // Find all descendants
        while (toDelete.size > size) {
          size = toDelete.size;
          for (const c of old) {
            if (c.parent_id && toDelete.has(String(c.parent_id))) {
              toDelete.add(String(c.id));
            }
          }
        }
        return old.filter((c) => !toDelete.has(String(c.id)));
      });
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
    <Sheet open={open} onOpenChange={(v) => {
      onOpenChange(v);
      if (!v) {
        setReplyTo(null);
        setText("");
      }
    }}>
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
            <ul className="divide-y divide-border/70 pb-4">
              {items
                .filter((c) => !c.parent_id)
                .map((c) => (
                  <CommentItem
                    key={c.id}
                    comment={c}
                    replies={items}
                    onReply={setReplyTo}
                    onDelete={(id) => del.mutate(id)}
                    currentUserId={user?.id}
                  />
                ))}
            </ul>
          )}
        </div>

        {replyTo && (
          <div className="flex items-center justify-between bg-surface-2/60 px-5 py-2 text-xs text-muted-foreground border-t border-border/70">
            <span>Replying to <span className="font-medium text-foreground">@{replyTo.user.username}</span></span>
            <button onClick={() => setReplyTo(null)} className="p-1 hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const t = text.trim();
            if (!t) return;
            create.mutate(t);
          }}
          className={cn("flex items-end gap-2 bg-surface-2/40 px-4 py-3 pb-[max(env(safe-area-inset-bottom),12px)]", !replyTo && "border-t border-border/70")}
        >
          <UserAvatar user={user} size={32} />
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={replyTo ? "Write a reply..." : "Write a comment..."}
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
            {replyTo ? "Reply" : "Post"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
