import { useEffect, useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Camera, X } from "lucide-react";
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

  const fileRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const onFile = (f: File | null) => {
    setImage(f);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(f ? URL.createObjectURL(f) : null);
  };

  useEffect(() => {
    if (open) {
      setContent(initial ?? "");
      setImage(null);
      setPreview(null);
    }
  }, [open, initial]);

  const create = useMutation({
    mutationFn: (form: FormData) =>
      api("/posts/create", { method: "POST", form }),
    onSuccess: () => {
      toast.success("Posted");
      qc.invalidateQueries({ queryKey: ["feed"] });
      qc.invalidateQueries({ queryKey: ["user-posts"] });
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: (form: FormData) =>
      api(`/posts/update/${postId}`, { method: "PATCH", form }),
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
    if (!text && !image) return;
    
    const form = new FormData();
    if (text) form.append("captions", text);
    if (image) form.append("image", image);

    if (isEdit) update.mutate(form);
    else create.mutate(form);
  };

  const pending = create.isPending || update.isPending;

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

        <div className="flex flex-col gap-3 px-5 py-5">
          <div className="flex gap-3">
            <UserAvatar user={user} size={40} />
            <Textarea
              autoFocus
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What are you working on?"
              className="min-h-[100px] resize-none border-0 bg-transparent p-0 text-[15px] leading-relaxed shadow-none focus-visible:ring-0 md:text-[15px]"
            />
          </div>
          {preview ? (
            <div className="relative ml-[52px] self-start overflow-hidden rounded-xl border border-border/70">
              <img src={preview} alt="Upload preview" className="max-h-[300px] object-cover" />
              <button
                type="button"
                onClick={() => onFile(null)}
                className="absolute right-2 top-2 rounded-full bg-background/80 p-1.5 text-foreground backdrop-blur-sm transition-colors hover:bg-background"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-border/70 bg-surface-2/50 px-5 py-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex h-9 items-center justify-center rounded-full p-2 text-muted-foreground hover:bg-surface hover:text-foreground"
            >
              <Camera className="h-5 w-5" />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onFile(e.target.files?.[0] ?? null)}
            />
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={submit}
              disabled={pending || (!content.trim() && !image)}
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
