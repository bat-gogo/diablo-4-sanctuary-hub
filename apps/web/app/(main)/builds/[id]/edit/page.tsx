import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { verifyToken } from '@/lib/auth';
import { getBuildById } from '@/lib/services/builds.service';
import { EditBuildForm } from '@/components/EditBuildForm';

export const metadata = { title: 'Edit build — Sanctuary Hub' };

export default async function EditBuildPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const token = (await cookies()).get('token')?.value ?? null;
  const payload = token ? await verifyToken(token) : null;
  if (!payload) redirect('/login');

  const build = await getBuildById(id);
  if (!build) notFound();

  const isOwner = build.user.id === payload.userId;
  const isAdmin = payload.role === 'admin';
  if (!isOwner && !isAdmin) redirect(`/builds/${id}`);

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <header className="mb-8">
        <p className="text-amber-500 text-xs font-bold tracking-[0.3em] uppercase">
          Edit build
        </p>
        <h1 className="text-white text-3xl md:text-4xl font-black mt-1">
          {build.title}
        </h1>
        <p className="text-zinc-500 text-sm mt-2">
          You can update title, description, season, and playstyle. Class and
          skill kit are locked — delete + recreate the build to change those.
        </p>
      </header>
      <EditBuildForm
        build={{
          id: build.id,
          title: build.title,
          description: build.description,
          class: build.class,
          season: build.season,
          playstyle: build.playstyle,
        }}
      />
    </div>
  );
}
