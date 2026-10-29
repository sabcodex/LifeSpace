import { Dashboard } from "@/components/Dashboard";
import { loadSheet } from "@/db/sheet-data";
import { getCurrentUser, isGoogleConfigured } from "@/lib/auth";
import { clampInt, todayParts } from "@/lib/dates";
import { countUnreadFeedback, isOwner } from "@/lib/feedback";
import type { TaskRecord } from "@/lib/stats";

export const dynamic = "force-dynamic";

type PageSearchParams = Promise<Record<string, string | string[] | undefined>>;

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function Page({ searchParams }: { searchParams: PageSearchParams }) {
  // Guests are welcome: the sheet works fully without an account.
  const user = await getCurrentUser();

  const params = await searchParams;
  const today = todayParts();
  const year = clampInt(firstValue(params.year), 2000, 2100, today.year);
  const month = clampInt(firstValue(params.month), 1, 12, today.month);

  // Guests (tasks: null) read this month from their browser after mount.
  let initial: { year: number; month: number; tasks: TaskRecord[] | null; done: string[] } = {
    year,
    month,
    tasks: null,
    done: [],
  };
  let loadError: string | null = null;

  if (user) {
    try {
      const data = await loadSheet(user.id, year, month);
      initial = { year, month, tasks: data.tasks, done: data.done };
    } catch (error) {
      console.error("Unable to load the organizer sheet", error);
      loadError = "The organizer could not reach PostgreSQL. Please reload in a moment.";
    }
  }

  let ownerUnread: number | null = null;
  try {
    if (await isOwner(user)) ownerUnread = await countUnreadFeedback();
  } catch (error) {
    console.error("Unable to count feedback", error);
  }

  return (
    <main className="print-shell mx-auto w-full max-w-[1560px] px-3 py-4 sm:px-5 sm:py-5">
      {loadError ? (
        <div className="mb-3 border border-red-300 bg-red-50 px-3 py-2 text-[11px] font-semibold text-red-800">
          {loadError}
        </div>
      ) : null}
      <Dashboard
        key={`${user?.id ?? "guest"}-${year}-${month}`}
        initial={initial}
        today={today.date}
        user={
          user
            ? {
                id: user.id,
                name: user.name,
                email: user.email,
                avatarUrl: user.avatarUrl,
                provider: user.provider,
              }
            : null
        }
        googleConfigured={isGoogleConfigured()}
        ownerUnread={ownerUnread}
      />
    </main>
  );
}
