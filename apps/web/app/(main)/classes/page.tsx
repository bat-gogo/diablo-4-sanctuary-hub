import Image from 'next/image';
import Link from 'next/link';
import { classImage } from '@sanctuary-hub/types';
import { CLASS_ORDER, CLASS_TAGLINE } from '@/lib/classLore';
import { ClassBadge } from '@/components/ClassBadge';

export const metadata = { title: 'Classes — Sanctuary Hub' };

export default function ClassesIndexPage() {
  return (
    <div>
      <section className="relative overflow-hidden border-b border-zinc-800">
        <div
          className="absolute inset-0 opacity-80"
          style={{
            background:
              'radial-gradient(ellipse at top, rgba(245,158,11,0.18) 0%, transparent 60%), linear-gradient(180deg, rgba(24,24,27,0.5), rgba(9,9,11,1))',
          }}
          aria-hidden
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 py-10">
          <p className="text-amber-500 text-xs font-bold tracking-[0.3em] uppercase">
            Choose your path
          </p>
          <h1 className="text-white text-4xl md:text-5xl font-black mt-1">
            Classes
          </h1>
          <p className="text-zinc-500 mt-2 max-w-2xl">
            Eight classes walk Sanctuary today. Step into any of them — every
            page is hand-crafted lore + the community's top builds + the full
            skill kit.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-10">
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {CLASS_ORDER.map((c) => (
            <li key={c}>
              <Link
                href={`/classes/${c}`}
                className="group relative block aspect-[2/3] rounded-2xl overflow-hidden border border-zinc-800 hover:border-amber-500/50 transition-colors"
              >
                <Image
                  src={classImage(c)}
                  alt={c}
                  fill
                  sizes="(min-width: 1024px) 24vw, (min-width: 640px) 48vw, 100vw"
                  className="object-cover object-top transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4 flex flex-col gap-1.5">
                  <ClassBadge d4Class={c} size="sm" />
                  <h2 className="text-white text-2xl font-black capitalize leading-tight">
                    {c}
                  </h2>
                  <p className="text-zinc-300 text-xs italic line-clamp-2">
                    {CLASS_TAGLINE[c]}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
