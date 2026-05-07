"use client";

import Link from "next/link";
import { observer } from "mobx-react-lite";
import type { AppLocale } from "@/constants/locale";
import { useMakeupArtistDirectoryPage } from "@/features/makeup/hooks/useMakeupArtistDirectoryPage";

interface MakeupArtistDirectoryPageProps {
  locale: AppLocale;
}

export const MakeupArtistDirectoryPage = observer(function MakeupArtistDirectoryPage({
  locale,
}: MakeupArtistDirectoryPageProps) {
  const model = useMakeupArtistDirectoryPage(locale);

  if (!model.canAccess) {
    return null;
  }

  if (!model.query.data && model.query.isLoading) {
    return (
      <section className="animate-fade-in rounded-3xl border border-border bg-card p-6 shadow-md">
        <p className="text-sm text-muted-foreground">{model.copy.loading}</p>
      </section>
    );
  }

  if (!model.query.data && model.query.isError) {
    return (
      <section className="animate-fade-in space-y-3 rounded-3xl border border-destructive/40 bg-destructive/10 p-6 shadow-md">
        <p className="text-sm text-destructive">{model.copy.loadError}</p>
        <button
          type="button"
          onClick={() => void model.query.refetch()}
          className="rounded-lg border border-destructive/30 bg-background px-3 py-1.5 text-xs font-semibold text-foreground"
        >
          {model.copy.retryAction}
        </button>
      </section>
    );
  }

  return (
    <section className="animate-fade-in space-y-5">
      <header className="rounded-3xl border border-border bg-card p-5 shadow-md md:p-6">
        <h1 className="text-2xl font-bold text-foreground">{model.copy.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{model.copy.subtitle}</p>
      </header>

      <section className="space-y-2 rounded-3xl border border-border bg-card p-4 shadow-sm md:p-5">
        {model.artists.length === 0 ? (
          <p className="text-sm text-muted-foreground">{model.copy.noData}</p>
        ) : (
          model.artists.map((artist) => (
            <article key={artist.profileId} className="rounded-2xl border border-border bg-muted/10 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {artist.fullName ?? artist.profileId}
                  </p>
                  <p className="text-xs text-muted-foreground">{artist.email ?? "-"}</p>
                </div>
                <Link
                  href={`/${locale}/makeup/artists/${artist.profileId}`}
                  className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground"
                >
                  {model.copy.openSchedule}
                </Link>
              </div>
            </article>
          ))
        )}
      </section>
    </section>
  );
});
