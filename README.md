# News Intelligence Dashboard

A full-stack, self-hosted news aggregation and intelligence platform. Scrapy spiders collect articles from 20+ major news sources, store them in MongoDB, generate semantic embeddings, and serve them through a FastAPI backend to a Next.js dashboard with AI-powered search, clustering, recommendations, chat, and trend analytics.

---

## Architecture

```
news_scraper/          ← Scrapy + Playwright spiders (data ingestion)
       ↓
MongoDB (news_db)      ← Persistent storage with TTL index (7 days)
       ↓
Embeddings/            ← Sentence-transformer vector generation
       ↓
MongoDB/app.py         ← FastAPI REST API (port 8000)
       ↓
news-dashboard/        ← Next.js 16 frontend (port 3000)
```

---

## Features

| Feature | Description |
|---|---|
| **Multi-source scraping** | 20+ outlets across 7 categories via Scrapy + Playwright |
| **Semantic search** | Vector similarity search using `all-MiniLM-L6-v2` embeddings |
| **Topic clustering** | K-Means clustering of articles by semantic similarity |
| **Recommendations** | Cosine similarity recommendations per article |
| **RAG chatbot** | Ask questions answered from live article context via Gemini |
| **Trend analytics** | Keyword frequency, volume over time, category breakdown |
| **Auto-expiry** | Articles automatically deleted from MongoDB after 7 days |

---

## Project Structure

```
NEWS/
├── news_scraper/                  # Scrapy project
│   ├── news_scraper/
│   │   ├── spiders/
│   │   │   └── news_scraper.py    # Main spider (20+ sources, 7 categories)
│   │   ├── pipelines.py           # MongoDB upsert pipeline
│   │   ├── settings.py            # Scrapy + Playwright config
│   │   └── items.py               # NewsScraperItem schema
│   └── scrapy.cfg
│
├── Embeddings/
│   └── embeddings.py              # Batch embedding generator
│
├── MongoDB/
│   └── app.py                     # FastAPI server (all API endpoints)
│
├── news-dashboard/                # Next.js 16 frontend
│   ├── app/
│   │   ├── page.tsx               # Main dashboard page
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   └── api/                   # Next.js API route proxies
│   │       ├── news/route.ts
│   │       ├── search/route.ts
│   │       ├── clusters/route.ts
│   │       ├── recommend/route.ts
│   │       ├── chat/route.ts
│   │       └── trends/
│   │           ├── route.ts
│   │           ├── keywords/route.ts
│   │           └── volume/route.ts
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── StatsBar.tsx
│   │   ├── NewsCard.tsx
│   │   ├── SourceChart.tsx
│   │   ├── SemanticSearch.tsx
│   │   ├── ClustersPanel.tsx
│   │   ├── RelatedPanel.tsx
│   │   ├── NewsChat.tsx
│   │   └── TrendsPanel.tsx
│   └── package.json
│
└── Plan/
    ├── plan.txt                   # Development roadmap
    └── RUN.py                     # Single-command launcher
```

---

## Prerequisites

- Python 3.10+
- Node.js 18+
- MongoDB 6+ running locally on port 27017
- A [Google AI Studio](https://aistudio.google.com) API key (Gemini)
- Playwright browsers installed

---

## Setup

### 1. Clone and create environment

```bash
git clone <your-repo-url>
cd NEWS

python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
```

### 2. Install Python dependencies

```bash
pip install fastapi uvicorn pymongo sentence-transformers scikit-learn numpy \
            scrapy scrapy-playwright google-genai itemadapter
```

### 3. Install Playwright browsers

```bash
playwright install chromium
```

### 4. Install Node.js dependencies

```bash
cd news-dashboard
npm install
cd ..
```

### 5. Configure environment variables

Create a `.env` file in the `MongoDB/` directory:

```env
GEMINI_API_KEY=your_google_gemini_api_key_here
```

Export it before running the API:

```bash
export GEMINI_API_KEY=your_google_gemini_api_key_here
```

Or add it to your shell profile (`~/.zshrc`, `~/.bashrc`):

```bash
echo 'export GEMINI_API_KEY=your_key_here' >> ~/.zshrc
source ~/.zshrc
```

---


## Automated Scraping (Cron)

To keep the database updated every 6 hours:

```bash
crontab -e
```

Add this line (update the path to match your setup):

```
0 */6 * * * cd /path/to/NEWS && .venv/bin/python news_scraper/scraper.py && .venv/bin/python Embeddings/embeddings.py >> /path/to/NEWS/cron.log 2>&1
```

---

## API Reference

All endpoints are served by FastAPI on `http://localhost:8000`.

### `GET /news`
Returns latest articles, limited per source.

| Param | Type | Default | Description |
|---|---|---|---|
| `category` | string | — | Filter by category |
| `limit_per_source` | int | 20 | Max articles per source |

---

### `GET /search`
Semantic vector search across all embedded articles.

| Param | Type | Default | Description |
|---|---|---|---|
| `q` | string | required | Search query |
| `limit` | int | 10 | Number of results |

---

### `GET /clusters`
Groups all embedded articles into topic clusters using K-Means.

| Param | Type | Default | Description |
|---|---|---|---|
| `n_clusters` | int | 8 | Number of topic clusters |

---

### `GET /recommend/{article_id}`
Returns articles similar to the given article by cosine similarity.

| Param | Type | Default | Description |
|---|---|---|---|
| `article_id` | string | required | MongoDB `_id` of the source article |
| `limit` | int | 5 | Number of recommendations |

---

### `GET /chat`
RAG chatbot — retrieves relevant articles and answers using Gemini.

| Param | Type | Default | Description |
|---|---|---|---|
| `q` | string | required | Question to answer |
| `limit` | int | 5 | Articles to use as context |

---

### `GET /trends`
Category breakdown for a given time window.

| Param | Type | Default | Description |
|---|---|---|---|
| `hours` | int | 24 | Lookback window in hours |

---

### `GET /trends/keywords`
Top keywords appearing in article titles.

| Param | Type | Default | Description |
|---|---|---|---|
| `hours` | int | 24 | Lookback window in hours |
| `top_n` | int | 20 | Number of keywords to return |

---

### `GET /trends/volume`
Article publication volume bucketed by hour.

| Param | Type | Default | Description |
|---|---|---|---|
| `hours` | int | 24 | Lookback window in hours |
| `bucket_hours` | int | 1 | Bucket size in hours |

---

## News Sources

| Source | Categories |
|---|---|
| BBC | General, Technology, Health, Science, Business, Sports, Entertainment |
| CNN | General, Business, Sports, Technology, Health, Entertainment |
| Reuters | General, Business, Sports, Health, Science, Technology |
| AP News | General, Sports, Health, Science, Entertainment |
| The Guardian | General, Technology, Science, Entertainment |
| TechCrunch | Technology |
| CNBC | Business |
| Bloomberg | Business |
| ESPN | Sports |
| Al Jazeera | General News |
| Sky News | General News |
| NY Times | Business, Health |

---

## Dashboard Features

- **Category & source filter pills** — click to filter the feed instantly
- **Grid / list view toggle**
- **Client-side search** across titles, descriptions, and sources
- **Sort** by newest, oldest, source, or category
- **Semantic Search** — AI-powered search modal using vector similarity
- **Clusters** — view all articles grouped into topic clusters
- **Trends** — keyword frequency, hourly volume chart, category breakdown with 6h/24h/48h/7d windows
- **Related articles** — sidebar panel with cosine-similarity recommendations
- **News Chat** — floating chat interface powered by Gemini RAG

---

## Tech Stack

| Layer | Technology |
|---|---|
| Scraping | Scrapy 2.x + scrapy-playwright |
| Browser automation | Playwright (Chromium, headless) |
| Database | MongoDB 6+ |
| Embeddings | `sentence-transformers` (`all-MiniLM-L6-v2`) |
| API | FastAPI + Uvicorn |
| AI / LLM | Google Gemini 2.5 Flash |
| Frontend | Next.js 16 (App Router, Turbopack) |
| Styling | Tailwind CSS v4 |
| Animations | Framer Motion |

---




This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.
