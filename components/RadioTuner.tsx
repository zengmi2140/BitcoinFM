'use client';

import { useState, useRef, useEffect, useCallback, ChangeEvent } from 'react';
import { PodcastEpisode } from '@/lib/podcasts';
import { fetchNewEpisodes } from '@/app/actions';
import { Play, Pause, RotateCcw, RotateCw, Dice5, Globe, ChevronDown, Github } from 'lucide-react';
import Image from 'next/image';
import { usePlayerStore } from '@/lib/store/usePlayerStore';
import { isLanguage, Language } from '@/lib/i18n';
import { SKIP_SECONDS, RIPPLE_DURATION_MS, TAGLINE_REVERT_DELAY_MS } from '@/lib/constants';
import EpisodeCard from './EpisodeCard';

interface RadioTunerProps {
    initialEpisodes: PodcastEpisode[];
    initialLang?: Language;
}

export default function RadioTuner({ initialEpisodes, initialLang = 'zh' }: RadioTunerProps) {
    const [episodes, setEpisodes] = useState<PodcastEpisode[]>(initialEpisodes);
    const [isReseeding, setIsReseeding] = useState(false);
    const [rippleActive, setRippleActive] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [langDropdownOpen, setLangDropdownOpen] = useState(false);
    const [hoveredPreference, setHoveredPreference] = useState<'all' | 'new' | 'github' | 'language' | null>(null);
    const [taglineOverride, setTaglineOverride] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const taglineTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const rippleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Zustand store
    const {
        currentEpisode,
        isPlaying,
        currentTime,
        duration,
        playbackRate,
        timePreference,
        language,
        play,
        pause,
        setCurrentTime,
        setDuration,
        cyclePlaybackRate,
        toggleTimePreference,
        setLanguage,
    } = usePlayerStore();

    const handleTimePreferenceToggle = () => {
        toggleTimePreference();
        // The state update in store is async/batched, but we know the intent is to flip.
        // If current is 'all', we are going to 'new'.
        const nextPref = timePreference === 'all' ? 'new' : 'all';
        const message = nextPref === 'all' ? 'A random walk down the Timechain.' : 'Tuning into the fresh signal.';

        // Only show tagline override on mobile (< 768px)
        if (typeof window !== 'undefined' && window.innerWidth < 768) {
            setTaglineOverride(message);

            // Clear any existing timeout
            if (taglineTimeoutRef.current) {
                clearTimeout(taglineTimeoutRef.current);
            }

            // Reset after delay
            taglineTimeoutRef.current = setTimeout(() => {
                setTaglineOverride(null);
            }, TAGLINE_REVERT_DELAY_MS);
        }
    };

    // Cleanup timeouts on unmount
    useEffect(() => {
        return () => {
            if (taglineTimeoutRef.current) {
                clearTimeout(taglineTimeoutRef.current);
            }
            if (rippleTimeoutRef.current) {
                clearTimeout(rippleTimeoutRef.current);
            }
        };
    }, []);

    const formatTime = (time: number) => {
        if (isNaN(time)) return "00:00";
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    const handleReseed = useCallback(async () => {
        setRippleActive(true);
        
        // Clear any existing ripple timeout
        if (rippleTimeoutRef.current) {
            clearTimeout(rippleTimeoutRef.current);
        }
        rippleTimeoutRef.current = setTimeout(() => setRippleActive(false), RIPPLE_DURATION_MS);
        
        setIsReseeding(true);
        try {
            const newEpisodes = await fetchNewEpisodes(timePreference, language);
            setEpisodes(newEpisodes);
        } catch (error) {
            console.error('Failed to reseed entropy:', error);
        } finally {
            setIsReseeding(false);
        }
    }, [timePreference, language]);

    // Handle hydration and initial language
    useEffect(() => {
        setMounted(true);
        // Load saved language from localStorage, or fall back to initialLang (server detected)
        const saved = localStorage.getItem('bitcoinfm-lang');
        if (saved && isLanguage(saved)) {
            if (saved !== language) {
                usePlayerStore.getState().setLanguage(saved);
            }
        } else {
            // If no saved preference, use what the server detected
            if (initialLang && initialLang !== language) {
                usePlayerStore.getState().setLanguage(initialLang);
            }
        }
    }, [initialLang]); // eslint-disable-line

    // Refetch episodes when language changes
    const lastFetchedLangRef = useRef<string>(initialLang);

    useEffect(() => {
        if (language !== lastFetchedLangRef.current && mounted) {
            handleReseed();
            lastFetchedLangRef.current = language;
        }
    }, [language, mounted, handleReseed]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (langDropdownOpen && !(event.target as Element).closest('[data-lang-dropdown]')) {
                setLangDropdownOpen(false);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [langDropdownOpen]);

    // Setup audio element
    useEffect(() => {
        if (currentEpisode && audioRef.current) {
            audioRef.current.src = currentEpisode.audioUrl;
            audioRef.current.play().catch(e => console.error("Playback failed", e));
            play();
        }
    }, [currentEpisode, play]);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.playbackRate = playbackRate;
        }
    }, [playbackRate]);

    // Media Session API
    const updateMediaSession = useCallback(() => {
        if (!currentEpisode || !('mediaSession' in navigator)) return;

        navigator.mediaSession.metadata = new MediaMetadata({
            title: currentEpisode.title,
            artist: currentEpisode.podcastName,
            album: 'Bitcoin FM',
            artwork: currentEpisode.coverImage ? [
                { src: currentEpisode.coverImage, sizes: '512x512', type: 'image/jpeg' }
            ] : []
        });

        navigator.mediaSession.setActionHandler('play', () => {
            audioRef.current?.play();
            play();
        });
        navigator.mediaSession.setActionHandler('pause', () => {
            audioRef.current?.pause();
            pause();
        });
        navigator.mediaSession.setActionHandler('seekbackward', () => {
            if (audioRef.current) {
                audioRef.current.currentTime = Math.max(audioRef.current.currentTime - SKIP_SECONDS, 0);
            }
        });
        navigator.mediaSession.setActionHandler('seekforward', () => {
            if (audioRef.current) {
                audioRef.current.currentTime = Math.min(audioRef.current.currentTime + SKIP_SECONDS, duration);
            }
        });
    }, [currentEpisode, duration, play, pause]);

    useEffect(() => {
        updateMediaSession();
    }, [updateMediaSession]);

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
        }
    };

    const handleLoadedMetadata = () => {
        if (audioRef.current) {
            setDuration(audioRef.current.duration);
        }
    };

    const handleSeek = (e: ChangeEvent<HTMLInputElement>) => {
        const time = parseFloat(e.target.value);
        if (audioRef.current) {
            audioRef.current.currentTime = time;
            setCurrentTime(time);
        }
    };

    const skipForward = () => {
        if (audioRef.current) {
            audioRef.current.currentTime = Math.min(audioRef.current.currentTime + SKIP_SECONDS, duration);
        }
    };

    const skipBackward = () => {
        if (audioRef.current) {
            audioRef.current.currentTime = Math.max(audioRef.current.currentTime - SKIP_SECONDS, 0);
        }
    };

    // Prevent hydration mismatch
    if (!mounted) {
        return null;
    }

    return (
        <div className="flex flex-col h-screen max-h-screen text-[var(--text-primary)] overflow-hidden selection:bg-orange-500/30 relative">

            <div className="absolute inset-0 noise-texture pointer-events-none" />
            <div className="absolute inset-0 scanlines pointer-events-none opacity-20" />

            {/* Header */}
            <header className="relative p-4 md:p-6 flex flex-row md:flex-row items-stretch md:items-center justify-between gap-3 md:gap-0 border-b border-[var(--border-color)] bg-gradient-to-b from-[var(--bg-primary)] to-[var(--bg-secondary)] z-20">
                {/* Brand: Logo + Title + Tagline */}
                <div className="flex-1 md:flex-none flex flex-row items-start md:items-center gap-3 md:gap-4 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                    <Image 
                        src="/logo-transparent.png" 
                        alt="BitcoinFM Logo" 
                        width={120} 
                        height={120} 
                        className="w-20 md:w-24 h-20 md:h-24 object-contain shrink-0"
                    />
                    <div className="flex flex-col items-start gap-0.5 mt-1 md:mt-0">
                        <h1 className="text-2xl md:text-3xl font-bold font-space-grotesk tracking-wider text-[var(--orange-primary)]">
                            Bitcoin<span className="font-normal text-[var(--text-primary)]">FM</span>
                        </h1>
                        <p className={`text-xs md:text-sm tracking-wide text-left transition-colors duration-300 ${taglineOverride ? 'text-[var(--orange-primary)] font-bold' : 'text-[var(--text-secondary)]'}`}>
                            {taglineOverride || 'The Sound of Sound Money'}
                        </p>
                    </div>
                </div>

                {/* Controls Area */}
                <div className="flex flex-col md:flex-row items-center md:items-center justify-start md:justify-end gap-2 md:gap-6 animate-fade-in mt-1 md:mt-0" style={{ animationDelay: '0.2s' }}>
                    {/* GitHub Link - Desktop Only */}
                    <div className="relative hidden md:flex items-center justify-center">
                        <a
                            href="https://github.com/zengmi2140/BitcoinFM"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--orange-primary)] transition-colors"
                            onMouseEnter={() => setHoveredPreference('github')}
                            onMouseLeave={() => setHoveredPreference(null)}
                        >
                            <Github className="w-5 h-5" />
                        </a>
                        
                        {/* GitHub Tooltip */}
                        <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 text-center pointer-events-none transition-opacity duration-300 ${hoveredPreference === 'github' ? 'opacity-100' : 'opacity-0'}`}>
                            <span className="text-[10px] md:text-xs font-mono text-[var(--text-secondary)] whitespace-nowrap">
                                View on GitHub
                            </span>
                        </div>
                    </div>

                    {/* Time Preference Toggle */}
                    <div className="relative flex items-center justify-end gap-2 text-[10px] md:text-xs w-full md:w-auto self-start md:self-auto">
                        <button
                            onClick={handleTimePreferenceToggle}
                            className="relative flex items-center bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-full p-1 cursor-pointer w-full md:w-24 h-7 md:h-8 overflow-hidden group hover:border-[var(--orange-primary)]/60 transition-colors"
                            aria-label="Toggle time preference"
                            role="switch"
                            aria-checked={timePreference === 'new'}
                            onMouseLeave={() => setHoveredPreference(null)}
                        >
                            <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-[var(--orange-primary)] rounded-full transition-transform duration-300 shadow-[0_0_10px_rgba(247,147,26,0.3)] left-1 ${timePreference === 'new' ? 'translate-x-full' : 'translate-x-0'}`} />

                            <div className="relative z-10 flex w-full h-full text-[10px] md:text-xs font-mono font-bold">
                                <span
                                    className={`flex-1 flex items-center justify-center transition-colors duration-300 ${timePreference === 'all' ? 'text-black' : 'text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'}`}
                                    onMouseEnter={() => setHoveredPreference('all')}
                                >
                                    All
                                </span>
                                <span
                                    className={`flex-1 flex items-center justify-center transition-colors duration-300 ${timePreference === 'new' ? 'text-black' : 'text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'}`}
                                    onMouseEnter={() => setHoveredPreference('new')}
                                >
                                    New
                                </span>
                            </div>
                        </button>

                        {/* Hover Tooltip - Desktop Only */}
                        <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 text-center pointer-events-none transition-opacity duration-300 hidden md:block ${(hoveredPreference === 'all' || hoveredPreference === 'new') ? 'opacity-100' : 'opacity-0'}`}>
                            <span className="text-[10px] md:text-xs font-mono text-[var(--text-secondary)] whitespace-nowrap">
                                {hoveredPreference === 'all' ? 'A random walk down the Timechain.' : hoveredPreference === 'new' ? 'Tuning into the fresh signal.' : ''}
                            </span>
                        </div>
                    </div>

                    {/* Language Switcher Dropdown */}
                    <div className="relative w-full md:w-[90px]" data-lang-dropdown>
                        <button
                            onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                            className="flex items-center justify-between w-full text-[10px] md:text-xs text-[var(--text-secondary)] hover:text-[var(--orange-primary)] transition-colors border border-[var(--border-color)] rounded-lg px-2 py-1.5 hover:border-[var(--orange-primary)]/60"
                            onMouseEnter={() => setHoveredPreference('language')}
                            onMouseLeave={() => setHoveredPreference(null)}
                        >
                            <div className="flex items-center gap-1.5">
                                <Globe className="w-3.5 h-3.5" />
                                <span className="font-mono uppercase">{language}</span>
                            </div>
                            <ChevronDown className={`w-3 h-3 transition-transform ${langDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                        <div className={`absolute top-full right-0 mt-2 text-center pointer-events-none transition-opacity duration-300 hidden md:block ${hoveredPreference === 'language' ? 'opacity-100' : 'opacity-0'}`}>
                            <span className="text-[10px] md:text-xs font-mono text-[var(--text-secondary)] whitespace-nowrap">
                                Select Podcast Language
                            </span>
                        </div>
                        {langDropdownOpen && (
                            <div className="absolute top-full right-0 w-full mt-1 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg shadow-xl overflow-hidden z-50 animate-slide-down">
                                <button
                                    onClick={() => { setLanguage('en'); setLangDropdownOpen(false); }}
                                    className={`w-full px-3 py-2 text-center text-[10px] md:text-xs font-mono hover:bg-[var(--orange-primary)]/10 transition-colors block ${language === 'en' ? 'text-[var(--orange-primary)]' : 'text-[var(--text-secondary)]'}`}
                                >
                                    English
                                </button>
                                <button
                                    onClick={() => { setLanguage('zh'); setLangDropdownOpen(false); }}
                                    className={`w-full px-3 py-2 text-center text-[10px] md:text-xs font-mono hover:bg-[var(--orange-primary)]/10 transition-colors block ${language === 'zh' ? 'text-[var(--orange-primary)]' : 'text-[var(--text-secondary)]'}`}
                                >
                                    中文
                                </button>
                                <button
                                    onClick={() => { setLanguage('ja'); setLangDropdownOpen(false); }}
                                    className={`w-full px-3 py-2 text-center text-[10px] md:text-xs font-mono hover:bg-[var(--orange-primary)]/10 transition-colors block ${language === 'ja' ? 'text-[var(--orange-primary)]' : 'text-[var(--text-secondary)]'}`}
                                >
                                    日本語
                                </button>
                                <button
                                    onClick={() => { setLanguage('es'); setLangDropdownOpen(false); }}
                                    className={`w-full px-3 py-2 text-center text-[10px] md:text-xs font-mono hover:bg-[var(--orange-primary)]/10 transition-colors block ${language === 'es' ? 'text-[var(--orange-primary)]' : 'text-[var(--text-secondary)]'}`}
                                >
                                    Espanol
                                </button>
                                <button
                                    onClick={() => { setLanguage('de'); setLangDropdownOpen(false); }}
                                    className={`w-full px-3 py-2 text-center text-[10px] md:text-xs font-mono hover:bg-[var(--orange-primary)]/10 transition-colors block ${language === 'de' ? 'text-[var(--orange-primary)]' : 'text-[var(--text-secondary)]'}`}
                                >
                                    Deutsch
                                </button>
                                <button
                                    onClick={() => { setLanguage('pt'); setLangDropdownOpen(false); }}
                                    className={`w-full px-3 py-2 text-center text-[10px] md:text-xs font-mono hover:bg-[var(--orange-primary)]/10 transition-colors block ${language === 'pt' ? 'text-[var(--orange-primary)]' : 'text-[var(--text-secondary)]'}`}
                                >
                                    Portugues
                                </button>
                                <button
                                    onClick={() => { setLanguage('fr'); setLangDropdownOpen(false); }}
                                    className={`w-full px-3 py-2 text-center text-[10px] md:text-xs font-mono hover:bg-[var(--orange-primary)]/10 transition-colors block ${language === 'fr' ? 'text-[var(--orange-primary)]' : 'text-[var(--text-secondary)]'}`}
                                >
                                    Francais
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[var(--orange-primary)]/30 to-transparent" />
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-4 md:p-12 flex flex-col items-center justify-start md:justify-center min-h-0 relative z-10">
                <div className="w-full max-w-5xl">
                    {/* Responsive Grid: Mobile vertical stack, Desktop horizontal */}
                    <div className="flex flex-col md:grid md:grid-cols-3 gap-4 md:gap-8">
                        {episodes.map((episode, index) => (
                            <EpisodeCard key={episode.id} episode={episode} index={index} />
                        ))}
                    </div>

                    {/* Reseed Entropy Button */}
                    <div className="flex justify-center mt-8 md:mt-12 animate-float-up" style={{ animationDelay: '0.6s' }}>
                        <button
                            onClick={handleReseed}
                            disabled={isReseeding}
                            className="relative px-6 md:px-10 py-3 md:py-4 border border-[var(--orange-primary)]/40 hover:border-[var(--orange-primary)]/80 bg-[var(--orange-primary)]/5 hover:bg-[var(--orange-primary)] hover:text-black uppercase tracking-[0.15em] md:tracking-[0.25em] font-bold text-xs md:text-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-wait rounded-lg overflow-hidden group"
                        >
                            {rippleActive && (
                                <div className="absolute inset-0 bg-[var(--orange-primary)]/30 animate-ripple" />
                            )}
                            <span className="relative z-10 flex items-center gap-2 md:gap-3">
                                <Dice5 className={`w-4 md:w-5 h-4 md:h-5 ${isReseeding ? 'animate-dice-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                                {isReseeding ? 'RESEEDING...' : 'RESEED ENTROPY'}
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--orange-primary)]/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                        </button>
                    </div>
                </div>
            </main>

            {/* Footer Player */}
            {currentEpisode && (
                <footer className="bg-[var(--bg-secondary)] border-t border-[var(--border-color)] flex flex-col z-20 shadow-2xl relative">
                    {/* Progress Bar */}
                    <div className="w-full flex items-center px-4 md:px-10 pt-2 md:pt-3 gap-2 md:gap-4">
                        <span className="text-[8px] md:text-[10px] font-mono text-[var(--text-secondary)] text-left">{formatTime(currentTime)}</span>
                        <input
                            type="range"
                            min={0}
                            max={duration}
                            value={currentTime}
                            onChange={handleSeek}
                            className="flex-1 h-1 md:h-1.5 bg-neutral-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 md:[&::-webkit-slider-thumb]:w-3 md:[&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-[var(--orange-primary)] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(247,147,26,0.5)] hover:[&::-webkit-slider-thumb]:scale-125 [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-runnable-track]:rounded-full"
                        />
                        <span className="text-[8px] md:text-[10px] font-mono text-[var(--text-secondary)] text-right">{formatTime(duration)}</span>
                    </div>

                    {/* Controls */}
                    <div className="h-16 md:h-20 flex items-center justify-between px-4 md:px-10">
                        <div className="flex-1 flex items-center gap-3 md:gap-4 min-w-0">
                            <div className="w-10 h-10 md:w-12 md:h-12 relative bg-neutral-800 shrink-0 border border-[var(--border-color)] rounded-lg overflow-hidden">
                                {currentEpisode.coverImage && (
                                    <Image src={currentEpisode.coverImage} alt="" fill className="object-cover" />
                                )}
                            </div>
                            <div className="min-w-0 flex-1 overflow-hidden">
                                <div className="text-[8px] md:text-[10px] text-[var(--text-secondary)] uppercase tracking-wider truncate">{currentEpisode.podcastName}</div>
                                <div className="text-xs md:text-sm font-bold font-space-grotesk text-[var(--orange-primary)] truncate">
                                    {currentEpisode.title}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 md:gap-6">
                            <button onClick={skipBackward} className="relative w-9 h-9 md:w-11 md:h-11 text-[var(--text-secondary)] hover:text-[var(--orange-primary)] transition-colors flex items-center justify-center group" aria-label="Skip back 15 seconds">
                                <RotateCcw className="w-9 h-9 md:w-11 md:h-11 stroke-[1.5]" />
                                <span className="absolute inset-0 flex items-center justify-center text-[9px] md:text-[11px] font-bold font-mono mt-0.5" aria-hidden="true">15</span>
                            </button>

                            <button
                                onClick={() => {
                                    if (isPlaying) {
                                        audioRef.current?.pause();
                                        pause();
                                    } else {
                                        audioRef.current?.play();
                                        play();
                                    }
                                }}
                                className={`w-12 h-12 md:w-14 md:h-14 rounded-full border-2 border-[var(--orange-primary)]/40 flex items-center justify-center hover:bg-[var(--orange-primary)] hover:border-[var(--orange-primary)] hover:text-black transition-all ${isPlaying ? 'animate-pulse-glow' : ''}`}
                            >
                                {isPlaying ? <Pause className="fill-current w-5 md:w-6 h-5 md:h-6" /> : <Play className="fill-current ml-0.5 w-5 md:w-6 h-5 md:h-6" />}
                            </button>

                            <button onClick={skipForward} className="relative w-9 h-9 md:w-11 md:h-11 text-[var(--text-secondary)] hover:text-[var(--orange-primary)] transition-colors flex items-center justify-center group" aria-label="Skip forward 15 seconds">
                                <RotateCw className="w-9 h-9 md:w-11 md:h-11 stroke-[1.5]" />
                                <span className="absolute inset-0 flex items-center justify-center text-[9px] md:text-[11px] font-bold font-mono mt-0.5" aria-hidden="true">15</span>
                            </button>
                        </div>

                        <div className="flex-1 flex items-center justify-end gap-4">
                            <button
                                onClick={cyclePlaybackRate}
                                className="text-[10px] md:text-xs font-mono text-[var(--text-secondary)] hover:text-[var(--orange-primary)] border border-[var(--border-color)] rounded-lg px-2 md:px-3 py-1 md:py-1.5 min-w-[2.5rem] md:min-w-[3.5rem] text-center transition-all hover:border-[var(--orange-primary)]/60"
                            >
                                {playbackRate}x
                            </button>
                        </div>
                    </div>

                    <audio
                        ref={audioRef}
                        onEnded={() => pause()}
                        onPause={() => pause()}
                        onPlay={() => play()}
                        onTimeUpdate={handleTimeUpdate}
                        onLoadedMetadata={handleLoadedMetadata}
                    />
                </footer>
            )}
        </div>
    );
}
