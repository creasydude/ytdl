/**
 * YouTube Downloader Cloudflare Worker
 * Powered by Cobalt API (hp-api.iosphe.re) & NoEmbed
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Enable CORS
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // API routes
      if (url.pathname.startsWith('/api/')) {
        // Video info endpoint
        if (url.pathname === '/api/info') {
          const videoUrl = url.searchParams.get('url');

          if (!videoUrl) {
            return new Response(JSON.stringify({ error: 'Video URL is required' }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          const info = await getMetadata(videoUrl);

          return new Response(JSON.stringify(info), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }


        // Download endpoint
        if (url.pathname === '/api/download') {
          const videoUrl = url.searchParams.get('url');
          const format = url.searchParams.get('format') || 'video';
          const quality = url.searchParams.get('quality');

          if (!videoUrl) {
            return new Response(JSON.stringify({ error: 'Video URL is required' }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          const result = await loaderToDownload(videoUrl, format, quality);

          if (!result.status) {
            return new Response(JSON.stringify({ error: result.message || 'Download failed' }), {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Progress endpoint
        if (url.pathname === '/api/progress') {
          const id = url.searchParams.get('id');

          if (!id) {
            return new Response(JSON.stringify({ error: 'Job ID is required' }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          const progress = await loaderToProgress(id);

          return new Response(JSON.stringify(progress), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response('Not Found', {
          status: 404,
          headers: corsHeaders
        });
      }

      // Serve static assets using Workers Assets
      if (env.ASSETS) {
        return env.ASSETS.fetch(request);
      }

      return new Response('Assets not configured', { status: 500 });

    } catch (error) {
      console.error('Error:', error);
      return new Response(JSON.stringify({
        error: error.message || 'An error occurred'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  },
};

// Get video metadata using NoEmbed
async function getMetadata(url) {
  try {
    const noembedUrl = `https://noembed.com/embed?url=${encodeURIComponent(url)}`;
    const response = await fetch(noembedUrl);
    
    if (!response.ok) {
      throw new Error(`Metadata fetch failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.error) {
       throw new Error(data.error);
    }

    // Extract video ID from URL for fallback thumbnail
    const videoId = getYouTubeVideoId(url) || 'unknown';

    return {
      status: true,
      videoId: videoId,
      title: data.title || 'Unknown Title',
      duration: '0:00', // NoEmbed doesn't return duration
      thumbnail: data.thumbnail_url || `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
      availableFormats: {
        audio: [128], // loader.to MP3 default
        video: [360, 480, 720, 1080, 1440, 2160] // Common loader.to formats
      }
    };
  } catch (error) {
    throw new Error('Failed to get video info: ' + error.message);
  }
}

// Download using loader.to API
async function loaderToDownload(url, format, quality) {
  try {
    const API_URL = 'https://loader.to/ajax/download.php';
    
    // Map internal format/quality to loader.to "format" parameter
    let targetFormat = '720'; // default
    
    if (format === 'audio') {
      targetFormat = 'mp3';
    } else {
      // video
      if (quality) targetFormat = String(quality);
    }

    // loader.to expects: format (e.g. "mp3", "1080"), url
    const requestUrl = `${API_URL}?format=${targetFormat}&url=${encodeURIComponent(url)}`;
    
    const response = await fetch(requestUrl);
    const data = await response.json();

    if (!response.ok) {
      throw new Error('Loader.to API error');
    }
    
    // loader.to returns: { id: "...", success: true/false, ... }
    // It seems successful request returns { id: "..." } and doesn't explicitly say success: false unless error?
    // Based on curl, it returns `id`.

    if (!data.id) {
       throw new Error('No job ID returned from provider');
    }

    return {
      status: true,
      id: data.id,
      original_format: format,
      original_quality: quality
    };

  } catch (error) {
    console.error('Loader.to error:', error);
    return {
      status: false,
      message: 'Provider error: ' + error.message
    };
  }
}

// Check progress using loader.to API directly
async function loaderToProgress(id) {
  try {
    // Use the main domain for progress checks as p.savenow.to seems flaky/private
    const PROGRESS_URL = `https://loader.to/ajax/progress.php?id=${id}`;
    
    const response = await fetch(PROGRESS_URL);
    const data = await response.json();
    
    return data; 
  } catch (error) {
    return { success: 0, text: 'Progress check failed' };
  }
}

function getYouTubeVideoId(url) {
  const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|v\/|embed\/|user\/[^\/\n\s]+\/)?(?:watch\?v=|v%3D|embed%2F|video%2F)?|youtu\.be\/|youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/|youtube\.com\/playlist\?list=)([a-zA-Z0-9_-]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}
