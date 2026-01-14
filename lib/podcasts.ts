import Parser from 'rss-parser';
import dayjs from 'dayjs';
import fs from 'fs';
import path from 'path';
import { RECENT_DAYS_CUTOFF } from './constants';
import { DEFAULT_LANGUAGE, isLanguage, Language } from './i18n';

export interface PodcastEpisode {
  id: string;
  title: string;
  podcastName: string;
  audioUrl: string;
  coverImage?: string;
  duration?: string;
  pubDate: string;
  link?: string;
}

export interface SingleEpisode {
  title: string;
  podcastName: string;
  audioUrl: string;
  coverImage?: string;
  pubDate: string;
  duration?: string;
}

const parser = new Parser({
  timeout: 15000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/rss+xml, application/xml, text/xml, */*'
  },
  requestOptions: {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    }
  }
});

type ParsedFeed = Awaited<ReturnType<typeof parser.parseURL>>;

// Parse markdown file to extract [Name](URL) format
function getPodcastFeeds(lang: Language = DEFAULT_LANGUAGE): Array<{ name: string; url: string }> {
  try {
    const filePath = path.join(process.cwd(), 'content', lang, 'feeds.md');
    const fileContent = fs.readFileSync(filePath, 'utf-8');

    const feeds: Array<{ name: string; url: string }> = [];
    const lines = fileContent.split('\n');

    for (const line of lines) {
      const match = line.match(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/);
      if (match) {
        feeds.push({ name: match[1], url: match[2] });
      }
    }

    return feeds;
  } catch (error) {
    console.error('Error reading podcast feeds:', error);
    return [];
  }
}

// Load singles (pre-curated static episodes)
function getSingles(lang: Language = DEFAULT_LANGUAGE): SingleEpisode[] {
  try {
    const filePath = path.join(process.cwd(), 'content', lang, 'singles.json');
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.error('Error reading singles:', error);
    return [];
  }
}

// Check if episode is within the "new" window
function isWithinNewWindow(pubDate: string): boolean {
  const episodeDate = dayjs(pubDate);
  const cutoffDate = dayjs().subtract(RECENT_DAYS_CUTOFF, 'day');
  return episodeDate.isAfter(cutoffDate);
}

function shuffle<T>(items: T[]): T[] {
  return [...items].sort(() => 0.5 - Math.random());
}

export async function getRandomEpisodes(
  count: number = 3,
  timePreference: 'all' | 'new' = 'all',
  lang: string = DEFAULT_LANGUAGE
): Promise<PodcastEpisode[]> {
  const safeLang: Language = isLanguage(lang) ? lang : DEFAULT_LANGUAGE;
  const feeds = getPodcastFeeds(safeLang);
  const singles = getSingles(safeLang);

  // Helper to fetch and parse a feed (cached for this request)
  const feedCache = new Map<string, ParsedFeed>();
  const fetchFeed = async (url: string): Promise<ParsedFeed | null> => {
    if (feedCache.has(url)) return feedCache.get(url);
    try {
      const parsed = await parser.parseURL(url);
      feedCache.set(url, parsed);
      return parsed;
    } catch (error) {
      console.error(`Error parsing feed ${url}:`, error);
      return null;
    }
  };

  // Helper to convert RSS item to PodcastEpisode
  const convertItem = (item: Parser.Item, feedName: string, feedImage?: string): PodcastEpisode | null => {
    if (!item.enclosure?.url) return null;
    return {
      id: item.guid || item.link || item.enclosure.url,
      title: (item.title || 'Untitled Episode').replace(/[\r\n]+/g, ' ').trim(),
      podcastName: (feedName || 'Unknown Podcast').replace(/[\r\n]+/g, ' ').trim(),
      audioUrl: item.enclosure.url,
      coverImage: item.itunes?.image || feedImage,
      duration: item.itunes?.duration,
      pubDate: item.pubDate || new Date().toISOString(),
      link: item.link,
    };
  };

  // Helper to check time preference
  const checkTimePreference = (ep: PodcastEpisode) => {
    if (timePreference === 'all') return true;
    return isWithinNewWindow(ep.pubDate);
  };

  // Convert single to episode format
  const convertSingle = (single: SingleEpisode): PodcastEpisode => ({
    id: `single-${single.audioUrl}`,
    title: single.title,
    podcastName: single.podcastName,
    audioUrl: single.audioUrl,
    coverImage: single.coverImage,
    duration: single.duration,
    pubDate: single.pubDate,
  });

  const episodes: PodcastEpisode[] = [];
  const selectedIds = new Set<string>();

  const maxAttempts = 3;
  let attempt = 0;

  while (episodes.length < count && attempt < maxAttempts) {
    attempt += 1;

    const selectedFeeds = feeds.length > 5 ? shuffle(feeds).slice(0, 5) : feeds;
    const feedResults = await Promise.all(selectedFeeds.map(f => fetchFeed(f.url)));

    const episodesByFeed = new Map<string, PodcastEpisode[]>();
    selectedFeeds.forEach((feedInfo, index) => {
      const parsed = feedResults[index];
      if (!parsed || !parsed.items) return;
      const feedImage = parsed.image?.url || parsed.itunes?.image;
      const feedKey = feedInfo.url;

      const feedEpisodes: PodcastEpisode[] = [];
      parsed.items.forEach((item) => {
        const ep = convertItem(item, parsed.title || feedInfo.name, feedImage);
        if (ep && checkTimePreference(ep) && !selectedIds.has(ep.id)) {
          feedEpisodes.push(ep);
        }
      });

      if (feedEpisodes.length > 0) {
        episodesByFeed.set(feedKey, feedEpisodes);
      }
    });

    const eligibleSingles = singles
      .map(convertSingle)
      .filter(ep => checkTimePreference(ep) && !selectedIds.has(ep.id));

    const feedKeys = shuffle(Array.from(episodesByFeed.keys()));
    const feedSourceCount = feedKeys.length;
    let singlesTarget = 0;
    if (feedSourceCount === 0) {
      singlesTarget = Math.min(eligibleSingles.length, count);
    } else if (feedSourceCount < count) {
      const minSinglesRequired = Math.max(count - feedSourceCount, 0);
      const maxSinglesAllowed = Math.min(eligibleSingles.length, count - 1);
      const singlesFloor = Math.min(minSinglesRequired, maxSinglesAllowed);
      if (feedSourceCount === 2 && maxSinglesAllowed >= 2 && singlesFloor === 1) {
        singlesTarget = Math.random() < 0.7 ? 1 : 2;
      } else {
        singlesTarget = maxSinglesAllowed > 0
          ? Math.floor(Math.random() * (maxSinglesAllowed - singlesFloor + 1)) + singlesFloor
          : 0;
      }
    } else {
      const maxSinglesAllowed = Math.min(eligibleSingles.length, 1);
      singlesTarget = maxSinglesAllowed > 0
        ? Math.floor(Math.random() * (maxSinglesAllowed + 1))
        : 0;
    }
    let remaining = Math.max(count - singlesTarget, 0);

    for (const key of feedKeys) {
      if (remaining <= 0) break;
      const sourceEps = episodesByFeed.get(key);
      if (!sourceEps || sourceEps.length === 0) continue;

      const randIndex = Math.floor(Math.random() * sourceEps.length);
      const picked = sourceEps.splice(randIndex, 1)[0];

      episodes.push(picked);
      selectedIds.add(picked.id);
      remaining -= 1;
    }

    const availableKeys = Array.from(episodesByFeed.keys()).filter(
      key => (episodesByFeed.get(key) || []).length > 0
    );

    while (remaining > 0 && availableKeys.length > 0) {
      const keyIndex = Math.floor(Math.random() * availableKeys.length);
      const key = availableKeys[keyIndex];
      const sourceEps = episodesByFeed.get(key);
      if (!sourceEps || sourceEps.length === 0) {
        availableKeys.splice(keyIndex, 1);
        continue;
      }

      const randIndex = Math.floor(Math.random() * sourceEps.length);
      const picked = sourceEps.splice(randIndex, 1)[0];

      episodes.push(picked);
      selectedIds.add(picked.id);
      remaining -= 1;

      if (sourceEps.length === 0) {
        availableKeys.splice(keyIndex, 1);
      }
    }

    const singlesToTake = Math.min(eligibleSingles.length, count - episodes.length);

    if (singlesToTake > 0) {
      const pickedSingles = shuffle(eligibleSingles).slice(0, singlesToTake);
      pickedSingles.forEach(ep => {
        episodes.push(ep);
        selectedIds.add(ep.id);
      });
    }
  }

  if (episodes.length === 0) {
    return getFallbackEpisode();
  }

  return episodes;
}

function getFallbackEpisode(): PodcastEpisode[] {
  return [{
    id: 'fallback-1',
    title: 'Bitcoin: A Peer-to-Peer Electronic Cash System',
    podcastName: 'Satoshi Nakamoto',
    audioUrl: 'https://www.bitcoin.kn/2015/02/btck-134-2015-02-12/',
    coverImage: 'https://upload.wikimedia.org/wikipedia/commons/4/46/Bitcoin.svg',
    duration: '10:00',
    pubDate: new Date().toISOString()
  }];
}
