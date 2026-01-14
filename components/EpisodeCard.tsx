'use client';

import { PodcastEpisode } from '@/lib/podcasts';
import { Radio } from 'lucide-react';
import Image from 'next/image';
import { usePlayerStore } from '@/lib/store/usePlayerStore';
import { formatDuration } from '@/lib/utils';
import { KeyboardEvent } from 'react';
import { useIsDesktop } from '@/lib/hooks/useMediaQuery';

interface EpisodeCardProps {
    episode: PodcastEpisode;
    index: number;
}

export default function EpisodeCard({ episode, index }: EpisodeCardProps) {
    const { currentEpisode, isPlaying, setEpisode, togglePlay } = usePlayerStore();
    const isCurrentPlaying = currentEpisode?.id === episode.id && isPlaying;
    const isCurrent = currentEpisode?.id === episode.id;
    const isDesktop = useIsDesktop();

    const handleClick = () => {
        if (isCurrent) {
            togglePlay();
        } else {
            setEpisode(episode);
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
        }
    };

    const ariaLabel = isCurrent 
        ? (isPlaying ? `Pause ${episode.title}` : `Resume ${episode.title}`)
        : `Play ${episode.title} from ${episode.podcastName}`;

    return (
        <>
            {/* Mobile: Horizontal List Card */}
            <div
                onClick={handleClick}
                onKeyDown={handleKeyDown}
                tabIndex={isDesktop ? -1 : 0}
                role="button"
                aria-label={ariaLabel}
                aria-hidden={isDesktop}
                className={`
                    md:hidden
                    group relative glass-card p-4 cursor-pointer rounded-xl
                    flex items-center gap-4
                    hover:-translate-y-0.5
                    transition-all duration-300 ease-out
                    focus:outline-none focus:ring-2 focus:ring-[var(--orange-primary)] focus:ring-offset-2 focus:ring-offset-[var(--bg-primary)]
                    ${isCurrent
                        ? 'glow-strong border-[var(--orange-primary)]/60'
                        : 'hover:border-[var(--orange-primary)]/40'
                    }
                    animate-float-up
                `}
                style={{ animationDelay: `${index * 0.15}s` }}
            >
                {/* Cover Image - Fixed Square */}
                <div className="w-20 h-20 relative shrink-0 overflow-hidden bg-neutral-800/50 rounded-lg">
                    {episode.coverImage ? (
                        <Image
                            src={episode.coverImage}
                            alt={episode.title}
                            fill
                            className="object-cover transition-all duration-500 group-hover:scale-110"
                            sizes="80px"
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full text-[var(--orange-primary)]/20">
                            <Radio className="w-8 h-8" />
                        </div>
                    )}

                    {isCurrentPlaying && (
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
                            <div className="flex space-x-0.5 items-end h-6">
                                <div className="w-1 bg-[var(--orange-primary)] rounded-full animate-soundwave" style={{ animationDelay: '0s' }} />
                                <div className="w-1 bg-[var(--orange-primary)] rounded-full animate-soundwave" style={{ animationDelay: '0.1s' }} />
                                <div className="w-1 bg-[var(--orange-primary)] rounded-full animate-soundwave" style={{ animationDelay: '0.2s' }} />
                            </div>
                        </div>
                    )}
                </div>

                {/* Info Area - Flexible */}
                <div className="flex-1 min-w-0 space-y-1">
                    <div className="text-[10px] text-[var(--text-secondary)] uppercase tracking-[0.15em] font-bold truncate">
                        {episode.podcastName}
                    </div>
                    <h3 className="text-sm font-bold font-space-grotesk leading-tight line-clamp-2 group-hover:text-[var(--orange-primary)] transition-colors">
                        {episode.title}
                    </h3>
                    <div className="text-[10px] text-[var(--text-secondary)] font-mono">
                        {new Date(episode.pubDate).toLocaleDateString()}
                        {episode.duration ? ` • ${formatDuration(episode.duration)}` : ''}
                    </div>
                </div>
            </div>

            {/* Desktop: Vertical Poker Card */}
            <div
                onClick={handleClick}
                onKeyDown={handleKeyDown}
                tabIndex={isDesktop ? 0 : -1}
                role="button"
                aria-label={ariaLabel}
                aria-hidden={!isDesktop}
                className={`
                    hidden md:block
                    group relative glass-card p-5 cursor-pointer rounded-xl
                    hover:-translate-y-1 hover:scale-[1.02]
                    transition-all duration-300 ease-out
                    focus:outline-none focus:ring-2 focus:ring-[var(--orange-primary)] focus:ring-offset-2 focus:ring-offset-[var(--bg-primary)]
                    ${isCurrent
                        ? 'glow-strong scale-[1.02] -translate-y-1 border-[var(--orange-primary)]/60'
                        : 'hover:border-[var(--orange-primary)]/40 hover:shadow-[0_0_25px_rgba(247,147,26,0.15)]'
                    }
                    animate-float-up
                `}
                style={{ animationDelay: `${index * 0.15}s` }}
            >
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[var(--orange-primary)]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Cover Image - 1:1 Aspect */}
                <div className="aspect-square relative mb-4 overflow-hidden bg-neutral-800/50 rounded-lg group-hover:rounded-xl transition-all duration-300">
                    {episode.coverImage ? (
                        <Image
                            src={episode.coverImage}
                            alt={episode.title}
                            fill
                            className="object-cover transition-all duration-500 group-hover:scale-110"
                            sizes="(max-width: 768px) 100vw, 33vw"
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full text-[var(--orange-primary)]/20">
                            <Radio className="w-16 h-16" />
                        </div>
                    )}

                    {isCurrentPlaying && (
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
                            <div className="flex space-x-1 items-end h-12">
                                <div className="w-1.5 bg-[var(--orange-primary)] rounded-full animate-soundwave" style={{ animationDelay: '0s' }} />
                                <div className="w-1.5 bg-[var(--orange-primary)] rounded-full animate-soundwave" style={{ animationDelay: '0.1s' }} />
                                <div className="w-1.5 bg-[var(--orange-primary)] rounded-full animate-soundwave" style={{ animationDelay: '0.2s' }} />
                                <div className="w-1.5 bg-[var(--orange-primary)] rounded-full animate-soundwave" style={{ animationDelay: '0.3s' }} />
                                <div className="w-1.5 bg-[var(--orange-primary)] rounded-full animate-soundwave" style={{ animationDelay: '0.15s' }} />
                            </div>
                        </div>
                    )}
                </div>

                {/* Info Area */}
                <div className="space-y-2">
                    <div className="text-[10px] text-[var(--text-secondary)] uppercase tracking-[0.2em] font-bold truncate">
                        {episode.podcastName}
                    </div>
                    <h3 className="text-sm font-bold font-space-grotesk leading-tight line-clamp-2 min-h-[2.5em] group-hover:text-[var(--orange-primary)] transition-colors">
                        {episode.title}
                    </h3>
                    <div className="text-[10px] text-[var(--text-secondary)] font-mono">
                        {new Date(episode.pubDate).toLocaleDateString()}
                        {episode.duration ? ` • ${formatDuration(episode.duration)}` : ''}
                    </div>
                </div>
            </div>
        </>
    );
}
