import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import dns from 'dns/promises';
import net from 'net';

const ALLOWED_PROTOCOLS = new Set(['https:']);
const CONTENT_ROOT = path.join(process.cwd(), 'content');
const ALLOWED_HOSTS = loadAllowedHosts();

function loadAllowedHosts(): Set<string> {
    const hosts = new Set<string>();
    try {
        const langDirs = fs.readdirSync(CONTENT_ROOT, { withFileTypes: true })
            .filter(entry => entry.isDirectory())
            .map(entry => entry.name);

        for (const lang of langDirs) {
            const feedsPath = path.join(CONTENT_ROOT, lang, 'feeds.md');
            if (fs.existsSync(feedsPath)) {
                const feedsContent = fs.readFileSync(feedsPath, 'utf-8');
                const matches = feedsContent.match(/\((https?:\/\/[^)\s]+)\)/g) || [];
                for (const match of matches) {
                    const url = match.slice(1, -1);
                    addHostFromUrl(hosts, url);
                }
            }

            const singlesPath = path.join(CONTENT_ROOT, lang, 'singles.json');
            if (fs.existsSync(singlesPath)) {
                const singlesContent = fs.readFileSync(singlesPath, 'utf-8');
                try {
                    const singles = JSON.parse(singlesContent) as Array<Record<string, string>>;
                    singles.forEach(single => {
                        if (single.audioUrl) addHostFromUrl(hosts, single.audioUrl);
                        if (single.coverImage) addHostFromUrl(hosts, single.coverImage);
                    });
                } catch (error) {
                    console.warn(`Failed to parse singles for ${lang}:`, error);
                }
            }
        }
    } catch (error) {
        console.error('Failed to load allowed hosts:', error);
    }

    return hosts;
}

function addHostFromUrl(hosts: Set<string>, url: string) {
    try {
        const parsed = new URL(url);
        if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) return;
        hosts.add(parsed.hostname.toLowerCase());
    } catch {
        // Ignore malformed URLs
    }
}

function isPrivateIPv4(ip: string): boolean {
    const parts = ip.split('.').map(Number);
    if (parts.length !== 4 || parts.some(part => Number.isNaN(part))) return false;

    if (parts[0] === 10) return true;
    if (parts[0] === 127) return true;
    if (parts[0] === 169 && parts[1] === 254) return true;
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    if (parts[0] === 192 && parts[1] === 168) return true;
    if (parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127) return true;
    return false;
}

function isPrivateIPv6(ip: string): boolean {
    const normalized = ip.toLowerCase();
    if (normalized === '::1' || normalized === '::') return true;
    if (normalized.startsWith('fe80:')) return true;
    if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true;
    if (normalized.startsWith('::ffff:')) {
        const embedded = normalized.slice(7);
        if (net.isIP(embedded) === 4) {
            return isPrivateIPv4(embedded);
        }
    }
    return false;
}

function isPrivateIp(ip: string): boolean {
    const ipVersion = net.isIP(ip);
    if (ipVersion === 4) return isPrivateIPv4(ip);
    if (ipVersion === 6) return isPrivateIPv6(ip);
    return false;
}

async function resolvesToPrivateIp(hostname: string): Promise<boolean> {
    if (net.isIP(hostname)) {
        return isPrivateIp(hostname);
    }

    try {
        const records = await dns.lookup(hostname, { all: true, verbatim: true });
        return records.some(record => isPrivateIp(record.address));
    } catch (error) {
        console.warn('DNS lookup failed for hostname:', hostname, error);
        return true;
    }
}

function isLocalhost(hostname: string): boolean {
    const normalized = hostname.toLowerCase();
    return normalized === 'localhost' || normalized.endsWith('.localhost');
}

export async function GET(request: NextRequest) {
    if (process.env.NODE_ENV !== 'development') {
        return new NextResponse('Not Found', { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get('url');

    if (!targetUrl) {
        return new NextResponse('Missing url parameter', { status: 400 });
    }

    try {
        const parsed = new URL(targetUrl);
        const hostname = parsed.hostname.toLowerCase();

        if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
            return new NextResponse('Only HTTPS URLs are allowed', { status: 400 });
        }

        if (!ALLOWED_HOSTS.has(hostname)) {
            return new NextResponse('Host is not allowed', { status: 403 });
        }

        if (isLocalhost(hostname) || await resolvesToPrivateIp(hostname)) {
            return new NextResponse('Host is not allowed', { status: 403 });
        }

        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            },
        });

        if (!response.ok) {
            return new NextResponse(`Failed to fetch from source: ${response.statusText}`, { status: response.status });
        }

        const data = await response.text();

        // Return with proper headers for the tool to work
        return new NextResponse(data, {
            status: 200,
            headers: {
                'Content-Type': 'application/xml',
                'Access-Control-Allow-Origin': '*',
            },
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        return new NextResponse(`Proxy error: ${message}`, { status: 500 });
    }
}
