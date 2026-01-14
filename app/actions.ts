'use server'

import { getRandomEpisodes, PodcastEpisode } from '@/lib/podcasts';
import { DEFAULT_LANGUAGE, isLanguage } from '@/lib/i18n';

export async function fetchNewEpisodes(
    timePreference: 'all' | 'new' = 'all',
    lang: string = DEFAULT_LANGUAGE
): Promise<PodcastEpisode[]> {
    const safeLang = isLanguage(lang) ? lang : DEFAULT_LANGUAGE;
    return await getRandomEpisodes(3, timePreference, safeLang);
}
