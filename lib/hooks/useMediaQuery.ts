'use client';

import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
    const getInitialValue = () => {
        if (typeof window !== 'undefined') {
            return window.matchMedia(query).matches;
        }
        return false;
    };

    const [matches, setMatches] = useState(getInitialValue);

    useEffect(() => {
        const media = window.matchMedia(query);
        setMatches(media.matches);

        const listener = (e: MediaQueryListEvent | MediaQueryList) => {
            setMatches('matches' in e ? e.matches : (e as MediaQueryListEvent).matches);
        };

        if (media.addEventListener) {
            media.addEventListener('change', listener as (e: MediaQueryListEvent) => void);
        } else {
            media.addListener(listener as (e: MediaQueryListEvent) => void);
        }

        return () => {
            if (media.removeEventListener) {
                media.removeEventListener('change', listener as (e: MediaQueryListEvent) => void);
            } else {
                media.removeListener(listener as (e: MediaQueryListEvent) => void);
            }
        };
    }, [query]);

    return matches;
}

export function useIsDesktop(): boolean {
    return useMediaQuery('(min-width: 768px)');
}
