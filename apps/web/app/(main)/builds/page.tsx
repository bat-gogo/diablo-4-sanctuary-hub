import { getBuilds } from '@/lib/services/builds.service';
import { BuildBrowser } from '@/components/BuildBrowser';

export const metadata = {
  title: 'Builds — Sanctuary Hub',
  description: 'Browse community-curated Diablo IV builds for every class.',
};

export default async function BuildsPage() {
  const { builds, nextCursor } = await getBuilds({ limit: 24 });
  return (
    <BuildBrowser
      initialBuilds={builds}
      initialNextCursor={nextCursor}
    />
  );
}
