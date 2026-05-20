import {
  assetUrl,
  ASSETS,
  itemTypeIcon,
  uniqueItemIcon,
} from '@sanctuary-hub/types';
import { getItems } from '@/lib/services/items.service';
import { ClassBadge } from '@/components/ClassBadge';

export const metadata = { title: 'Items — Sanctuary Hub' };

export default async function ItemsPage() {
  // For now just render the unique + mythic items — they're the visually
  // interesting ones (real D4 inventory icons from R2).
  const { items: uniques } = await getItems({ isUnique: true, limit: 50 });

  const mythics = uniques.filter((i) => i.isMythic);
  const onlyUniques = uniques.filter((i) => !i.isMythic);

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <header className="mb-10">
        <p className="text-amber-500 text-xs font-bold tracking-[0.3em] uppercase">
          Codex
        </p>
        <h1 className="text-white text-4xl md:text-5xl font-black mt-1">
          Items
        </h1>
        <p className="text-zinc-500 mt-2 max-w-2xl">
          Mythic and unique gear of Sanctuary — real in-game inventory icons
          sourced from the Fandom wiki.
        </p>
      </header>

      <section className="mb-12">
        <h2 className="text-white text-2xl font-bold mb-4 flex items-center gap-2">
          <span className="text-amber-400">✦</span> Mythic
          <span className="text-zinc-500 text-sm font-normal">
            ({mythics.length})
          </span>
        </h2>
        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {mythics.map((it) => (
            <ItemCard
              key={it.id}
              name={it.name}
              type={it.type}
              classRestriction={it.classRestriction}
              isMythic={it.isMythic}
              isUnique={it.isUnique}
              requiredLevel={it.requiredLevel}
            />
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-white text-2xl font-bold mb-4 flex items-center gap-2">
          <span className="text-orange-400">★</span> Unique
          <span className="text-zinc-500 text-sm font-normal">
            ({onlyUniques.length})
          </span>
        </h2>
        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {onlyUniques.map((it) => (
            <ItemCard
              key={it.id}
              name={it.name}
              type={it.type}
              classRestriction={it.classRestriction}
              isMythic={it.isMythic}
              isUnique={it.isUnique}
              requiredLevel={it.requiredLevel}
            />
          ))}
        </ul>
      </section>
    </div>
  );
}

interface ItemCardProps {
  name: string;
  type: string;
  classRestriction: string | null;
  isMythic: boolean;
  isUnique: boolean;
  requiredLevel: number;
}

function ItemCard({
  name,
  type,
  classRestriction,
  isMythic,
  isUnique,
  requiredLevel,
}: ItemCardProps) {
  // Real D4 inventory icon when we have one; type icon otherwise.
  const src = uniqueItemIcon(name, type, isMythic);
  const hasRealArt = src !== assetUrl(itemTypeIcon(type, isMythic, isUnique));

  const border = isMythic
    ? 'border-amber-500/50 from-amber-950/30'
    : 'border-orange-500/40 from-orange-950/20';

  return (
    <li
      className={`relative bg-zinc-900/80 rounded-xl border ${border} bg-gradient-to-b to-zinc-900 p-3 flex flex-col items-center gap-2 hover:scale-[1.03] transition-transform group`}
    >
      {isMythic && (
        <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-zinc-900 tracking-widest">
          MYTHIC
        </span>
      )}
      <div
        className={`relative w-16 h-16 rounded-lg ${
          isMythic
            ? 'bg-amber-950/40 border border-amber-700/60'
            : 'bg-orange-950/30 border border-orange-800/50'
        } flex items-center justify-center overflow-hidden`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={name}
          className="max-w-full max-h-full"
          style={
            !hasRealArt
              ? {
                  filter: isMythic
                    ? 'invert(80%) sepia(60%) saturate(700%) hue-rotate(10deg)'
                    : 'invert(65%) sepia(70%) saturate(500%) hue-rotate(0deg)',
                  width: 40,
                  height: 40,
                }
              : undefined
          }
        />
      </div>
      <p
        className={`text-center text-sm font-semibold leading-tight ${
          isMythic ? 'text-amber-300' : 'text-orange-300'
        }`}
      >
        {name}
      </p>
      <div className="flex flex-col items-center gap-1 text-xs text-zinc-500">
        <span className="capitalize">{type}</span>
        <span>Lvl {requiredLevel}</span>
        {classRestriction && (
          <ClassBadge d4Class={classRestriction} size="sm" />
        )}
      </div>
    </li>
  );
}
