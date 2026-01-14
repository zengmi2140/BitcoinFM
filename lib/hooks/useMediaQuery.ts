'use client';

import { useSyncExternalStore } from 'react';

export function useMediaQuery(query: string): boolean {
    const getServerSnapshot = () => false;
    const getSnapshot = () => {
        if (typeof window === 'undefined') return false;
        return window.matchMedia(query).matches;
    };
    const subscribe = (onStoreChange: () => void) => {
        if (typeof window === 'undefined') return () => {};
        const media = window.matchMedia(query);
        const handler = () => onStoreChange();

        if (media.addEventListener) {
            media.addEventListener('change', handler);
        } else {
            media.addListener(handler);
        }

        return () => {
            if (media.removeEventListener) {
                media.removeEventListener('change', handler);
            } else {
                media.removeListener(handler);
            }
        };
    };

    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useIsDesktop(): boolean {
    return useMediaQuery('(min-width: 768px)');
}
