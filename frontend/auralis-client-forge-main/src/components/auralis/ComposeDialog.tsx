import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth";
import { UserAvatar } from "./UserAvatar";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

const MAX = 500;

export function ComposeDialog({
  open,
  onOpenChange,
  initial,
  postId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: string;
  postId?: string;
}) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [content, setContent] = useState(initial ?? "");

  useEffect(() => {
    if (open) setContent(initial ?? "");
  }, [open, initial]);

  const create = useMutation({
    mutationFn: (text: string) =>
      api("/posts/create", { method: "POST", body: { content: text } }),
    onSuccess: () => {
      toast.success("Posted");
      qc.invalidateQueries({ queryKey: ["feed"] });
      qc.invalidateQueries({ queryKey: ["user-posts"] });
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: (text: string) =>
      api(`/posts/update/${postId}`, { method: "PATCH", body: { content: text } }),
    onSuccess: () => {
      toast.success("Updated");
      qc.invalidateQueries({ queryKey: ["feed"] });
      qc.invalidateQueries({ queryKey: ["user-posts"] });
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const isEdit = !!postId;
  const submit = () => {
    const text = content.trim();
    if (!text) return;
    if (text.length > MAX) return;
    if (isEdit) update.mutate(text);
    else create.mutate(text);
  };

  const pending = create.isPending || update.isPending;
  const remaining = MAX - content.length;
  const over = remaining < 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 p-0 sm:max-w-[560px]">
        <DialogHeader className="border-b border-border/70 px-5 py-4">
          <DialogTitle className="text-base font-semibold">
            {isEdit ? "Edit post" : "New post"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Compose a post to share with the community.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-3 px-5 py-5">
          <UserAvatar user={user} size={40} />
          <Textarea
            autoFocus
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What are you working on?"
            className="min-h-[140px] resize-none border-0 bg-transparent p-0 text-[15px] leading-relaxed shadow-none focus-visible:ring-0 md:text-[15px]"
          />
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border/70 bg-surface-2/50 px-5 py-3">
          <span
            className={cn(
              "a-mono text-xs",
              over
                ? "text-destructive"
                : remaining < 60
                  ? "text-foreground/80"
                  : "text-muted-foreground",
            )}
          >
            {remaining}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={submit}
              disabled={pending || !content.trim() || over}
              className="rounded-full bg-foreground text-background hover:bg-foreground/90"
            >
              {pending ? "Posting…" : isEdit ? "Save" : "Post"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
