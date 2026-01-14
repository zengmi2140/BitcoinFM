# Bitcoin FM

Bitcoin FM is a minimalist, web-based Bitcoin podcast radio. No subscriptions, no search, no recommendation algorithms. It keeps only **entropy**, **time preference**, and **immersive listening**: open the site and it draws three episodes at random, like scanning the dial and drifting through signal.

---

## Features

- **Entropy Engine**: randomly selects three sources from a mixed pool of whitelisted RSS feeds and curated singles. The goal is a "blind box" experience without collapsing diversity.
- **Time Preference toggle (All / New)**:
  - **All (default)**: sample from the full archive, including deep, timeless classics.
  - **New**: sample only from the last **180 days**, keeping the feed closer to the present.
- **Global sticky player**: reseeding the list does not interrupt what is currently playing.
- **OS-level media control**: supports the `Media Session API` (lock screen / headset controls for play, pause, seek).
- **Multilingual pool**: first visit uses browser `accept-language`; users can switch languages and the choice persists in `localStorage`.
- **Privacy-first**: no tracking, no accounts. Sources come from a locally maintained content list plus runtime RSS fetching.

---

## Contributing Content

Bitcoin FM is community-driven. Help expand high-quality signal sources in one of two ways.

### Option A: Open a PR (recommended)

We manage content through GitOps. All sources live under `content/`. You do not need to write code; editing text files is enough.

1. Add RSS feeds

If you find a strong Bitcoin-only podcast, add it here:

`content/<language>/feeds.md`

Append one line:

```md
- [Podcast Name](RSS_Feed_URL)
```

Note: make sure the link is a valid RSS XML URL, not an Apple Podcasts or Spotify page.

2. Add curated singles

Some general tech or economics podcasts are not Bitcoin-only, but a particular episode is worth preserving. You can add that single episode here:

`content/<language>/singles.json`

Add a new object to the array (you will need to extract the direct audio URL):

```json
{
  "title": "Episode Title",
  "podcastName": "Podcast Name",
  "audioUrl": "https://example.com/episode.mp3",
  "coverImage": "https://example.com/cover.jpg",
  "pubDate": "2023-10-31T00:00:00Z",
  "duration": "1h 30m"
}
```

You can also use https://bitcoinfm.online/rss-extract-tool to generate a JSON file for single episodes in the required format.

3. Submit your PR

Describe what you added or adjusted. We review for quality and Bitcoin relevance. Once approved, the site rebuilds and the new sources go live.

### Option B: Open an Issue

If a PR is inconvenient, open an Issue instead:

- Provide the podcast name + RSS URL, or the full single-episode fields (see `singles.json` schema).
- We will review and merge.

Minimal issue template:

```
Type: feeds / singles
Language: zh / en / ja / es / de / pt / fr
Content:
- Podcast Name + RSS URL
or
- title / podcastName / audioUrl / coverImage / pubDate / duration
```

---

## Tech Stack

- **Framework**: Next.js 16 (App Router, Server Components)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **State**: Zustand (global player state)
- **Animation / Icons**: framer-motion / lucide-react
- **RSS / Dates**: rss-parser / dayjs

---

## Local Development

### Prerequisites

- Node.js **18+** (LTS recommended)

### Install and Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

### Scripts

- `npm run dev`: development server
- `npm run build`: production build
- `npm run start`: run the production build
- `npm run lint`: ESLint

---

## Content Maintenance (Most Important)

The content database lives under `content/`, organized by language:

```
content/
  en/
    feeds.md
    singles.json
  zh/
    feeds.md
    singles.json
  ja/
    feeds.md
    singles.json
  es/
    feeds.md
    singles.json
  de/
    feeds.md
    singles.json
  pt/
    feeds.md
    singles.json
  fr/
    feeds.md
    singles.json
```

### RSS whitelist: `feeds.md`

- **Format**: one Markdown link per line: `- [Podcast Name](RSS_URL)`
- **Example**:

```md
- [What Bitcoin Did](https://feeds.fountain.fm/...)
- [Yi Cong Zhe Shi](https://anchor.fm/s/.../podcast/rss)
```

The system parses the `[Name](URL)` shape and treats it as a candidate feed.

### Curated singles: `singles.json`

For direct-link episodes that do not require RSS parsing. Example structure:

```json
[
  {
    "title": "Episode Title",
    "podcastName": "Podcast Name",
    "audioUrl": "https://.../file.mp3",
    "coverImage": "https://.../cover.jpg",
    "pubDate": "2025-12-29T00:00:00.000Z",
    "duration": "1:04:02"
  }
]
```

---

## License

MIT
