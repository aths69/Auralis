import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api, type Post, getImageUrl } from "@/lib/api";
import { compactCount, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import { UserAvatar } from "./UserAvatar";
import { CommentsSheet } from "./CommentsSheet";
import { ComposeDialog } from "./ComposeDialog";
import { useAuth } from "@/lib/auth";

export function PostCard({ post }: { post: Post }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [comments, setComments] = useState(false);
  const [edit, setEdit] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isMine = user?.id && post.user?.id === user.id;

  const like = useMutation({
    mutationFn: async (next: boolean) =>
      api(`/posts/${post.id}/likes`, { method: next ? "POST" : "DELETE" }),
    onMutate: async (next) => {
      await qc.cancelQueries({ queryKey: ["feed"] });
      const prev = qc.getQueriesData({ queryKey: ["feed"] });
      qc.setQueriesData<{ pages: { items: Post[] }[] } | Post[]>(
        { queryKey: ["feed"] },
        (old) => bump(old, post.id, next),
      );
      qc.setQueriesData<{ pages: { items: Post[] }[] } | Post[]>(
        { queryKey: ["user-posts"] },
        (old) => bump(old, post.id, next),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      ctx?.prev?.forEach(([k, v]) => qc.setQueryData(k, v));
      toast.error("Couldn't update like");
    },
  });

  const del = useMutation({
    mutationFn: () => api(`/posts/delete/${post.id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Post deleted");
      qc.invalidateQueries({ queryKey: ["feed"] });
      qc.invalidateQueries({ queryKey: ["user-posts"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const share = () => {
    if (typeof navigator !== "undefined" && "clipboard" in navigator) {
      navigator.clipboard.writeText(
        `${window.location.origin}/u/${post.user.id}#${post.id}`,
      );
      toast.success("Link copied");
    } else {
      toast("Sharing");
    }
  };

  const liked = !!post.liked_by_me;

  return (
    <article className="border-b border-border/70 px-1 py-5 first:pt-2 last:border-b-0">
      <div className="flex gap-3">
        <Link to="/u/$userId" params={{ userId: post.user.id }} className="shrink-0">
          <UserAvatar user={post.user} size={40} />
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-sm">
            <Link
              to="/u/$userId"
              params={{ userId: post.user.id }}
              className="truncate font-medium text-foreground hover:underline underline-offset-4"
            >
              {post.user.username}
            </Link>
            <span className="text-muted-foreground">·</span>
            <time className="text-xs text-muted-foreground" dateTime={post.created_at}>
              {timeAgo(post.created_at)}
            </time>
            <div className="ml-auto">
              {isMine ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      aria-label="Post options"
                      className="-mr-2 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setEdit(true)}>
                      <Pencil className="mr-2 h-4 w-4" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setConfirmDelete(true)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}
            </div>
          </div>

          <p className="mt-1.5 whitespace-pre-wrap break-words text-[15px] leading-relaxed text-foreground">
            {post.content || post.captions}
          </p>

          {post.image_url ? (
            <div className="mt-3 overflow-hidden rounded-xl border border-border/70">
              <img
                src={getImageUrl(post.image_url)}
                alt="Post attachment"
                className="max-h-[500px] w-full object-cover"
              />
            </div>
          ) : null}

          <div className="mt-3 flex items-center gap-1 text-muted-foreground">
            <ActionBtn
              onClick={() => like.mutate(!liked)}
              active={liked}
              activeClass="text-rose-500"
              label={compactCount(post.like_count)}
              ariaLabel={liked ? "Unlike" : "Like"}
            >
              <Heart
                className={cn("h-[18px] w-[18px]", liked && "fill-current")}
                strokeWidth={1.75}
              />
            </ActionBtn>
            <ActionBtn
              onClick={() => setComments(true)}
              label={compactCount(post.comment_count)}
              ariaLabel="Comments"
            >
              <MessageCircle className="h-[18px] w-[18px]" strokeWidth={1.75} />
            </ActionBtn>
            <ActionBtn onClick={share} ariaLabel="Share">
              <Share2 className="h-[18px] w-[18px]" strokeWidth={1.75} />
            </ActionBtn>
          </div>
        </div>
      </div>

      <CommentsSheet post={post} open={comments} onOpenChange={setComments} />
      <ComposeDialog open={edit} onOpenChange={setEdit} initial={post.content || post.captions} postId={post.id} />

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this post?</AlertDialogTitle>
            <AlertDialogDescription>
              This can't be undone. Your post will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => del.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </article>
  );
}

function ActionBtn({
  children,
  onClick,
  label,
  ariaLabel,
  active,
  activeClass,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label?: string;
  ariaLabel: string;
  active?: boolean;
  activeClass?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={cn(
        "group flex h-9 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium transition-colors",
        "text-muted-foreground hover:bg-surface-2 hover:text-foreground",
        active && activeClass,
      )}
    >
      {children}
      {label ? <span className="a-mono tabular-nums">{label}</span> : null}
    </button>
  );
}

function bump<T>(old: T, id: string, next: boolean): T {
  const apply = (p: Post): Post =>
    p.id === id
      ? {
          ...p,
          liked_by_me: next,
          like_count: Math.max(0, (p.like_count ?? 0) + (next ? 1 : -1)),
        }
      : p;
  if (!old) return old;
  if (Array.isArray(old)) return old.map(apply) as T;
  const o = old as unknown as { pages?: { items: Post[] }[] };
  if (o?.pages) {
    return {
      ...(old as object),
      pages: o.pages.map((pg) => ({ ...pg, items: pg.items.map(apply) })),
    } as T;
  }
  return old;
}
