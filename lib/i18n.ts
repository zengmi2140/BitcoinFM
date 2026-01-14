// i18n translations
export const LANGUAGES = ['zh', 'en', 'ja', 'es', 'de', 'pt', 'fr'] as const;
export type Language = typeof LANGUAGES[number];
export const DEFAULT_LANGUAGE: Language = 'zh';

export function isLanguage(value: string): value is Language {
    return (LANGUAGES as readonly string[]).includes(value);
}

export interface Translations {
    header: {
        tagline: string;
        all: string;
        new: string;
        allDesc: string;
        newDesc: string;
    };
    player: {
        reseedEntropy: string;
        reseeding: string;
    };
}

const translations: Record<Language, Translations> = {
    zh: {
        header: {
            tagline: '健全货币之声',
            all: '全部',
            new: '最新',
            allDesc: '在时间长河中随机漫步',
            newDesc: '聚焦当下发生的对话',
        },
        player: {
            reseedEntropy: '重置熵源',
            reseeding: '重置中...',
        },
    },
    en: {
        header: {
            tagline: 'The Sound of Sound Money',
            all: 'All',
            new: 'New',
            allDesc: 'A random walk down the Timechain.',
            newDesc: 'Tuning into the fresh signal.',
        },
        player: {
            reseedEntropy: 'Reseed Entropy',
            reseeding: 'Reseeding...',
        },
    },
    ja: {
        header: {
            tagline: 'The Sound of Sound Money',
            all: 'All',
            new: 'New',
            allDesc: 'A random walk down the Timechain.',
            newDesc: 'Tuning into the fresh signal.',
        },
        player: {
            reseedEntropy: 'Reseed Entropy',
            reseeding: 'Reseeding...',
        },
    },
    es: {
        header: {
            tagline: 'The Sound of Sound Money',
            all: 'All',
            new: 'New',
            allDesc: 'A random walk down the Timechain.',
            newDesc: 'Tuning into the fresh signal.',
        },
        player: {
            reseedEntropy: 'Reseed Entropy',
            reseeding: 'Reseeding...',
        },
    },
    de: {
        header: {
            tagline: 'The Sound of Sound Money',
            all: 'All',
            new: 'New',
            allDesc: 'A random walk down the Timechain.',
            newDesc: 'Tuning into the fresh signal.',
        },
        player: {
            reseedEntropy: 'Reseed Entropy',
            reseeding: 'Reseeding...',
        },
    },
    pt: {
        header: {
            tagline: 'The Sound of Sound Money',
            all: 'All',
            new: 'New',
            allDesc: 'A random walk down the Timechain.',
            newDesc: 'Tuning into the fresh signal.',
        },
        player: {
            reseedEntropy: 'Reseed Entropy',
            reseeding: 'Reseeding...',
        },
    },
    fr: {
        header: {
            tagline: 'The Sound of Sound Money',
            all: 'All',
            new: 'New',
            allDesc: 'A random walk down the Timechain.',
            newDesc: 'Tuning into the fresh signal.',
        },
        player: {
            reseedEntropy: 'Reseed Entropy',
            reseeding: 'Reseeding...',
        },
    },
};

export function getTranslations(lang: Language): Translations {
    return translations[lang] || translations.en;
}
