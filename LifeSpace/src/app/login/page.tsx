import { redirect } from "next/navigation";
import { AuthPageClient } from "@/components/AuthPageClient";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/");

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <AuthPageClient />
    </main>
  );
}
