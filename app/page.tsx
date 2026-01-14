import RadioTuner from '@/components/RadioTuner';
import { getRandomEpisodes } from '@/lib/podcasts';
import { Metadata } from 'next';
import { headers } from 'next/headers';
import { Language } from '@/lib/i18n';

export const metadata: Metadata = {
  title: 'BitcoinFM - The Sound of Sound Money',
  description: 'Curated accidental discovery of Bitcoin signal.',
};

const SUPPORTED_LANGS: Language[] = ['zh', 'en', 'ja', 'es', 'de', 'pt', 'fr'];

function normalizeLanguageTag(tag: string): Language | null {
  const primary = tag.split('-')[0]?.trim();
  if (!primary) return null;
  return (SUPPORTED_LANGS as readonly string[]).includes(primary) ? (primary as Language) : null;
}

function detectLanguage(header: string): Language {
  if (!header) return 'en';
  const candidates = header.split(',').map((part, index) => {
    const [langPart, qPart] = part.trim().split(';');
    const q = qPart?.trim().startsWith('q=')
      ? Number(qPart.trim().slice(2))
      : 1;
    return { lang: langPart.trim().toLowerCase(), q: Number.isNaN(q) ? 0 : q, index };
  });

  const sorted = candidates.sort((a, b) => {
    if (b.q !== a.q) return b.q - a.q;
    return a.index - b.index;
  });

  for (const candidate of sorted) {
    const normalized = normalizeLanguageTag(candidate.lang);
    if (normalized) return normalized;
  }

  return 'en';
}

// Force dynamic rendering so we get new random episodes on initial load if we want server-side randomness
export const dynamic = 'force-dynamic';

export default async function Home() {
  const headersList = await headers();
  const acceptLanguage = headersList.get('accept-language') || '';

  const lang = detectLanguage(acceptLanguage);

  // Fetch initial 3 episodes on the server
  const initialEpisodes = await getRandomEpisodes(3, 'all', lang);

  return (
    <RadioTuner initialEpisodes={initialEpisodes} initialLang={lang} />
  );
}
