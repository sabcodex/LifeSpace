import { redirect } from "next/navigation";
import { AuthPageClient } from "@/components/AuthPageClient";
import { getCurrentUser, isGoogleConfigured } from "@/lib/auth";

export const dynamic = "force-dynamic";

type PageSearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function LoginPage({ searchParams }: { searchParams: PageSearchParams }) {
  const user = await getCurrentUser();
  if (user) redirect("/");

  const params = await searchParams;
  const rawError = params.error;
  const error = Array.isArray(rawError) ? rawError[0] : rawError;

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <AuthPageClient googleConfigured={isGoogleConfigured()} initialError={error} />
    </main>
  );
}
