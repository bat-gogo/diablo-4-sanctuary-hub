import Link from 'next/link';
import { assetUrl, ASSETS } from '@sanctuary-hub/types';
import { getFeaturedBuilds } from '@/lib/services/builds.service';
import { getPartyRequests } from '@/lib/services/party.service';
import { BuildCard } from '@/components/BuildCard';
import { PartyCard } from '@/components/PartyCard';
import { EventTracker } from '@/components/EventTracker';
import { FadeIn } from '@/components/MotionWrapper';

export default async function HomePage() {
  const [featured, parties] = await Promise.all([
    getFeaturedBuilds(6),
    getPartyRequests({ status: 'open', limit: 4 }),
  ]);

  // Use the Rogue key art as the hero backdrop — large, atmospheric, real
  // Blizzard concept art uploaded to R2 at classes/rogue.webp.
  const heroBg = assetUrl(ASSETS.classes.rogue);

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden bg-zinc-900 min-h-[600px] md:min-h-screen flex items-center justify-center px-4">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroBg})` }}
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/80 via-zinc-950/70 to-zinc-950" aria-hidden />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(245,158,11,0.15) 0%, transparent 60%)',
          }}
          aria-hidden
        />

        <div className="relative z-10 max-w-4xl text-center flex flex-col items-center gap-6">
          <span className="text-amber-500 text-sm font-bold tracking-[0.3em] uppercase">
            ⚔ Sanctuary Hub
          </span>
          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight leading-[1.05]">
            The Diablo IV<br />
            <span className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 bg-clip-text text-transparent">
              Community Hub
            </span>
          </h1>
          <p className="text-zinc-400 text-lg md:text-xl max-w-2xl">
            Builds · Party Finder · Live Event Tracker — everything a Wanderer of Sanctuary needs in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <Link
              href="/builds"
              className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-8 py-3 rounded-xl shadow-lg shadow-amber-600/30 hover:shadow-amber-500/40 transition-all hover:scale-105"
            >
              Browse Builds →
            </Link>
            <Link
              href="/party"
              className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold px-8 py-3 rounded-xl border border-zinc-700 transition-all hover:scale-105"
            >
              Find Party
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce z-10" aria-hidden>
          <svg className="w-6 h-6 text-amber-500/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-16 flex flex-col gap-16">
        {/* LIVE EVENTS */}
        <FadeIn>
        <section>
          <div className="flex items-baseline justify-between mb-6">
            <h2 className="text-white text-2xl md:text-3xl font-bold tracking-tight">
              <span className="text-amber-500">⚡</span> Live Events
            </h2>
            <p className="text-zinc-500 text-xs hidden sm:block">Updates every second</p>
          </div>
          <EventTracker />
        </section>
        </FadeIn>

        {/* FEATURED BUILDS */}
        <FadeIn delay={0.05}>
        <section>
          <div className="flex items-baseline justify-between mb-6">
            <h2 className="text-white text-2xl md:text-3xl font-bold tracking-tight">
              <span className="text-amber-500">★</span> Featured Builds
            </h2>
            <Link
              href="/builds"
              className="text-amber-400 hover:text-amber-300 text-sm font-medium transition-colors"
            >
              View all →
            </Link>
          </div>
          {featured.length === 0 ? (
            <div className="bg-zinc-800/50 border border-zinc-800 rounded-xl p-12 text-center text-zinc-500">
              No featured builds yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {featured.map((b) => (
                <BuildCard key={b.id} build={b} />
              ))}
            </div>
          )}
        </section>
        </FadeIn>

        {/* ACTIVE PARTIES */}
        <FadeIn delay={0.1}>
        <section>
          <div className="flex items-baseline justify-between mb-6">
            <h2 className="text-white text-2xl md:text-3xl font-bold tracking-tight">
              <span className="text-amber-500">👥</span> Looking for Group
            </h2>
            <Link
              href="/party"
              className="text-amber-400 hover:text-amber-300 text-sm font-medium transition-colors"
            >
              View all →
            </Link>
          </div>
          {parties.requests.length === 0 ? (
            <div className="bg-zinc-800/50 border border-zinc-800 rounded-xl p-12 text-center text-zinc-500">
              No open parties right now.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {parties.requests.map((r) => (
                <PartyCard key={r.id} request={r} />
              ))}
            </div>
          )}
        </section>
        </FadeIn>
      </div>
    </div>
  );
}
