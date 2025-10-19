import { Download, Clock, Eye, Calendar, FileVideo } from 'lucide-react';
import { VideoInfo } from '../types';
import { formatDuration, formatViews, formatFileSize, downloadVideo } from '../utils/api';
import { useState } from 'react';

interface VideoCardProps {
  videoInfo: VideoInfo;
}

export default function VideoCard({ videoInfo }: VideoCardProps) {
  const [selectedFormat, setSelectedFormat] = useState<string>(
    videoInfo.formats[0]?.itag.toString() || ''
  );
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      await downloadVideo(
        `https://www.youtube.com/watch?v=${videoInfo.title}`,
        selectedFormat
      );
    } catch (error) {
      console.error('Download error:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-light-surface dark:bg-dark-surface rounded-2xl overflow-hidden shadow-lg transition-all duration-300">
      <div className="relative aspect-video">
        <img
          src={videoInfo.thumbnail}
          alt={videoInfo.title}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="p-6">
        <h2 className="text-2xl font-bold text-light-text dark:text-dark-text mb-2">
          {videoInfo.title}
        </h2>
        <p className="text-light-muted dark:text-dark-muted mb-4">
          {videoInfo.author}
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div className="flex items-center gap-2 text-light-muted dark:text-dark-muted">
            <Clock className="w-4 h-4" />
            <span className="text-sm">{formatDuration(videoInfo.duration)}</span>
          </div>
          <div className="flex items-center gap-2 text-light-muted dark:text-dark-muted">
            <Eye className="w-4 h-4" />
            <span className="text-sm">{formatViews(videoInfo.views)} views</span>
          </div>
          <div className="flex items-center gap-2 text-light-muted dark:text-dark-muted col-span-2 md:col-span-1">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">{videoInfo.uploadDate}</span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <FileVideo className="w-5 h-5 text-light-muted dark:text-dark-muted" />
            <label htmlFor="format" className="text-light-text dark:text-dark-text font-medium">
              Select Quality
            </label>
          </div>

          <select
            id="format"
            value={selectedFormat}
            onChange={(e) => setSelectedFormat(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {videoInfo.formats.map((format) => (
              <option key={format.itag} value={format.itag.toString()}>
                {format.quality} - {format.container.toUpperCase()}
                {format.fps && ` (${format.fps}fps)`}
                {format.filesize && ` - ${formatFileSize(format.filesize)}`}
              </option>
            ))}
          </select>

          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            {isDownloading ? 'Preparing Download...' : 'Download Video'}
          </button>
        </div>
      </div>
    </div>
  );
}
