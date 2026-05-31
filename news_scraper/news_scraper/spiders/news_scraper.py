import os
import scrapy
import urllib
from news_scraper.items import NewsScraperItem
from scrapy_playwright.page import PageMethod


class NewsScraperSpider(scrapy.Spider):
    name = "news_scraper"
    
    allowed_domains = [
        "bbc.com", "www.bbc.com", "feeds.bbci.co.uk",
        "apnews.com", "www.apnews.com",
        "aljazeera.com", "www.aljazeera.com",
        "theguardian.com", "www.theguardian.com",
        "techcrunch.com", "www.techcrunch.com",
        "espn.com", "www.espn.com",
        "arstechnica.com", "www.arstechnica.com",
        "wired.com", "www.wired.com",
        "variety.com", "www.variety.com",
        "sciencedaily.com", "www.sciencedaily.com",
        "npr.org", "feeds.npr.org",
        "dw.com", "rss.dw.com",
        "feeds.skynews.com", "news.sky.com",
        "slashdot.org", "rss.slashdot.org",
        "medicalnewstoday.com", "rss.medicalnewstoday.com",
        "cnn.com", "edition.cnn.com",
        "reuters.com", "cnbc.com", "bloomberg.com", "nytimes.com",
        "foxnews.com", "washingtonpost.com"
    ]
    
    source_map = {
        "bbc.com":              "BBC",
        "feeds.bbci.co.uk":     "BBC",
        "apnews.com":           "AP News",
        "aljazeera.com":        "Al Jazeera",
        "theguardian.com":      "The Guardian",
        "techcrunch.com":       "TechCrunch",
        "espn.com":             "ESPN",
        "arstechnica.com":      "Ars Technica",
        "wired.com":            "Wired",
        "variety.com":          "Variety",
        "sciencedaily.com":     "Science Daily",
        "npr.org":              "NPR",
        "feeds.npr.org":        "NPR",
        "dw.com":               "Deutsche Welle",
        "rss.dw.com":           "Deutsche Welle",
        "feeds.skynews.com":    "Sky News",
        "news.sky.com":         "Sky News",
        "slashdot.org":         "Slashdot",
        "medicalnewstoday.com": "Medical News Today",
        "cnn.com":              "CNN",
        "reuters.com":          "Reuters",
        "cnbc.com":             "CNBC",
        "bloomberg.com":        "Bloomberg",
        "nytimes.com":          "NY Times",
        "foxnews.com":          "Fox News",
        "washingtonpost.com":   "Washington Post"
    }

    def start_requests(self):
        target_themes = {
            "General News": [
                "bbc.com/news", "cnn.com/world", "reuters.com/world",
                "apnews.com", "aljazeera.com/news", "news.sky.com/world",
                "theguardian.com/world",
            ],
            "Sports": [
                "bbc.com/sport", "edition.cnn.com/sport", "espn.com",
                "reuters.com/lifestyle/sports", "apnews.com/sports",
            ],
            "Entertainment": [
                "bbc.com/news/entertainment_and_arts", "edition.cnn.com/entertainment",
                "reuters.com/lifestyle", "apnews.com/entertainment", "theguardian.com/uk/culture",
            ],
            "Business": [
                "bbc.com/news/business", "cnbc.com/business", "bloomberg.com",
                "reuters.com/business", "edition.cnn.com/business", "nytimes.com/section/business",
            ],
            "Technology": [
                "bbc.com/news/technology", "techcrunch.com", "reuters.com/technology",
                "edition.cnn.com/business/tech", "theguardian.com/uk/technology",
            ],
            "Health": [
                "bbc.com/news/health", "edition.cnn.com/health",
                "reuters.com/business/healthcare-pharmaceuticals", "apnews.com/health",
                "nytimes.com/section/health",
            ],
            "Science": [
                "bbc.com/news/science_and_environment", "reuters.com/world/science",
                "edition.cnn.com/world", "apnews.com/hub/science", "theguardian.com/science",
            ],
        }

        render_heavy_domains = ["bbc.com", "cnn.com", "reuters.com", "cnbc.com", "bloomberg.com", "nytimes.com", "sky.com", "washingtonpost.com"]

        for category, urls in target_themes.items():
            for partial_urls in urls:
                full_url = f"https://{partial_urls}"
                parsed_url = urllib.parse.urlparse(full_url)
                domain = parsed_url.netloc.replace("www.", "")

                source = "Unknown"
                for key, val in self.source_map.items():
                    if key in domain:
                        source = val
                        break

                meta = {
                    "source": source,
                    "category": category,
                }
                
                if any(rh in domain for rh in render_heavy_domains):
                    meta["playwright_page_goto_kwargs"] = {
                        "wait_until": "domcontentloaded", 
                        "timeout": 20000
                    }
                    
                    if "bbc.com" in domain:
                        meta["playwright_page_methods"] = [
                            PageMethod("wait_for_selector", "a", timeout=10000),
                        ]
                    elif "cnn.com" in domain:
                        meta["playwright_page_methods"] = [
                            PageMethod("wait_for_selector", "a.container__link", timeout=15000),
                        ]
                    elif "espn.com" in domain:
                        meta["playwright_page_methods"] = [
                            PageMethod("wait_for_selector", "section.contentItem", timeout=15000),
                        ]
                    elif "theguardian.com" in domain:
                        meta["playwright_page_methods"] = [
                            PageMethod("wait_for_selector", "a[data-link-name='article']", timeout=15000),
                        ]
                
                yield scrapy.Request(url=full_url, callback=self.parse, errback=self.log_error, meta=meta)

    def parse(self, response):
        netloc = response.url.split("/")[2]
        domain = netloc[4:] if netloc.startswith("www.") else netloc

        os.makedirs("debug_html", exist_ok=True)
        safe = domain.replace(".", "_").replace("/", "_")
        
        if hasattr(response, "text") and response.text:
            with open(f"debug_html/{safe}.html", "w", encoding="utf-8") as f:
                f.write(response.text)

        parser_map = {
            "bbc.com":         self.parse_bbc,
            "cnn.com":         self.parse_cnn,            
            "edition.cnn.com": self.parse_cnn,            
            "reuters.com":     self.parse_reuters,        
            "apnews.com":      self.parse_ap,
            "aljazeera.com":   self.parse_aljazeera,
            "theguardian.com": self.parse_guardian,
            "techcrunch.com":  self.parse_techcrunch,
            "espn.com":        self.parse_espn,
            "news.sky.com":    self.parse_sky,            
            "cnbc.com":        self.parse_cnbc,           
            "nytimes.com":     self.parse_nytimes,        
            "bloomberg.com":   self.parse_bloomberg,      
            "arstechnica.com":  self.parse_arstechnica,
            "sciencedaily.com": self.parse_sciencedaily,
            "variety.com":      self.parse_variety,
            "foxnews.com":     self.parse_fox,             
            "washingtonpost.com": self.parse_wapo,         
        }

        parser = None
        for key, func in parser_map.items():
            if key in domain or domain in key:
                parser = func
                break
        
        if parser:
            self.logger.info(f"Targeting active parser for: {domain}")
            yield from parser(response)
        else:
            self.logger.error(f"No parser matched for cleansed domain path: {domain}")
        
    def log_error(self, failure):
        self.logger.error(f"Request structural failure dropped: {failure}")

    # =========================================================
    # SHARED HELPERS
    # =========================================================

    def clean_text(self, text_list):
        if not text_list:
            return ""
        cleaned = " ".join([t.strip() for t in text_list if t.strip()])
        return " ".join(cleaned.split())

    def is_valid_url(self, url):
        blocked = ["/video/", "/videos/", "/live/", "/photos/", "/photo/", "/gallery/", "#"]
        return not any(x in url for x in blocked)

    def build_item(self, response, title, url, description="", date=None):
        item = NewsScraperItem()
        item["title"] = title
        item["url"] = url
        item["description"] = description
        item["date"] = date
        item["source"] = response.meta.get("source", "Unknown")
        item["category"] = response.meta.get("category", "General News")
        return item

    # =========================================================
    # PARSERS
    # =========================================================

    def parse_bbc(self, response):
        print("Parsing BBC Content Feeds...")
        self.logger.info("Parsing BBC Content Feeds...")
        
        articles = response.css("a[data-testid='internal-link'], a[class*='PromoLink'], a[class*='CardLink']")
        if not articles:
            articles = response.css("div[data-testid='news-aria-label-card'] a, div[class*='gs-c-promo'] a")

        seen_urls = set()

        for article in articles:
            title = article.css("h2[data-testid='card-headline']::text, span[data-testid='card-headline']::text, h3::text").get()
            if not title:
                title = self.clean_text(article.css("h2 *::text, h3 *::text").getall())
                
            url = article.attrib.get("href")
            description = article.css("p[data-testid='card-description']::text, p::text").get()
            date = article.css("span[data-testid='card-metadata-lastupdated']::text, span[class*='metadata']::text").get()

            if not title or not url:
                continue

            full_url = response.urljoin(url)
            if not self.is_valid_url(full_url) or full_url in seen_urls:
                continue

            seen_urls.add(full_url)

            yield self.build_item(
                response=response,
                title=title,
                url=full_url,
                description=description if description else "",
                date=date
            )

    def parse_cnn(self, response):
        seen = set()
        articles = response.css("a.container__link")
        for article in articles:
            title = self.clean_text(article.css("*::text").getall())
            url = article.attrib.get("href")
            if not title or not url:
                continue
            full_url = response.urljoin(url)
            if not self.is_valid_url(full_url) or full_url in seen:
                continue
            seen.add(full_url)
            yield self.build_item(response, title, full_url)

    def parse_reuters(self, response):
        print("Parsing Reuters Content Feeds...")
        seen = set()
        articles = response.css("a[data-testid='Heading']")
        for article in articles:
            title = self.clean_text(article.css("*::text").getall())
            url = article.attrib.get("href")
            if not title or not url:
                continue
            full_url = response.urljoin(url)
            if not self.is_valid_url(full_url) or full_url in seen:
                continue
            seen.add(full_url)
            yield self.build_item(response, title, full_url)

    def parse_ap(self, response):
        print("Parsing AP News Content Feeds...")
        seen = set()
        articles = response.css("div.PagePromo, article")
        for article in articles:
            title = self.clean_text(article.css("h1 *::text, h2 *::text, h3 *::text").getall())
            description = self.clean_text(article.css("p *::text").getall())
            url = article.css("a::attr(href)").get()
            if not title or not url:
                continue
            full_url = response.urljoin(url)
            if not self.is_valid_url(full_url) or full_url in seen:
                continue
            seen.add(full_url)
            yield self.build_item(response, title, full_url, description)

    def parse_guardian(self, response):
        print("Parsing Guardian Content Feeds...")
        seen = set()
        articles = response.css("a[data-link-name='article']")
        for article in articles:
            title = self.clean_text(article.css("*::text").getall())
            url = article.attrib.get("href")
            if not title or not url or not url.startswith("http"):
                continue
            if not self.is_valid_url(url) or url in seen:
                continue
            print(seen)
            seen.add(url)
            yield self.build_item(response, title, url)

    def parse_techcrunch(self, response):
        print("Parsing TechCrunch Content Feeds...")
        seen = set()
        articles = response.css("article")
        for article in articles:
            title = self.clean_text(article.css("h2 *::text, h3 *::text").getall())
            description = self.clean_text(article.css("p *::text").getall())
            url = article.css("a::attr(href)").get()
            if not title or not url or url in seen:
                continue
            seen.add(url)
            yield self.build_item(response, title, url, description)

    def parse_espn(self, response):
        print("Parsing ESPN Content Feeds...")
        seen = set()
        articles = response.css("section.contentItem")
        for article in articles:
            title = self.clean_text(article.css("*::text").getall())
            url = article.css("a::attr(href)").get()
            if not title or not url:
                continue
            full_url = response.urljoin(url)
            if not self.is_valid_url(full_url) or full_url in seen:
                continue
            seen.add(full_url)
            yield self.build_item(response, title, full_url)

    def parse_cnbc(self, response):
        print("Parsing CNBC Content Feeds...")
        seen = set()
        articles = response.css("div.Card")
        for article in articles:
            title = self.clean_text(article.css("*::text").getall())
            url = article.css("a::attr(href)").get()
            if not title or not url:
                continue
            full_url = response.urljoin(url)
            if not self.is_valid_url(full_url) or full_url in seen:
                continue
            seen.add(full_url)
            yield self.build_item(response, title, full_url)

    def parse_bloomberg(self, response):
        print("Parsing Bloomberg Content Feeds...")
        seen = set()
        articles = response.css("article, div.story-list-story")
        for article in articles:
            title = self.clean_text(article.css("*::text").getall())
            url = article.css("a::attr(href)").get()
            if not title or not url:
                continue
            full_url = response.urljoin(url)
            if not self.is_valid_url(full_url) or full_url in seen:
                continue
            seen.add(full_url)
            yield self.build_item(response, title, full_url)

    def parse_aljazeera(self, response): yield from []
    def parse_sky(self, response): yield from []
    def parse_nytimes(self, response): yield from []
    def parse_arstechnica(self, response): yield from []
    def parse_sciencedaily(self, response): yield from []
    def parse_variety(self, response): yield from []
    def parse_fox(self, response): yield from []
    def parse_wapo(self, response): yield from []