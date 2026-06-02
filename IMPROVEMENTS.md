# NEWS Scraper - Improvements & Fixes

## Phase 1: Scraper Fixes ✓ COMPLETED

### 1. Fixed CNN Scraper
- **Issue**: CNN only scraped limited articles, missing categories
- **Solution**: Added multiple fallback CSS selectors for better robustness
- **Selectors Added**: 
  - `a.container__link` (primary)
  - `span[data-testid='headline'] a`
  - `a[data-analytics-area='card-headline']`
  - `div[class*='container__headline'] a`
  - `article a`
  - `div[class*='card'] a`

### 2. Implemented 8 Missing Parsers
Implemented full parsers for:
- ✓ Al Jazeera
- ✓ Sky News
- ✓ NY Times
- ✓ Ars Technica
- ✓ Science Daily
- ✓ Variety
- ✓ Fox News
- ✓ Washington Post

Each parser includes:
- Multiple fallback CSS selectors for robustness
- Proper logging with source identification
- Duplicate prevention with URL tracking
- Description extraction where available
- Category and source tagging

### 3. Added Fallback Selectors to All Parsers
All existing parsers now have:
- Primary selector
- 2-3 fallback selectors
- Generic article/card selector fallbacks
- Text extraction from nested elements

### 4. Fixed Code Quality Issues
- ✓ Removed duplicate `import os` statements
- ✓ Fixed duplicate lines in semantic search endpoint
- ✓ Removed debug `print(seen)` statement
- ✓ Replaced `print()` statements with logger calls (kept print for visibility)
- ✓ Added print statements showing domain being parsed

### 5. Added Error Handling
- Added try-catch to semantic search endpoint
- Improved error messages with HTTPException
- Added source validation in recommend endpoint

## Phase 2: API Fixes (In Progress)

### FastAPI Backend Improvements
- [x] Remove duplicate imports
- [x] Fix semantic search duplicates
- [x] Add error handling to search endpoint
- [ ] Add embeddings pipeline integration
- [ ] Improve keyword extraction
- [ ] Add caching to trends endpoints

## Phase 3: Dashboard UX Enhancements (Ready)

### Implemented Features
1. **Responsive Design**
   - Mobile sidebar toggle for filters
   - Touch-friendly filter buttons
   - Collapsible source breakdown

2. **Interactive Filters**
   - Category filter with counts
   - Source filter with counts
   - Real-time search
   - Sort options (newest, oldest, source, category)

3. **View Modes**
   - Grid view (responsive cards)
   - List view (compact rows)
   - Toggle with instant switching

4. **Animations & Transitions**
   - Smooth card entrance animations
   - Hover effects on cards
   - Filter button interactions
   - "LIVE" indicator animation

5. **AI Features**
   - Semantic search panel
   - Article clustering
   - Trend analysis with keywords
   - AI chat with Gemini

6. **Analytics**
   - Stats bar with totals
   - Source breakdown chart
   - Category distribution
   - Trend visualization

## Testing

### Comprehensive Test Suite
Run the test suite to verify everything:

```bash
python /Users/nathandesousa/Desktop/Projects/Scraping/NEWS/test_scraper.py
```

The test suite checks:
1. **Scraper**: Runs the spider and verifies all sources parse
2. **API Endpoints**: Tests all 6 main endpoints
3. **Database Content**: Verifies articles are in MongoDB
4. **Data Quality**: Validates article fields
5. **Trends**: Tests keyword and volume endpoints

## Usage

### 1. Start MongoDB
```bash
mongod
```

### 2. Start FastAPI Backend
```bash
cd /Users/nathandesousa/Desktop/Projects/Scraping/NEWS/MongoDB
python app.py
```

### 3. Start Next.js Dashboard
```bash
cd /Users/nathandesousa/Desktop/Projects/Scraping/NEWS/news-dashboard
npm run dev
```

### 4. Run Scraper
```bash
cd /Users/nathandesousa/Desktop/Projects/Scraping/NEWS/news_scraper
scrapy crawl news_scraper
```

### 5. Run Tests
```bash
python /Users/nathandesousa/Desktop/Projects/Scraping/NEWS/test_scraper.py
```

## Configuration

### Sources Working
- [x] ESPN - Sports content
- [x] AP News - General, Sports, Entertainment, Business, Health
- [x] BBC - All categories with good coverage
- [x] CNN - General, Sports, Entertainment, Business, Health (enhanced)
- [x] Reuters - All categories
- [x] The Guardian - News and culture
- [x] TechCrunch - Technology
- [x] CNBC - Business
- [x] Bloomberg - Business
- [x] Al Jazeera - General News (NEW)
- [x] Sky News - General News (NEW)
- [x] NY Times - Business, Health (NEW)
- [x] Ars Technica - Technology (NEW)
- [x] Science Daily - Science (NEW)
- [x] Variety - Entertainment (NEW)
- [x] Fox News - General News (NEW)
- [x] Washington Post - General News (NEW)

### Categories Supported
- General News
- Technology
- Sports
- Business
- Entertainment
- Health
- Science

## Performance Optimizations

1. **Caching**: Results are cached at API level
2. **Connection pooling**: MongoDB connections are reused
3. **Rate limiting**: 3-second delays between domain requests
4. **Resource blocking**: Images, media, fonts blocked in scraper
5. **Concurrent requests**: Limited to 4 total, 1 per domain

## Known Limitations

1. **Embeddings**: Embedding pipeline needs to be run separately to enable semantic search
2. **Trends**: Require sufficient data (new DB may show empty trends initially)
3. **Gemini API**: Requires valid GEMINI_API_KEY environment variable for chat

## Next Steps (Optional)

1. **Add embeddings pipeline**: Run embeddings script separately to populate vectors
2. **Improve mobile**: Further polish for mobile experience
3. **Add more sources**: Can easily add more news sites
4. **Cache layer**: Add Redis for faster trend queries
5. **Export feature**: Allow exporting articles to CSV/PDF

## Troubleshooting

**No articles appearing?**
- Check if MongoDB is running: `mongo`
- Check if FastAPI is running: `curl http://localhost:8000/news`
- Run scraper: `scrapy crawl news_scraper` in news_scraper directory

**Trends not working?**
- Need sufficient articles in database
- Wait 5+ minutes after running scraper
- Check if MongoDB has data: `db.news.count()`

**Search not working?**
- Requires embedding field in articles
- Run embeddings script: `python Embeddings/embeddings.py`
- Check MongoDB for embedding field: `db.news.findOne({"embedding": {$exists: true}})`

**API endpoints slow?**
- Increase MongoDB index performance
- Clear old articles (7-day TTL is automatic)
- Reduce query limit

