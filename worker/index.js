/**
 * YouTube Downloader Cloudflare Worker
 * Adapted from @vreden/youtube_scraper for edge runtime
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

          const videoId = getYouTubeVideoId(videoUrl);
          if (!videoId) {
            return new Response(JSON.stringify({ error: 'Invalid YouTube URL' }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          const info = await getVideoInfo('https://youtube.com/watch?v=' + videoId);

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

          const videoId = getYouTubeVideoId(videoUrl);
          if (!videoId) {
            return new Response(JSON.stringify({ error: 'Invalid YouTube URL' }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          const link = 'https://youtube.com/watch?v=' + videoId;

          // Validate and set quality
          const audioQualities = [92, 128, 256, 320];
          const videoQualities = [144, 360, 480, 720, 1080];

          let selectedQuality;
          if (format === 'audio') {
            selectedQuality = quality && audioQualities.includes(Number(quality)) ? Number(quality) : 128;
          } else {
            selectedQuality = quality && videoQualities.includes(Number(quality)) ? Number(quality) : 360;
          }

          const result = await savetube(link, selectedQuality, format);

          if (!result.status) {
            return new Response(JSON.stringify({ error: result.message || 'Download failed' }), {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          // Return the direct download URL
          return new Response(JSON.stringify({
            status: true,
            quality: result.quality,
            downloadUrl: result.url,
            filename: result.filename,
            availableQualities: result.availableQuality
          }), {
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

function getYouTubeVideoId(url) {
  const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|v\/|embed\/|user\/[^\/\n\s]+\/)?(?:watch\?v=|v%3D|embed%2F|video%2F)?|youtu\.be\/|youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/|youtube\.com\/playlist\?list=)([a-zA-Z0-9_-]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

// Decode encrypted data using Web Crypto API
async function decode(enc) {
  try {
    const secret_key = 'C5D58EF67A7584E4A29F6C35BBC4EB12';

    // Convert base64 to array buffer
    const data = Uint8Array.from(atob(enc), c => c.charCodeAt(0));

    // Extract IV (first 16 bytes) and content
    const iv = data.slice(0, 16);
    const content = data.slice(16);

    // Convert hex key to bytes
    const keyData = new Uint8Array(secret_key.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

    // Import key
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'AES-CBC', length: 128 },
      false,
      ['decrypt']
    );

    // Decrypt
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-CBC', iv: iv },
      key,
      content
    );

    // Convert to string and parse JSON
    const decoder = new TextDecoder();
    return JSON.parse(decoder.decode(decrypted));
  } catch (error) {
    throw new Error('Decryption failed: ' + error.message);
  }
}

async function savetube(link, quality, value) {
  try {
    // Get CDN
    const cdnResponse = await fetch('https://media.savetube.me/api/random-cdn');
    const cdnData = await cdnResponse.json();
    const cdn = cdnData.cdn;

    console.log('Using CDN:', cdn);

    // Get video info
    const infoResponse = await fetch(`https://${cdn}/v2/info`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Mobile Safari/537.36',
        'Referer': 'https://yt.savetube.me/1kejjj1?id=362796039'
      },
      body: JSON.stringify({ url: link })
    });

    const infoData = await infoResponse.json();
    console.log('Info response:', JSON.stringify(infoData));

    if (!infoData.data) {
      throw new Error('No data in info response');
    }

    const info = await decode(infoData.data);
    console.log('Decoded info:', JSON.stringify(info));

    // Get download URL
    const downloadResponse = await fetch(`https://${cdn}/download`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Mobile Safari/537.36',
        'Referer': 'https://yt.savetube.me/start-download?from=1kejjj1%3Fid%3D362796039'
      },
      body: JSON.stringify({
        downloadType: value,
        quality: String(quality),
        key: info.key
      })
    });

    const downloadData = await downloadResponse.json();
    console.log('Download response:', JSON.stringify(downloadData));

    if (!downloadData || !downloadData.data) {
      throw new Error('Invalid download response: ' + JSON.stringify(downloadData));
    }

    // Handle different response structures
    const downloadUrl = downloadData.data.downloadUrl || downloadData.data.url || downloadData.downloadUrl;

    if (!downloadUrl) {
      throw new Error('No download URL found in response: ' + JSON.stringify(downloadData));
    }

    return {
      status: true,
      quality: `${quality}${value === 'audio' ? 'kbps' : 'p'}`,
      availableQuality: value === 'audio' ? [92, 128, 256, 320] : [144, 360, 480, 720, 1080],
      url: downloadUrl,
      filename: `${info.title} (${quality}${value === 'audio' ? 'kbps).mp3' : 'p).mp4'})`
    };
  } catch (error) {
    console.error('Converting error:', error);
    return {
      status: false,
      message: 'Converting error: ' + error.message
    };
  }
}

async function getVideoInfo(link) {
  try {
    const videoId = getYouTubeVideoId(link);
    if (!videoId) {
      throw new Error('Invalid YouTube URL');
    }

    // Use SaveTube API to get basic info
    const cdnResponse = await fetch('https://media.savetube.me/api/random-cdn');
    const cdnData = await cdnResponse.json();
    const cdn = cdnData.cdn;

    const infoResponse = await fetch(`https://${cdn}/v2/info`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Mobile Safari/537.36',
        'Referer': 'https://yt.savetube.me/'
      },
      body: JSON.stringify({ url: link })
    });

    const infoData = await infoResponse.json();
    const info = await decode(infoData.data);

    return {
      status: true,
      videoId: videoId,
      title: info.title,
      duration: info.duration,
      thumbnail: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
      availableFormats: {
        audio: [92, 128, 256, 320],
        video: [144, 360, 480, 720, 1080]
      }
    };
  } catch (error) {
    throw new Error('Failed to get video info: ' + error.message);
  }
}
