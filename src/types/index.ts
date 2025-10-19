export interface VideoInfo {
  title: string;
  author: string;
  thumbnail: string;
  duration: string;
  views: string;
  uploadDate: string;
  formats: VideoFormat[];
}

export interface VideoFormat {
  itag: number;
  quality: string;
  container: string;
  mimeType: string;
  filesize?: string;
  fps?: number;
}

export interface DownloadState {
  isDownloading: boolean;
  progress: number;
  error: string | null;
}
