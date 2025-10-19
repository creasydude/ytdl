# YouTube Downloader (ytdl)

A modern, minimal YouTube video and audio downloader built with React, Vite, and deployed on Cloudflare Workers. Features a beautiful cobalt.tools-inspired design with animated gradients and glassmorphism effects.

## Features

- 🎨 Clean, minimal, modern UI/UX inspired by cobalt.tools
- 🌙 Beautiful dark mode with animated gradient blobs
- 📹 Download videos in multiple qualities (144p - 1080p)
- 🎵 Download audio in multiple bitrates (92k - 320k)
- ⚡ Fast downloads powered by SaveTube.me API
- 🚀 Fully deployable on Cloudflare Workers with Workers Assets
- 📱 Responsive design for all devices
- 🎯 No rate limits, no bot detection issues

## Demo

Try it live: [Your deployed URL after running `npm run deploy`]

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS with custom animations
- **Icons**: Lucide React
- **Backend**: Cloudflare Workers (edge compute)
- **Static Assets**: Cloudflare Workers Assets
- **Download API**: SaveTube.me (with Web Crypto decryption)

## Prerequisites

- Node.js 18+ (recommended)
- npm or yarn
- Cloudflare account (for deployment)

## Installation

1. **Clone the repository:**
```bash
git clone <your-repo-url>
cd ytdl
```

2. **Install dependencies:**
```bash
npm install
```

3. **Configure environment variables:**

   Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and configure:
   ```env
   # API Configuration
   # Leave empty to use the same origin as the frontend (recommended for Workers deployment)
   # Or set to your custom API URL if deploying frontend separately
   VITE_API_URL=
   ```

   **Note:** If deploying everything to Cloudflare Workers, leave `VITE_API_URL` empty. The app will automatically use the same origin for API calls.

## Local Development

1. **Start the development server:**
```bash
npm run dev
```

2. **In a separate terminal, start the Cloudflare Worker locally:**
```bash
npm run worker:dev
```

The app will be available at `http://localhost:5173` (or another port if 5173 is busy).

## Deployment to Cloudflare Workers

### One-Time Setup

1. **Login to Cloudflare:**
```bash
npx wrangler login
```

2. **Update `wrangler.toml` (optional):**

   The default configuration works out of the box. Optionally customize:
   ```toml
   name = "ytdl-cloudflare"  # Change to your preferred worker name
   ```

### Deploy

Build the frontend and deploy to Cloudflare Workers:
```bash
npm run deploy
```

This command will:
1. Build the React frontend (`npm run build`)
2. Deploy the worker code and static assets to Cloudflare

Your app will be deployed and accessible via a `*.workers.dev` subdomain!

### Custom Domain (Optional)

To use a custom domain:

1. Add your domain to Cloudflare
2. Update `wrangler.toml`:
```toml
routes = [
  { pattern = "yourdomain.com", custom_domain = true }
]
```
3. Redeploy with `npm run deploy`

## Project Structure

```
ytdl/
├── src/
│   ├── App.tsx           # Main React component with UI
│   ├── main.tsx          # Entry point
│   └── index.css         # Global styles + Tailwind
├── worker/
│   └── index.js          # Cloudflare Worker backend
│       ├── API routes (/api/info, /api/download)
│       ├── Static asset serving (Workers Assets)
│       ├── SaveTube.me API integration
│       └── Web Crypto decryption
├── dist/                 # Build output (generated)
├── .env                  # Environment variables (create from .env.example)
├── .env.example          # Environment variables template
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── wrangler.toml         # Cloudflare Workers configuration
```

## API Endpoints

The Cloudflare Worker provides two main endpoints:

### GET `/api/info?url={youtube_url}`

Fetches video information including available formats.

**Parameters:**
- `url` (required): YouTube video URL

**Response:**
```json
{
  "status": true,
  "videoId": "dQw4w9WgXcQ",
  "title": "Video Title",
  "duration": "3:45",
  "thumbnail": "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
  "availableFormats": {
    "audio": [92, 128, 256, 320],
    "video": [144, 360, 480, 720, 1080]
  }
}
```

### GET `/api/download?url={youtube_url}&format={video|audio}&quality={quality}`

Gets the download URL for the specified format and quality.

**Parameters:**
- `url` (required): YouTube video URL
- `format` (optional): `video` or `audio` (default: `video`)
- `quality` (optional): Quality number (default: 360 for video, 128 for audio)
  - Audio: 92, 128, 256, 320 (kbps)
  - Video: 144, 360, 480, 720, 1080 (p)

**Response:**
```json
{
  "status": true,
  "quality": "720p",
  "downloadUrl": "https://cdn.savetube.vip/media/...",
  "filename": "Video Title (720p).mp4",
  "availableQualities": [144, 360, 480, 720, 1080]
}
```

## How It Works

1. **Frontend** (React + Vite):
   - User enters YouTube URL
   - Selects format (video/audio) and quality
   - Fetches video info and displays thumbnail, title, duration
   - Triggers download by opening the download URL

2. **Backend** (Cloudflare Worker):
   - Routes API requests to `/api/info` and `/api/download`
   - Integrates with SaveTube.me API to get video info and download links
   - Uses Web Crypto API to decrypt encrypted responses
   - Serves static assets (HTML, CSS, JS) using Workers Assets binding

3. **Download Flow**:
   - User clicks download → Worker gets CDN from SaveTube.me
   - Worker fetches encrypted video info → Decrypts using AES-CBC
   - Worker requests download URL with selected quality
   - User receives direct download link from SaveTube.me CDN

## Troubleshooting

### "Asset not found" or frontend not loading
- Make sure you ran `npm run build` before deploying
- Check that `wrangler.toml` has the correct `[assets]` configuration:
  ```toml
  [assets]
  directory = "./dist"
  binding = "ASSETS"
  ```

### "Invalid YouTube URL"
- Ensure the URL format is correct (supports youtube.com and youtu.be)
- Try copying the URL directly from your browser address bar

### "Download failed" or "Converting error"
- The SaveTube.me API might be temporarily unavailable
- Try a different video or wait a moment and retry
- Some videos might have restrictions (age-restricted, region-locked)

### Local development not working
- Make sure both `npm run dev` and `npm run worker:dev` are running
- Check that port 5173 is not blocked by firewall
- Verify Node.js version is 18 or higher

### Environment variable not working
- Remember to rebuild after changing `.env`: `npm run build`
- For Vite env vars, use `VITE_` prefix
- In production, leave `VITE_API_URL` empty to use same origin

## Limitations

- Download speeds depend on SaveTube.me CDN availability
- Some videos may be restricted (age-restricted, region-locked, private)
- Download URLs from SaveTube.me may expire after some time
- No OAuth support for private videos

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Credits

- UI/UX inspired by [cobalt.tools](https://cobalt.tools)
- Download API powered by [SaveTube.me](https://savetube.me)
- Built with [Cloudflare Workers](https://workers.cloudflare.com)
- Original SaveTube integration adapted from [@vreden/youtube_scraper](https://www.npmjs.com/package/@vreden/youtube_scraper)

## Author

Built by [creasydude](https://github.com/creasydude)
