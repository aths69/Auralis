import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api, type User } from "@/lib/api";
import { ProfileView } from "@/components/auralis/ProfileView";
import { ErrorState } from "@/components/auralis/States";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_app/u/$userId")({
  head: ({ params }) => ({
    meta: [{ title: `@${params.userId} · Auralis` }],
  }),
  component: PublicProfilePage,
});

function PublicProfilePage() {
  const { userId } = Route.useParams();
  const { user: me } = useAuth();
  const q = useQuery({
    queryKey: ["profile", userId],
    queryFn: () => api<User>(`/profile/${userId}`),
  });

  if (q.isLoading) {
    return <div className="px-1 pt-6 text-sm text-muted-foreground">Loading…</div>;
  }
  if (q.isError) {
    return <ErrorState message={(q.error as Error).message} onRetry={() => q.refetch()} />;
  }
  if (!q.data) return null;
  return <ProfileView user={q.data} isSelf={me?.id === q.data.id} />;
}
