![WallWidgy](/thumb.png)
# WallWidgy

A minimal and fast wallpaper site built with Next.js.   

## Features

- Fast and optimized image delivery
- Beautiful wallpaper browser with modal view and navigation
- Real-time search with device filtering (PC/Mobile)
- Favorites system with local storage
- AI-based similar wallpaper recommendations
- Fully responsive mobile design
- Dark theme with smooth animations
- RESTful API with color and category filtering
- Android back gesture support
- Improved search functionality with device-based filtering
- AI-powered wallpaper suggestions based on style

## Tech Stack

- Framework: Next.js 14.2.16
- Language: TypeScript
- Styling: Tailwind CSS
- Data: GitHub-hosted index.json
- Deployment: Vercel

## Getting Started

```bash
npm install
npm run dev
```

Visit `http://localhost:3000`

## Build

```bash
npm run build
npm start
```

## API

The platform provides a comprehensive REST API for wallpaper data:

### Random Wallpaper
```
GET /api/random-wallpaper
```

### Multiple Random Wallpapers
```
GET /api/random-wallpapers?count=5
```

### Search Wallpapers
```
GET /api/wallpapers/search?q=anime&count=10
```

### Filter by Device Type
```
GET /api/wallpapers?type=desktop&count=20
GET /api/wallpapers?type=mobile&count=20
```

### Filter by Color
```
GET /api/wallpapers?color=blue&count=10
```

Supported colors: red, blue, green, yellow, purple, orange, pink, brown, black, white, gray, cyan, magenta, and more.

### Filter by Category
```
GET /api/wallpapers?category=anime&count=15
```

### Get Available Colors
```
GET /api/colors
```

**Features:**
- No authentication required
- CORS enabled for cross-origin requests
- Comprehensive documentation at `/api`
- Support for combining multiple filters

## Latest Updates (v2.0)

- Enhanced search and performance improvements
- AI-based recommendations for wallpaper discovery
- Device filtering (Desktop/Mobile) with visual indicators
- Color-based filtering API
- Bug fixes and stability improvements

## About

WallWidgy is a curated collection of high-quality wallpapers designed for enthusiasts who appreciate clean, minimalist, and artistic designs. The platform provides a seamless experience for discovering and downloading beautiful wallpapers optimized for both desktop and mobile devices.

### The Platform

- Minimalist design with clean interfaces
- High-quality wallpapers from trusted sources
- Free to use for personal and commercial purposes
- Fast image delivery via GitHub CDN
- Responsive design for all devices

### Created by

Ayan - A designer from Assam, India trying to make cool stuff that works well.

Reach out:
- GitHub: https://github.com/not-ayan
- Email: notayan99@gmail.com
- Telegram: https://t.me/Not_ayan99

## License

MIT - Feel free to use, modify, and repurpose.
