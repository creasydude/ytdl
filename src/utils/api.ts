import { VideoInfo } from '../types';

const API_BASE = import.meta.env.DEV ? 'http://localhost:8787' : '';

export async function getVideoInfo(url: string): Promise<VideoInfo> {
  const response = await fetch(`${API_BASE}/api/info?url=${encodeURIComponent(url)}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch video info');
  }

  return response.json();
}

export async function downloadVideo(url: string, itag?: string): Promise<void> {
  const downloadUrl = itag
    ? `${API_BASE}/api/download?url=${encodeURIComponent(url)}&itag=${itag}`
    : `${API_BASE}/api/download?url=${encodeURIComponent(url)}`;

  window.open(downloadUrl, '_blank');
}

export function formatFileSize(bytes?: string): string {
  if (!bytes) return 'Unknown size';

  const size = parseInt(bytes);
  if (isNaN(size)) return 'Unknown size';

  const units = ['B', 'KB', 'MB', 'GB'];
  let unitIndex = 0;
  let fileSize = size;

  while (fileSize >= 1024 && unitIndex < units.length - 1) {
    fileSize /= 1024;
    unitIndex++;
  }

  return `${fileSize.toFixed(2)} ${units[unitIndex]}`;
}

export function formatDuration(seconds: string): string {
  const duration = parseInt(seconds);
  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor((duration % 3600) / 60);
  const secs = duration % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export function formatViews(views: string): string {
  const count = parseInt(views);
  if (isNaN(count)) return '0';

  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}
