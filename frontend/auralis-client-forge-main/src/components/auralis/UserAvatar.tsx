import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { User } from "@/lib/api";
import { getImageUrl } from "@/lib/api";

export function UserAvatar({
  user,
  className,
  size = 40,
}: {
  user?: Pick<User, "username" | "avatar_url"> | null;
  className?: string;
  size?: number;
}) {
  return (
    <Avatar
      className={cn("ring-1 ring-border/70", className)}
      style={{ width: size, height: size }}
    >
      {user?.avatar_url ? <AvatarImage src={getImageUrl(user.avatar_url)} alt={user.username} /> : null}
      <AvatarFallback className="bg-surface-2 text-[0.75em] font-medium text-muted-foreground">
        {initials(user?.username)}
      </AvatarFallback>
    </Avatar>
  );
}
