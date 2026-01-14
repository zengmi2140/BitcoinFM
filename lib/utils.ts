export function formatDuration(duration: string | undefined): string {
    if (!duration) return '';
    
    if (duration.includes(':')) {
        const parts = duration.split(':').map(p => p.padStart(2, '0'));
        if (parts.length === 2) {
            return `00:${parts.join(':')}`;
        }
        return parts.join(':');
    }
    
    const totalSeconds = parseInt(duration, 10);
    if (isNaN(totalSeconds)) return duration;
    
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}
