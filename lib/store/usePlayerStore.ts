import { create } from 'zustand';
import { PodcastEpisode } from '@/lib/podcasts';
import { DEFAULT_LANGUAGE, LANGUAGES, Language } from '@/lib/i18n';

interface PlayerState {
    // Episode state
    currentEpisode: PodcastEpisode | null;
    isPlaying: boolean;

    // Playback state
    currentTime: number;
    duration: number;
    playbackRate: number;

    // Time preference
    timePreference: 'all' | 'new';

    // Language
    language: Language;

    // Actions
    setEpisode: (episode: PodcastEpisode) => void;
    play: () => void;
    pause: () => void;
    togglePlay: () => void;
    setCurrentTime: (time: number) => void;
    setDuration: (duration: number) => void;
    setPlaybackRate: (rate: number) => void;
    cyclePlaybackRate: () => void;
    setTimePreference: (preference: 'all' | 'new') => void;
    toggleTimePreference: () => void;
    setLanguage: (lang: Language) => void;
    toggleLanguage: () => void;
}

const PLAYBACK_RATES = [0.75, 1, 1.25, 1.5, 2];

export const usePlayerStore = create<PlayerState>((set, get) => ({
    // Initial state
    currentEpisode: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    playbackRate: 1,
    timePreference: 'all',
    language: DEFAULT_LANGUAGE,

    // Actions
    setEpisode: (episode) => set({
        currentEpisode: episode,
        currentTime: 0,
        duration: 0,
    }),

    play: () => set({ isPlaying: true }),
    pause: () => set({ isPlaying: false }),
    togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),

    setCurrentTime: (time) => set({ currentTime: time }),
    setDuration: (duration) => set({ duration }),

    setPlaybackRate: (rate) => set({ playbackRate: rate }),
    cyclePlaybackRate: () => {
        const current = get().playbackRate;
        const currentIndex = PLAYBACK_RATES.indexOf(current);
        const nextIndex = (currentIndex + 1) % PLAYBACK_RATES.length;
        set({ playbackRate: PLAYBACK_RATES[nextIndex] });
    },

    setTimePreference: (preference) => set({ timePreference: preference }),
    toggleTimePreference: () => set((state) => ({
        timePreference: state.timePreference === 'all' ? 'new' : 'all'
    })),

    setLanguage: (lang) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('bitcoinfm-lang', lang);
        }
        set({ language: lang });
    },
    toggleLanguage: () => {
        const current = get().language;
        const currentIndex = LANGUAGES.indexOf(current);
        const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % LANGUAGES.length : 0;
        const newLang = LANGUAGES[nextIndex];
        if (typeof window !== 'undefined') {
            localStorage.setItem('bitcoinfm-lang', newLang);
        }
        set({ language: newLang });
    },
}));
