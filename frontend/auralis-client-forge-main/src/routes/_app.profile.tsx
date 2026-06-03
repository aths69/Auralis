import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api, type User } from "@/lib/api";
import { ProfileView } from "@/components/auralis/ProfileView";
import { ErrorState } from "@/components/auralis/States";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_app/profile")({
  head: () => ({
    meta: [{ title: "Your profile · Auralis" }],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user: authUser } = useAuth();
  const q = useQuery({
    queryKey: ["profile", "me"],
    queryFn: () => api<User>("/profile/"),
    initialData: authUser ?? undefined,
  });

  if (q.isLoading && !q.data) {
    return <div className="px-1 pt-6 text-sm text-muted-foreground">Loading…</div>;
  }
  if (q.isError && !q.data) {
    return <ErrorState message={(q.error as Error).message} onRetry={() => q.refetch()} />;
  }
  if (!q.data) return null;
  return <ProfileView user={q.data} isSelf />;
}
