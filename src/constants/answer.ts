
export const ANSWERS_N: AnswerItem[] = [    
    { id: "ans-basePath", label: "basePath", letter: "N" },
    { id: "ans-assetPrefix", label: "assetPrefix", letter: "N" },
    { id: "ans-i18n", label: "i18n", letter: "N" },
    { id: "ans-redirects", label: "redirects", letter: "N" },
    { id: "ans-rewrites", label: "rewrites", letter: "N" },
    { id: "ans-headers", label: "headers", letter: "N" },
    { id: "ans-output", label: "output", letter: "N" },
    { id: "ans-experimental", label: "experimental", letter: "N" },
];

export const ANSWERS_E: AnswerItem[] = [
    { id: "ans-page-js", label: "page.js", letter: "E" },
    { id: "ans-error-js", label: "error.js", letter: "E" },
    { id: "ans-layout-js", label: "layout.js", letter: "E" },
    { id: "ans-loading-js", label: "loading.js", letter: "E" },
    { id: "ans-not-found-js", label: "not-found.js", letter: "E" },
    { id: "ans-route-js", label: "route.js", letter: "E" },
    { id: "ans-middleware-js", label: "middleware.js", letter: "E" },
    { id: "ans-template-js", label: "template.js", letter: "E" },
];

export const ANSWERS_X: AnswerItem[] = [
    { id: "ans-next-image", label: "next/image", letter: "X" },
    { id: "ans-next-script", label: "next/script", letter: "X" },
    { id: "ans-next-head", label: "next/head", letter: "X" },
    { id: "ans-next-link", label: "next/link", letter: "X" },
    { id: "ans-next-navigation", label: "next/navigation", letter: "X" },
    { id: "ans-next-font", label: "next/font", letter: "X" },
    { id: "ans-next-server", label: "next/server", letter: "X" },
];

export const ANSWERS_T: AnswerItem[] = [
    { id: "ans-static-rendering", label: "Static Rendering", letter: "T" },
    { id: "ans-partial-rendering", label: "Partial Rendering", letter: "T" },
    { id: "ans-dynamic-rendering", label: "Dynamic Rendering", letter: "T" },
    { id: "ans-images", label: "images", letter: "T" },
    { id: "ans-streaming", label: "Streaming", letter: "T" },
    { id: "ans-server-components", label: "'use server'", letter: "T" },
    { id: "ans-client-components", label: "'use client'", letter: "T" },
    { id: "ans-caching", label: "Caching", letter: "T" },
    { id: "ans-prefetching", label: "Prefetching", letter: "T" },
    { id: "ans-isr", label: "Incremental Static Regeneration (ISR)", letter: "T" },
];

export type AnswerItem = { id: string; label: string; letter: "N" | "E" | "X" | "T" };

function pickRandom<T>(arr: T[], count: number): T[] {
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy.slice(0, Math.min(count, copy.length));
}

function shuffle<T>(arr: T[]): T[] {
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

export function getAnswersRandom(): AnswerItem[] {
    const combined: AnswerItem[] = [
        ...pickRandom(ANSWERS_N, 2),
        ...pickRandom(ANSWERS_E, 2),
        ...pickRandom(ANSWERS_X, 2),
        ...pickRandom(ANSWERS_T, 2),
    ];
    return shuffle(combined);
}