'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { classImage, skillIcon } from '@sanctuary-hub/types';
import { ClassBadge } from '@/components/ClassBadge';
import { PlaystyleBadge } from '@/components/PlaystyleBadge';

const CLASSES = [
  'barbarian', 'druid', 'necromancer', 'rogue', 'sorcerer', 'spiritborn', 'paladin',
] as const;
const PLAYSTYLES = ['leveling', 'endgame', 'pit', 'helltide', 'pvp'] as const;
const SEASONS = [3, 4, 5, 6, 7];

interface Skill {
  id: string;
  name: string;
  class: string;
  type: 'active' | 'passive' | 'ultimate';
  iconSlug: string | null;
  description: string | null;
  maxRank: number;
}

interface SelectedSkill {
  skillId: string;
  rank: number;
  slot: number;
}

const MAX_SLOTS = 8;

export default function CreateBuildPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1 state
  const [title, setTitle] = useState('');
  const [klass, setKlass] = useState<string>('');
  const [season, setSeason] = useState<number>(7);
  const [playstyle, setPlaystyle] = useState<string>('');
  const [description, setDescription] = useState('');

  // Step 2 state
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loadingSkills, setLoadingSkills] = useState(false);
  const [selected, setSelected] = useState<SelectedSkill[]>([]);

  // Step 3 state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // When class changes, reload skills + reset selection.
  useEffect(() => {
    if (!klass) {
      setSkills([]);
      setSelected([]);
      return;
    }
    setLoadingSkills(true);
    fetch(`/api/skills?class=${encodeURIComponent(klass)}`)
      .then((r) => r.json())
      .then((j) => setSkills(j.data?.skills ?? []))
      .finally(() => setLoadingSkills(false));
    setSelected([]);
  }, [klass]);

  const step1Valid = title.trim().length >= 3 && klass && playstyle;
  const step2Valid = selected.length >= 1;

  const selectedById = useMemo(() => {
    const m = new Map<string, SelectedSkill>();
    for (const s of selected) m.set(s.skillId, s);
    return m;
  }, [selected]);

  function toggleSkill(skill: Skill) {
    const existing = selectedById.get(skill.id);
    if (existing) {
      setSelected((prev) => {
        const next = prev.filter((s) => s.skillId !== skill.id);
        // Re-pack slots after removal.
        return next.map((s, i) => ({ ...s, slot: i }));
      });
      return;
    }
    if (selected.length >= MAX_SLOTS) return;
    const nextSlot = selected.length;
    setSelected((prev) => [
      ...prev,
      { skillId: skill.id, rank: 1, slot: nextSlot },
    ]);
  }

  function updateRank(skillId: string, rank: number) {
    setSelected((prev) =>
      prev.map((s) => (s.skillId === skillId ? { ...s, rank } : s)),
    );
  }

  async function publish() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/builds', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description: description || undefined,
          class: klass,
          season,
          playstyle,
          skillIds: selected,
        }),
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        setError(json.error ?? 'Failed to publish build');
        return;
      }
      router.push(`/builds/${json.data.id}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <header className="mb-8">
        <p className="text-amber-500 text-xs font-bold tracking-[0.3em] uppercase">Forge</p>
        <h1 className="text-white text-4xl md:text-5xl font-black mt-1">Create build</h1>
        <p className="text-zinc-500 mt-2">Share your strategy with the wanderers of Sanctuary.</p>
      </header>

      {/* Step indicator */}
      <ol className="flex items-center justify-center gap-3 mb-10 select-none">
        {[
          { n: 1, label: 'Info' },
          { n: 2, label: 'Skills' },
          { n: 3, label: 'Review' },
        ].map(({ n, label }, i) => {
          const done = step > n;
          const current = step === n;
          return (
            <li key={n} className="flex items-center gap-3">
              <div
                className={`relative w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 ${
                  current
                    ? 'bg-amber-500 text-zinc-900 border-amber-500'
                    : done
                    ? 'bg-amber-600 text-white border-amber-600'
                    : 'bg-transparent text-zinc-500 border-zinc-700'
                }`}
              >
                {done ? '✓' : n}
              </div>
              <span className={`text-sm font-semibold ${
                current || done ? 'text-zinc-100' : 'text-zinc-500'
              }`}>
                {label}
              </span>
              {i < 2 && (
                <span className={`w-12 h-px ${done ? 'bg-amber-600' : 'bg-zinc-700'}`} />
              )}
            </li>
          );
        })}
      </ol>

      {/* STEP 1 */}
      {step === 1 && (
        <section className="flex flex-col gap-6">
          <label className="flex flex-col gap-1.5">
            <span className="text-zinc-400 text-xs uppercase tracking-wide font-semibold">
              Title
            </span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={128}
              placeholder="e.g. Whirlwind Bleed Endgame"
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white text-base focus:border-amber-500 outline-none"
            />
            <span className="text-zinc-600 text-xs">{title.length}/128 — min 3 characters</span>
          </label>

          {/* Class picker */}
          <div>
            <p className="text-zinc-400 text-xs uppercase tracking-wide font-semibold mb-3">
              Class
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              {CLASSES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setKlass(c)}
                  className={`relative rounded-xl p-3 flex flex-col items-center gap-2 transition-all border ${
                    klass === c
                      ? 'border-amber-500 bg-amber-950/40 ring-2 ring-amber-500/40'
                      : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-500'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={classImage(c)}
                    alt={c}
                    width={48}
                    height={56}
                    className="w-12 h-14 object-cover object-top rounded"
                  />
                  <span className="text-xs capitalize text-zinc-300 font-medium">{c}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Season + Playstyle */}
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_2fr] gap-6">
            <label className="flex flex-col gap-1.5">
              <span className="text-zinc-400 text-xs uppercase tracking-wide font-semibold">Season</span>
              <select
                value={season}
                onChange={(e) => setSeason(Number(e.target.value))}
                className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
              >
                {SEASONS.map((s) => (
                  <option key={s} value={s}>Season {s}</option>
                ))}
              </select>
            </label>

            <div>
              <p className="text-zinc-400 text-xs uppercase tracking-wide font-semibold mb-1.5">
                Playstyle
              </p>
              <div className="flex flex-wrap gap-2">
                {PLAYSTYLES.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPlaystyle(p)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium capitalize transition-colors border ${
                      playstyle === p
                        ? 'bg-amber-600 text-white border-amber-500'
                        : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-white hover:bg-zinc-700'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-zinc-400 text-xs uppercase tracking-wide font-semibold">
              Description <span className="text-zinc-600 normal-case">(optional)</span>
            </span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={5000}
              rows={5}
              placeholder="Describe your build, rotation, key aspects, leveling tips…"
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white text-sm focus:border-amber-500 outline-none resize-y"
            />
            <span className="text-zinc-600 text-xs">{description.length}/5000</span>
          </label>

          <div className="flex justify-end pt-4">
            <button
              type="button"
              disabled={!step1Valid}
              onClick={() => setStep(2)}
              className="bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-6 py-2.5 rounded-xl transition-colors"
            >
              Next →
            </button>
          </div>
        </section>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <section className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
          <div>
            {loadingSkills ? (
              <p className="text-zinc-500 text-center py-10">Loading {klass} skills…</p>
            ) : (
              ['active', 'passive', 'ultimate'].map((groupType) => {
                const group = skills.filter((s) => s.type === groupType);
                if (group.length === 0) return null;
                return (
                  <div key={groupType} className="mb-6">
                    <h3 className="text-zinc-400 text-xs uppercase tracking-[0.2em] font-bold mb-2">
                      {groupType}
                    </h3>
                    <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {group.map((skill) => {
                        const isSel = selectedById.has(skill.id);
                        const sel = selectedById.get(skill.id);
                        const cap =
                          skill.type === 'passive' ? 3 : skill.maxRank ?? 5;
                        return (
                          <li
                            key={skill.id}
                            className={`bg-zinc-800/70 border rounded-lg p-2.5 transition-colors ${
                              isSel
                                ? 'border-amber-500 bg-amber-950/30 ring-1 ring-amber-500/40'
                                : 'border-zinc-700 hover:border-zinc-500'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => toggleSkill(skill)}
                              className="flex items-center gap-2 w-full text-left"
                              disabled={!isSel && selected.length >= MAX_SLOTS}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={skillIcon(skill.iconSlug, skill.class, skill.type)}
                                alt=""
                                width={32}
                                height={32}
                                className="rounded shrink-0"
                              />
                              <span className="text-white text-sm font-medium flex-1 min-w-0 truncate">
                                {skill.name}
                              </span>
                              {isSel && (
                                <span className="text-amber-400 text-lg leading-none">✓</span>
                              )}
                            </button>
                            {isSel && sel && (
                              <div className="mt-2 flex items-center gap-2">
                                <span className="text-[10px] uppercase tracking-wide text-zinc-500 font-semibold">
                                  Rank
                                </span>
                                <input
                                  type="range"
                                  min={1}
                                  max={cap}
                                  value={sel.rank}
                                  onChange={(e) =>
                                    updateRank(skill.id, Number(e.target.value))
                                  }
                                  className="flex-1 accent-amber-500"
                                />
                                <span className="text-amber-400 text-xs font-mono tabular-nums w-6 text-right">
                                  {sel.rank}/{cap}
                                </span>
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })
            )}
          </div>

          {/* Slots sidebar */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-4">
              <p className="text-zinc-400 text-xs uppercase tracking-wide font-semibold mb-3">
                Skill bar ({selected.length}/{MAX_SLOTS})
              </p>
              <ul className="grid grid-cols-4 gap-2">
                {Array.from({ length: MAX_SLOTS }).map((_, i) => {
                  const sel = selected.find((s) => s.slot === i);
                  const skill = sel ? skills.find((sk) => sk.id === sel.skillId) : null;
                  return (
                    <li
                      key={i}
                      className={`aspect-square rounded-lg flex items-center justify-center text-zinc-500 ${
                        skill
                          ? 'bg-zinc-800 border border-amber-700/60'
                          : 'bg-zinc-800/30 border border-dashed border-zinc-700'
                      }`}
                    >
                      {skill ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={skillIcon(skill.iconSlug, skill.class, skill.type)}
                          alt={skill.name}
                          className="w-9 h-9"
                        />
                      ) : (
                        <span className="text-xs">{i + 1}</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </aside>

          {/* Bottom nav */}
          <div className="lg:col-span-2 flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-zinc-400 hover:text-white px-4 py-2"
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              disabled={!step2Valid}
              className="bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-6 py-2.5 rounded-xl transition-colors"
            >
              Next →
            </button>
          </div>
        </section>
      )}

      {/* STEP 3 */}
      {step === 3 && (
        <section className="flex flex-col gap-6">
          <h2 className="text-white text-xl font-bold">Review & Publish</h2>

          {/* Preview card */}
          <div
            className="relative overflow-hidden rounded-xl bg-zinc-800/80 border border-zinc-700 p-6 min-h-[260px]"
          >
            <div
              className="absolute inset-0 bg-cover bg-top opacity-25"
              style={{ backgroundImage: `url(${classImage(klass)})` }}
              aria-hidden
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/85 to-zinc-900/50" aria-hidden />
            <div className="relative z-10 flex flex-col gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <ClassBadge d4Class={klass} size="md" />
                <PlaystyleBadge playstyle={playstyle} />
                <span className="text-xs font-bold px-2 py-1 rounded bg-amber-900/60 text-amber-300 border border-amber-800/50">
                  S{season}
                </span>
              </div>
              <h3 className="text-white text-3xl font-black">{title || '(Untitled build)'}</h3>
              {description && (
                <p className="text-zinc-300 text-sm whitespace-pre-line line-clamp-4">
                  {description}
                </p>
              )}
              <div className="mt-2">
                <p className="text-zinc-500 text-xs uppercase tracking-wide font-semibold mb-2">
                  {selected.length} skill{selected.length === 1 ? '' : 's'}
                </p>
                <ul className="flex flex-wrap gap-2">
                  {selected.map((sel) => {
                    const skill = skills.find((sk) => sk.id === sel.skillId);
                    if (!skill) return null;
                    return (
                      <li
                        key={sel.skillId}
                        className="inline-flex items-center gap-1.5 bg-zinc-800/80 border border-zinc-700 rounded-md px-2 py-1 text-xs text-zinc-200"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={skillIcon(skill.iconSlug, skill.class, skill.type)}
                          alt=""
                          className="w-5 h-5"
                        />
                        <span>{skill.name}</span>
                        <span className="text-amber-400 font-mono">R{sel.rank}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-950/40 border border-red-900/50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="text-zinc-400 hover:text-white px-4 py-2"
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={publish}
              disabled={submitting}
              className="bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl transition-colors inline-flex items-center gap-2"
            >
              {submitting && (
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
                  <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
              )}
              {submitting ? 'Publishing…' : 'Publish build'}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
