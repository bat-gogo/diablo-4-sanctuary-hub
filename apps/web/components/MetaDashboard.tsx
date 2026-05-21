'use client';

import Link from 'next/link';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ClassBadge } from './ClassBadge';

const CLASS_COLOR: Record<string, string> = {
  barbarian: '#ef4444',
  druid: '#22c55e',
  necromancer: '#a855f7',
  rogue: '#eab308',
  sorcerer: '#3b82f6',
  spiritborn: '#14b8a6',
  paladin: '#f59e0b',
  warlock: '#64748b',
};

const PLAYSTYLE_COLOR: Record<string, string> = {
  leveling: '#6b7280',
  endgame: '#f97316',
  pit: '#ef4444',
  helltide: '#e11d48',
  pvp: '#8b5cf6',
};

interface DashData {
  classDist: { class: string; count: number }[];
  playstyleDist: { playstyle: string; count: number }[];
  seasonDist: { season: number; count: number }[];
  topBuilds: { id: string; title: string; class: string; views: number; voteScore: number }[];
  activity: { date: string; count: number }[];
  voteDist: { value: number; count: number }[];
  totals: { users: number; builds: number; votes: number };
}

export function MetaDashboard({ data }: { data: DashData }) {
  const upvotes = data.voteDist.find((v) => v.value === 1)?.count ?? 0;
  const downvotes = data.voteDist.find((v) => v.value === -1)?.count ?? 0;
  const totalVotes = upvotes + downvotes;
  const positivePct = totalVotes > 0 ? Math.round((upvotes / totalVotes) * 100) : 0;
  const topClass = data.classDist[0]?.class ?? '—';

  // Activity: keep last 30 entries to match the spec "last 30 days" feel.
  const activitySlice = data.activity.slice(-30);

  return (
    <div>
      {/* HERO */}
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
            Sanctuary Telemetry
          </p>
          <h1 className="text-white text-4xl md:text-5xl font-black mt-1">
            Meta Statistics
          </h1>
          <p className="text-zinc-500 text-sm mt-2">
            Season 7 · Community data, live from Postgres.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-10 flex flex-col gap-8">
        {/* SUMMARY ROW */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Total builds"        value={data.totals.builds.toLocaleString()} />
          <Stat label="Players"              value={data.totals.users.toLocaleString()} />
          <Stat label="Total votes cast"     value={data.totals.votes.toLocaleString()} />
          <Stat
            label="Most popular class"
            value={topClass}
            valueClassName="capitalize"
          />
        </section>

        {/* ROW 1 — class + playstyle */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card title="Class popularity">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={data.classDist.map((d) => ({
                  ...d,
                  pct: data.totals.builds > 0 ? (d.count / data.totals.builds) * 100 : 0,
                }))}
                layout="vertical"
                margin={{ left: 12, right: 24 }}
              >
                <CartesianGrid stroke="#27272a" strokeDasharray="3 3" />
                <XAxis type="number" stroke="#71717a" fontSize={11} />
                <YAxis
                  type="category"
                  dataKey="class"
                  stroke="#a1a1aa"
                  fontSize={12}
                  tickFormatter={(v) => v.charAt(0).toUpperCase() + v.slice(1)}
                />
                <Tooltip
                  contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }}
                  labelStyle={{ color: '#fff', textTransform: 'capitalize' }}
                  formatter={(v, _name, props) => {
                    const payload = (props as { payload?: { pct?: number } } | undefined)?.payload;
                    const p = payload?.pct ?? 0;
                    return [`${Number(v ?? 0)} builds (${p.toFixed(1)}%)`, 'Builds'];
                  }}
                />
                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                  {data.classDist.map((d, i) => (
                    <Cell key={i} fill={CLASS_COLOR[d.class] ?? '#71717a'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card title="Playstyle distribution">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.playstyleDist}
                  dataKey="count"
                  nameKey="playstyle"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                >
                  {data.playstyleDist.map((d, i) => (
                    <Cell key={i} fill={PLAYSTYLE_COLOR[d.playstyle] ?? '#71717a'} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }}
                  labelStyle={{ color: '#fff', textTransform: 'capitalize' }}
                  formatter={(v) => [`${v} builds`, 'count']}
                />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ fontSize: 12, color: '#a1a1aa', textTransform: 'capitalize' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </section>

        {/* ROW 2 — activity */}
        <section>
          <Card title="Build activity — last 30 entries">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={activitySlice}>
                <CartesianGrid stroke="#27272a" strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  stroke="#71717a"
                  fontSize={10}
                  tickFormatter={(s: string) => {
                    const d = new Date(s);
                    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
                  }}
                />
                <YAxis stroke="#71717a" fontSize={11} />
                <Tooltip
                  contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }}
                  labelStyle={{ color: '#fff' }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 5, fill: '#fbbf24' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </section>

        {/* ROW 3 — seasons + sentiment */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card title="Builds per season">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.seasonDist}>
                <CartesianGrid stroke="#27272a" strokeDasharray="3 3" />
                <XAxis
                  dataKey="season"
                  stroke="#a1a1aa"
                  fontSize={12}
                  tickFormatter={(s) => `S${s}`}
                />
                <YAxis stroke="#71717a" fontSize={11} />
                <Tooltip
                  contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }}
                  labelStyle={{ color: '#fff' }}
                  formatter={(v) => [`${v} builds`, 'count']}
                  labelFormatter={(s) => `Season ${s}`}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {data.seasonDist.map((d, i) => (
                    <Cell key={i} fill={d.season === 7 ? '#fbbf24' : '#a16207'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card title="Community sentiment">
            <div className="flex flex-col gap-4 h-[250px] justify-center px-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-900/30 border border-green-800/50 rounded-xl p-4 text-center">
                  <p className="text-green-300 text-xs uppercase tracking-wide font-semibold">▲ Upvotes</p>
                  <p className="text-green-400 text-3xl font-black tabular-nums">{upvotes.toLocaleString()}</p>
                </div>
                <div className="bg-red-900/30 border border-red-800/50 rounded-xl p-4 text-center">
                  <p className="text-red-300 text-xs uppercase tracking-wide font-semibold">▼ Downvotes</p>
                  <p className="text-red-400 text-3xl font-black tabular-nums">{downvotes.toLocaleString()}</p>
                </div>
              </div>
              <div>
                <div className="h-3 w-full bg-zinc-800 rounded-full overflow-hidden flex">
                  <div
                    className="bg-green-500 h-full"
                    style={{ width: `${positivePct}%` }}
                  />
                  <div
                    className="bg-red-500 h-full"
                    style={{ width: `${100 - positivePct}%` }}
                  />
                </div>
                <p className="text-zinc-300 text-sm text-center mt-2">
                  <span className="text-amber-400 font-bold">{positivePct}%</span> positive sentiment
                </p>
              </div>
            </div>
          </Card>
        </section>

        {/* ROW 4 — leaderboard */}
        <Card title="Top 10 builds by community score">
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-sm">
              <thead className="text-zinc-500">
                <tr>
                  <th className="px-3 py-2 text-left text-xs uppercase tracking-wide font-semibold">#</th>
                  <th className="px-3 py-2 text-left text-xs uppercase tracking-wide font-semibold">Title</th>
                  <th className="px-3 py-2 text-left text-xs uppercase tracking-wide font-semibold">Class</th>
                  <th className="px-3 py-2 text-right text-xs uppercase tracking-wide font-semibold">Score</th>
                  <th className="px-3 py-2 text-right text-xs uppercase tracking-wide font-semibold">Views</th>
                </tr>
              </thead>
              <tbody>
                {data.topBuilds.map((b, idx) => {
                  const podiumBg =
                    idx === 0 ? 'bg-amber-900/30' :
                    idx === 1 ? 'bg-zinc-700/40' :
                    idx === 2 ? 'bg-orange-900/30' : '';
                  return (
                    <tr key={b.id} className={`border-t border-zinc-800 ${podiumBg} hover:bg-zinc-900/40 transition-colors`}>
                      <td className="px-3 py-2.5 font-mono text-zinc-400 tabular-nums">{idx + 1}</td>
                      <td className="px-3 py-2.5">
                        <Link
                          href={`/builds/${b.id}`}
                          className="text-white hover:text-amber-300 font-medium truncate inline-block max-w-[260px]"
                        >
                          {b.title}
                        </Link>
                      </td>
                      <td className="px-3 py-2.5">
                        <ClassBadge d4Class={b.class} size="sm" />
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <span className={`font-bold tabular-nums ${
                          b.voteScore > 0 ? 'text-green-400' : b.voteScore < 0 ? 'text-red-400' : 'text-zinc-400'
                        }`}>
                          {b.voteScore > 0 ? '+' : ''}{b.voteScore}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right text-zinc-300 tabular-nums">
                        {b.views.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  valueClassName = '',
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="bg-zinc-800/60 border border-zinc-800 rounded-xl p-4">
      <p className="text-zinc-500 text-xs uppercase tracking-wide font-semibold">
        {label}
      </p>
      <p className={`text-amber-400 text-2xl md:text-3xl font-black mt-1 tabular-nums ${valueClassName}`}>
        {value}
      </p>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 md:p-5">
      <h3 className="text-white text-base md:text-lg font-bold mb-3">{title}</h3>
      {children}
    </div>
  );
}
