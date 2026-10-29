import Link from "next/link";
import { FeedbackInbox } from "@/components/FeedbackInbox";
import { getCurrentUser } from "@/lib/auth";
import { isOwner, listFeedback } from "@/lib/feedback";

export const dynamic = "force-dynamic";

export default async function FeedbackPage() {
  const user = await getCurrentUser();
  const owner = await isOwner(user);

  if (!owner) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="sheet-card w-full max-w-[400px] px-5 py-6 text-center">
          <p className="text-[13px] font-bold text-[#22312e]">Feedback inbox</p>
          <p className="mt-2 text-[11px] leading-relaxed text-sheet-muted">
            {user
              ? "Only the website owner can read feedback."
              : "Sign in with the owner account to read feedback."}
          </p>
          <Link
            href="/"
            className="mt-4 inline-flex items-center border border-sheet-teal-dark bg-sheet-teal px-4 py-1.5 text-[11px] font-bold text-white hover:bg-sheet-teal-dark"
          >
            Back to the sheet
          </Link>
        </div>
      </main>
    );
  }

  const items = await listFeedback();
  return (
    <main className="mx-auto w-full max-w-[920px] px-3 py-5 sm:px-5">
      <FeedbackInbox
        initialItems={items.map((item) => ({
          id: item.id,
          name: item.name,
          email: item.email,
          category: item.category,
          rating: item.rating,
          message: item.message,
          read: item.readAt !== null,
          createdAt: item.createdAt.toISOString(),
        }))}
      />
    </main>
  );
}
