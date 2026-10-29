import { Dashboard } from "@/components/Dashboard";
import { clampInt, todayParts } from "@/lib/dates";

export const dynamic = "force-dynamic";

type PageSearchParams = Promise<Record<string, string | string[] | undefined>>;

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function Page({ searchParams }: { searchParams: PageSearchParams }) {
  const params = await searchParams;
  const today = todayParts();
  const year = clampInt(firstValue(params.year), 2000, 2100, today.year);
  const month = clampInt(firstValue(params.month), 1, 12, today.month);

  return (
    <main className="print-shell mx-auto w-full max-w-[1560px] px-3 py-4 sm:px-5 sm:py-5">
      <Dashboard
        key={`${year}-${month}`}
        initial={{ year, month, tasks: null, done: [] }}
        today={today.date}
        ownerUnread={null}
      />
    </main>
  );
}
