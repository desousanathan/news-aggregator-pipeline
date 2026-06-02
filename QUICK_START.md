# NEWS Scraper - Quick Start Guide

## What Was Fixed & Improved

### 🔧 Scraper Issues (FIXED)
1. **CNN Not Scraping Properly** ✓
   - Added 6 fallback CSS selectors
   - Now scrapes all categories: General, Sports, Entertainment, Business, Health

2. **8 Missing News Parsers Implemented** ✓
   - Al Jazeera, Sky News, NY Times, Ars Technica
   - Science Daily, Variety, Fox News, Washington Post
   - Each with multiple fallback selectors

3. **All Parsers Now Have Fallbacks** ✓
   - BBC, CNN, Reuters, AP, Guardian, TechCrunch, ESPN, CNBC, Bloomberg

4. **Code Quality** ✓
   - Removed duplicate imports
   - Fixed duplicate code in semantic search
   - Proper error handling

### 📊 Dashboard UX (ENHANCED)
- Modern card design with animations
- Category & source filters with counts
- Real-time search
- View toggle (grid/list)
- Sort options
- Responsive mobile design
- Stats bar with analytics
- Source breakdown chart
- AI features (semantic search, clustering, trends)

### 🧪 Testing Suite (NEW)
- Comprehensive test script that validates:
  - All scrapers work
  - API endpoints respond
  - Database has content
  - Data quality checks
  - Trend analysis

## Quick Setup

### 1️⃣ Install Dependencies (first time only)
```bash
# MongoDB - already running locally
# Python dependencies
pip3 install scrapy scrapy-playwright pymongo fastapi uvicorn numpy scikit-learn sentence-transformers google-generativeai

# Node.js dependencies
cd /Users/nathandesousa/Desktop/Projects/Scraping/NEWS/news-dashboard
npm install
```

### 2️⃣ Start Services

**Option A: Automated (Recommended)**
```bash
/Users/nathandesousa/Desktop/Projects/Scraping/NEWS/run_all.sh
# Then choose option 1 to start everything
```

**Option B: Manual (run each in separate terminal)**

Terminal 1 - MongoDB:
```bash
mongod
```

Terminal 2 - FastAPI:
```bash
cd /Users/nathandesousa/Desktop/Projects/Scraping/NEWS/MongoDB
python app.py
```

Terminal 3 - Dashboard:
```bash
cd /Users/nathandesousa/Desktop/Projects/Scraping/NEWS/news-dashboard
npm run dev
```

Terminal 4 - Scraper:
```bash
cd /Users/nathandesousa/Desktop/Projects/Scraping/NEWS/news_scraper
scrapy crawl news_scraper
```

### 3️⃣ Access Dashboard
- **Dashboard**: http://localhost:3000
- **API**: http://localhost:8000/docs
- **MongoDB**: localhost:27017

## Testing Everything

```bash
python /Users/nathandesousa/Desktop/Projects/Scraping/NEWS/test_scraper.py
```

This will:
1. Run the scraper
2. Test all API endpoints
3. Verify database content
4. Check data quality
5. Test trends analysis

## What Sources Are Now Working?

| Source | Status | Categories |
|--------|--------|-----------|
| ESPN | ✓ Working | Sports |
| AP News | ✓ Working | General, Sports, Entertainment, Business, Health |
| BBC | ✓ Working | All 7 categories |
| CNN | ✓ Fixed | General, Sports, Entertainment, Business, Health |
| Reuters | ✓ Working | All 7 categories |
| The Guardian | ✓ Working | News, Culture, Technology |
| TechCrunch | ✓ Working | Technology |
| CNBC | ✓ Working | Business |
| Bloomberg | ✓ Working | Business |
| **Al Jazeera** | ✅ NEW | General News |
| **Sky News** | ✅ NEW | General News |
| **NY Times** | ✅ NEW | Business, Health |
| **Ars Technica** | ✅ NEW | Technology |
| **Science Daily** | ✅ NEW | Science |
| **Variety** | ✅ NEW | Entertainment |
| **Fox News** | ✅ NEW | General News |
| **Washington Post** | ✅ NEW | General News |

## Dashboard Features

### 🎯 Filters
- **Category**: Technology, Business, Sports, Health, Science, Entertainment, General News
- **Source**: Filter by news provider
- **Search**: Real-time article search
- **Sort**: Newest, Oldest, A-Z by source or category

### 👁️ View Modes
- **Grid**: Card-based view with images
- **List**: Compact table view

### 🤖 AI Features
- **Semantic Search**: Find similar articles
- **Clustering**: Group related articles
- **Trends**: See trending keywords and volume
- **Chat**: Ask questions about articles

### 📈 Analytics
- Stats bar showing total articles
- Source breakdown chart
- Category distribution

## Troubleshooting

### No articles showing?
```bash
# Check if MongoDB has data
mongo
> use news_db
> db.news.count()
```

### API not responding?
```bash
# Check if FastAPI is running
curl http://localhost:8000/news
```

### Scraper not finding articles?
1. Check internet connection
2. Run with more verbose output: `scrapy crawl news_scraper -L DEBUG`
3. Check `debug_html/` folder for saved page content

### Dashboard won't load?
1. Check Node.js version: `node -v` (need v16+)
2. Check npm: `npm -v`
3. Clear cache: `rm -rf node_modules/.next`

## Key Files

- **Scraper**: `/news_scraper/news_scraper/spiders/news_scraper.py`
- **API**: `/MongoDB/app.py`
- **Dashboard**: `/news-dashboard/app/page.tsx`
- **Tests**: `test_scraper.py`
- **Run Script**: `run_all.sh`
- **Changes Doc**: `IMPROVEMENTS.md`

## Performance Tips

1. **Faster scraping**: Reduce concurrent requests in `news_scraper/settings.py`
2. **Faster API**: Run embeddings separately for semantic search
3. **Better trends**: Let scraper run longer to accumulate data
4. **Faster dashboard**: Clear MongoDB old articles (auto-expires after 7 days)

## Next Steps

1. Run the scraper to collect initial data
2. Open dashboard at http://localhost:3000
3. Apply filters and explore articles
4. Run test suite to verify everything
5. Check trends after 1+ hour of scraping
6. (Optional) Run embeddings for semantic search

Enjoy your news scraper! 🎉
