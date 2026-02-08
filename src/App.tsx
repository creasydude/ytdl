import { useState, useEffect } from 'react';
import { Download, Sparkles, Music, Video, Loader2, Check, AlertCircle, Sun, Moon, Monitor } from 'lucide-react';

interface VideoInfo {
  status: boolean;
  videoId: string;
  title: string;
  duration: string;
  thumbnail: string;
  availableFormats: {
    audio: number[];
    video: number[];
  };
}

interface DownloadResult {
  status: boolean;
  quality: string;
  downloadUrl: string;
  filename: string;
  availableQualities: number[];
}

export default function App() {
  const [url, setUrl] = useState('');
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [downloadResult, setDownloadResult] = useState<DownloadResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<'video' | 'audio'>('video');
  const [selectedQuality, setSelectedQuality] = useState<number | null>(null);

  // API base URL - use environment variable or fallback to current origin
  const API_BASE = import.meta.env.VITE_API_URL || window.location.origin;

  const handleGetInfo = async () => {
    if (!url.trim()) return;

    setIsLoading(true);
    setError(null);
    setVideoInfo(null);
    setDownloadResult(null);

    try {
      const response = await fetch(`${API_BASE}/api/info?url=${encodeURIComponent(url)}`);
      const data = await response.json();

      if (!response.ok || !data.status) {
        throw new Error(data.error || 'Failed to fetch video info');
      }

      setVideoInfo(data);
      setSelectedQuality(selectedFormat === 'video' ? 720 : 128);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const [loadingText, setLoadingText] = useState<string | null>(null);

  const pollProgress = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/progress?id=${id}`);
      const data = await response.json();

      if (data.success === 1 && data.download_url) {
        setDownloadResult({
          status: true,
          quality: 'Standard', // loader.to doesn't return quality in progress, assumes requested
          downloadUrl: data.download_url,
          filename: 'video', // Generic filename
          availableQualities: []
        });
        setIsLoading(false);
        setLoadingText(null);
        
        // Trigger download without opening new tab if possible, or use _self for download links
        const link = document.createElement('a');
        link.href = data.download_url;
        link.setAttribute('download', ''); // hint to browser
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        return;
      }
      
      if (data.text) {
        setLoadingText(data.text);
      }

      // Continue polling
      setTimeout(() => pollProgress(id), 2000);
    } catch (err) {
      console.error('Polling error:', err);
      // Don't stop polling on single network error, maybe retry?
      // For now, just retry
      setTimeout(() => pollProgress(id), 2000);
    }
  };

  const handleDownload = async () => {
    if (!videoInfo || !selectedQuality) return;

    setIsLoading(true);
    setLoadingText('Starting...');
    setError(null);
    setDownloadResult(null);

    try {
      const response = await fetch(
        `${API_BASE}/api/download?url=${encodeURIComponent(url)}&format=${selectedFormat}&quality=${selectedQuality}`
      );
      const data = await response.json();

      if (!response.ok || !data.status || !data.id) {
        throw new Error(data.error || 'Failed to start download');
      }

      // Start polling
      pollProgress(data.id);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsLoading(false);
      setLoadingText(null);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      if (!videoInfo) {
        handleGetInfo();
      } else {
        handleDownload();
      }
    }
  };

  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');

  useEffect(() => {
    const root = window.document.documentElement;
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  const getThemeIcon = () => {
    if (theme === 'light') return <Sun className="w-5 h-5" />;
    if (theme === 'dark') return <Moon className="w-5 h-5" />;
    return <Monitor className="w-5 h-5" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-black transition-colors duration-300">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 dark:bg-purple-900 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl opacity-20 animate-blob transition-colors duration-300"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 dark:bg-yellow-900 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl opacity-20 animate-blob animation-delay-2000 transition-colors duration-300"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 dark:bg-pink-900 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl opacity-20 animate-blob animation-delay-4000 transition-colors duration-300"></div>
      </div>

      <div className="relative max-w-4xl mx-auto px-4 py-12 md:py-20">
        {/* Header */}
        <div className="text-center mb-12 relative">
          <button
            onClick={toggleTheme}
            className="absolute right-0 top-0 p-2 rounded-full bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 transition-all"
            title={`Current theme: ${theme}`}
          >
            {getThemeIcon()}
          </button>
          
          <div className="inline-flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
              ytdl
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base">
            download youtube videos & audio in seconds
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 md:p-8 space-y-6">
          {/* URL Input */}
          <div className="space-y-4">
            <div className="relative">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="paste youtube link here..."
                disabled={isLoading}
                className="w-full px-6 py-4 bg-gray-100 dark:bg-gray-900/50 rounded-2xl border-2 border-transparent focus:border-purple-500 dark:focus:border-purple-400 outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all disabled:opacity-50"
              />
            </div>

            {/* Format Toggle */}
            {!videoInfo && (
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedFormat('video')}
                  className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all ${
                    selectedFormat === 'video'
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                      : 'bg-gray-100 dark:bg-gray-900/50 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800'
                  }`}
                >
                  <Video className="w-4 h-4 inline mr-2" />
                  Video
                </button>
                <button
                  onClick={() => setSelectedFormat('audio')}
                  className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all ${
                    selectedFormat === 'audio'
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                      : 'bg-gray-100 dark:bg-gray-900/50 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800'
                  }`}
                >
                  <Music className="w-4 h-4 inline mr-2" />
                  Audio
                </button>
              </div>
            )}

            {/* Action Button */}
            <button
              onClick={videoInfo ? handleDownload : handleGetInfo}
              disabled={isLoading || !url.trim()}
              className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-2xl shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {loadingText || 'processing...'}
                </>
              ) : videoInfo ? (
                <>
                  <Download className="w-5 h-5" />
                  Download {selectedFormat}
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Get started
                </>
              )}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-800 dark:text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Video Info */}
          {videoInfo && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex gap-4">
                <img
                  src={videoInfo.thumbnail}
                  alt={videoInfo.title}
                  className="w-32 h-24 object-cover rounded-xl"
                  onError={(e) => {
                    e.currentTarget.src = `https://i.ytimg.com/vi/${videoInfo.videoId}/mqdefault.jpg`;
                  }}
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm md:text-base line-clamp-2">
                    {videoInfo.title}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                    Duration: {videoInfo.duration}
                  </p>
                </div>
              </div>

              {/* Quality Selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Select Quality
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(selectedFormat === 'video' ? videoInfo.availableFormats.video : videoInfo.availableFormats.audio).map((quality) => (
                    <button
                      key={quality}
                      onClick={() => setSelectedQuality(quality)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        selectedQuality === quality
                          ? 'bg-purple-600 text-white shadow-md'
                          : 'bg-gray-100 dark:bg-gray-900/50 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800'
                      }`}
                    >
                      {quality}{selectedFormat === 'audio' ? 'k' : 'p'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Download Success */}
          {downloadResult && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-green-800 dark:text-green-300 text-sm font-medium">
                  Download started!
                </p>
                <p className="text-green-600 dark:text-green-400 text-xs mt-1">
                  Quality: {downloadResult.quality}
                </p>
                <a
                  href={downloadResult.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-700 dark:text-green-300 text-xs mt-2 inline-block hover:underline"
                >
                  Click here if download didn't start
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-gray-500 dark:text-gray-400 text-xs">
            powered by <a href="https://github.com/creasydude" className="hover:text-purple-500 transition-colors" target="_blank" rel="noopener noreferrer">creasy</a> • built with cloudflare workers
          </p>
        </div>
      </div>

      <style>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          25% {
            transform: translate(20px, -50px) scale(1.1);
          }
          50% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          75% {
            transform: translate(50px, 50px) scale(1.05);
          }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }

        .animate-in {
          animation: fadeInSlide 0.5s ease-out;
        }

        @keyframes fadeInSlide {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
