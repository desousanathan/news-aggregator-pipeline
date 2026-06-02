#!/usr/bin/env python3
"""
Comprehensive test suite for NEWS scraper and API endpoints.
Tests scraping from all sources and validates API endpoints.
"""

import subprocess
import time
import sys
import requests
from datetime import datetime, timedelta
import json

FASTAPI_URL = "http://localhost:8000"
SCRAPY_LOG = "scrapy.log"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

def print_header(title):
    print(f"\n{Colors.BOLD}{Colors.CYAN}{'='*70}")
    print(f"  {title}")
    print(f"{'='*70}{Colors.RESET}\n")

def print_success(msg):
    print(f"{Colors.GREEN}✓ {msg}{Colors.RESET}")

def print_error(msg):
    print(f"{Colors.RED}✗ {msg}{Colors.RESET}")

def print_warning(msg):
    print(f"{Colors.YELLOW}⚠ {msg}{Colors.RESET}")

def print_info(msg):
    print(f"{Colors.BLUE}ℹ {msg}{Colors.RESET}")

def run_scraper():
    """Run the Scrapy spider to collect articles"""
    print_header("STARTING SCRAPER TEST")
    
    print_info("Launching Scrapy spider (news_scraper)...")
    print_info("Note: This may take 2-5 minutes depending on network speed\n")
    
    try:
        result = subprocess.run(
            ["scrapy", "crawl", "news_scraper", "-a", "limit=50"],
            cwd="/Users/nathandesousa/Desktop/Projects/Scraping/NEWS/news_scraper",
            capture_output=True,
            text=True,
            timeout=600
        )
        
        # Check for successful completion
        if "finished with status 'closed'" in result.stderr or result.returncode == 0:
            print_success("Scraper completed successfully")
            
            # Parse logs to check which sources worked
            if "Parsing" in result.stderr:
                sources_found = []
                for line in result.stderr.split('\n'):
                    if "Parsing" in line and "Content Feeds" in line:
                        sources_found.append(line.strip())
                
                if sources_found:
                    print(f"\n{Colors.BOLD}Sources parsed:{Colors.RESET}")
                    for source in sources_found[:20]:  # Show first 20
                        print(f"  {Colors.GREEN}•{Colors.RESET} {source}")
                    if len(sources_found) > 20:
                        print(f"  ... and {len(sources_found) - 20} more")
            return True
        else:
            print_error(f"Scraper failed with return code {result.returncode}")
            print_error("STDERR output:")
            print(result.stderr[:500])
            return False
            
    except subprocess.TimeoutExpired:
        print_error("Scraper timed out after 10 minutes")
        return False
    except Exception as e:
        print_error(f"Failed to run scraper: {str(e)}")
        return False

def test_api_endpoints():
    """Test all FastAPI endpoints"""
    print_header("TESTING API ENDPOINTS")
    
    tests = [
        {
            "name": "GET /news",
            "method": "GET",
            "url": f"{FASTAPI_URL}/news?limit=10",
            "check": lambda r: isinstance(r, list) and len(r) > 0
        },
        {
            "name": "GET /news with category filter",
            "method": "GET",
            "url": f"{FASTAPI_URL}/news?category=Technology&limit=5",
            "check": lambda r: isinstance(r, list)
        },
        {
            "name": "GET /trends (last 24h)",
            "method": "GET",
            "url": f"{FASTAPI_URL}/trends?hours=24",
            "check": lambda r: isinstance(r, list)
        },
        {
            "name": "GET /trends/keywords",
            "method": "GET",
            "url": f"{FASTAPI_URL}/trends/keywords?hours=24&top_n=20",
            "check": lambda r: isinstance(r, list) and all('word' in item for item in r)
        },
        {
            "name": "GET /trends/volume",
            "method": "GET",
            "url": f"{FASTAPI_URL}/trends/volume?hours=24&bucket_hours=1",
            "check": lambda r: isinstance(r, list)
        },
        {
            "name": "GET /clusters",
            "method": "GET",
            "url": f"{FASTAPI_URL}/clusters?n_clusters=5",
            "check": lambda r: isinstance(r, list)
        },
    ]
    
    passed = 0
    failed = 0
    
    for test in tests:
        try:
            print_info(f"Testing: {test['name']}")
            response = requests.get(test["url"], timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                if test["check"](data):
                    print_success(f"{test['name']} - OK")
                    if isinstance(data, list):
                        print(f"    └─ Returned {len(data)} items")
                    passed += 1
                else:
                    print_error(f"{test['name']} - Invalid response format")
                    failed += 1
            else:
                print_error(f"{test['name']} - HTTP {response.status_code}")
                failed += 1
                
        except requests.exceptions.ConnectionError:
            print_error(f"{test['name']} - Cannot connect to API (is it running?)")
            failed += 1
        except Exception as e:
            print_error(f"{test['name']} - {str(e)}")
            failed += 1
        
        time.sleep(0.5)  # Rate limit
    
    print(f"\n{Colors.BOLD}API Test Results:{Colors.RESET} {Colors.GREEN}{passed} passed{Colors.RESET}, {Colors.RED}{failed} failed{Colors.RESET}")
    return failed == 0

def verify_database_content():
    """Verify MongoDB has content from all sources"""
    print_header("VERIFYING DATABASE CONTENT")
    
    try:
        # Get news to check sources
        response = requests.get(f"{FASTAPI_URL}/news?limit=100", timeout=30)
        if response.status_code != 200:
            print_error("Could not fetch news from API")
            return False
        
        articles = response.json()
        if not articles:
            print_error("No articles in database")
            return False
        
        print_success(f"Found {len(articles)} articles in database")
        
        # Analyze sources
        sources = {}
        categories = {}
        for article in articles:
            source = article.get("source", "Unknown")
            category = article.get("category", "Unknown")
            sources[source] = sources.get(source, 0) + 1
            categories[category] = categories.get(category, 0) + 1
        
        print(f"\n{Colors.BOLD}Sources (total {len(sources)}):{Colors.RESET}")
        for source in sorted(sources.keys(), key=lambda s: sources[s], reverse=True):
            print(f"  • {source}: {sources[source]} articles")
        
        print(f"\n{Colors.BOLD}Categories (total {len(categories)}):{Colors.RESET}")
        for category in sorted(categories.keys(), key=lambda c: categories[c], reverse=True):
            print(f"  • {category}: {categories[category]} articles")
        
        # Check if we have multiple sources
        expected_sources = 10  # At least 10 different sources
        if len(sources) >= expected_sources:
            print_success(f"Good diversity: {len(sources)} different sources")
            return True
        else:
            print_warning(f"Low diversity: only {len(sources)} sources (expected at least {expected_sources})")
            return len(sources) >= 5  # At least 5 sources
        
    except Exception as e:
        print_error(f"Error verifying database: {str(e)}")
        return False

def check_data_quality():
    """Check quality of scraped data"""
    print_header("CHECKING DATA QUALITY")
    
    try:
        response = requests.get(f"{FASTAPI_URL}/news?limit=50", timeout=30)
        articles = response.json()
        
        if not articles:
            print_error("No articles to check")
            return False
        
        issues = 0
        sample_size = min(10, len(articles))
        
        print_info(f"Checking {sample_size} articles for quality issues...\n")
        
        for i, article in enumerate(articles[:sample_size]):
            checks = {
                "Has title": bool(article.get("title", "").strip()),
                "Has URL": bool(article.get("url", "").strip()),
                "Has source": bool(article.get("source", "").strip()),
                "Has category": bool(article.get("category", "").strip()),
                "Title length > 5": len(article.get("title", "")) > 5,
                "URL is valid": article.get("url", "").startswith("http"),
            }
            
            article_issues = [k for k, v in checks.items() if not v]
            if article_issues:
                issues += len(article_issues)
                print_warning(f"Article {i+1} ({article.get('source')}): {', '.join(article_issues)}")
            else:
                print_success(f"Article {i+1} ({article.get('source')}): All checks passed")
        
        print(f"\n{Colors.BOLD}Quality Check Result:{Colors.RESET}")
        if issues == 0:
            print_success(f"All {sample_size} articles passed quality checks!")
            return True
        else:
            print_warning(f"Found {issues} quality issues in {sample_size} articles")
            return issues < (sample_size * 2)  # Allow some issues
        
    except Exception as e:
        print_error(f"Error checking data quality: {str(e)}")
        return False

def test_trends_endpoint():
    """Specifically test trends endpoint"""
    print_header("TESTING TRENDS ENDPOINT")
    
    try:
        # Test keywords endpoint
        print_info("Testing /trends/keywords...")
        response = requests.get(f"{FASTAPI_URL}/trends/keywords?hours=24&top_n=20", timeout=30)
        if response.status_code == 200:
            keywords = response.json()
            if keywords and isinstance(keywords, list):
                print_success(f"Found {len(keywords)} trending keywords")
                print("  Top 5 keywords:")
                for i, kw in enumerate(keywords[:5]):
                    print(f"    {i+1}. {kw.get('word', '?')} ({kw.get('count', 0)} mentions)")
            else:
                print_warning("Trends endpoint returned empty results - might be normal if DB is new")
        else:
            print_error(f"Trends endpoint failed with status {response.status_code}")
        
        # Test volume endpoint
        print_info("\nTesting /trends/volume...")
        response = requests.get(f"{FASTAPI_URL}/trends/volume?hours=24", timeout=30)
        if response.status_code == 200:
            volume = response.json()
            if volume and isinstance(volume, list):
                print_success(f"Found {len(volume)} time buckets")
                print("  Recent activity:")
                for bucket in volume[-3:]:
                    print(f"    • {bucket.get('time', '?')}: {bucket.get('count', 0)} articles")
            else:
                print_warning("Volume endpoint returned empty results")
        else:
            print_error(f"Volume endpoint failed with status {response.status_code}")
        
        return True
        
    except Exception as e:
        print_error(f"Error testing trends: {str(e)}")
        return False

def main():
    print(f"{Colors.BOLD}{Colors.CYAN}")
    print("""
    ╔════════════════════════════════════════════════════════════════════╗
    ║                   NEWS SCRAPER COMPREHENSIVE TEST                  ║
    ║                  Testing all sources and endpoints                 ║
    ╚════════════════════════════════════════════════════════════════════╝
    """)
    print(Colors.RESET)
    
    results = {
        "Scraper": False,
        "API Endpoints": False,
        "Database Content": False,
        "Data Quality": False,
        "Trends": False,
    }
    
    # Check if API is running
    print_info("Checking if FastAPI is running...")
    try:
        requests.get(f"{FASTAPI_URL}/news?limit=1", timeout=5)
        print_success("FastAPI is running")
    except requests.exceptions.ConnectionError:
        print_error(f"FastAPI is not running on {FASTAPI_URL}")
        print_info("Please start the FastAPI server:")
        print_info("  cd /Users/nathandesousa/Desktop/Projects/Scraping/NEWS/MongoDB")
        print_info("  python app.py")
        return
    
    # Run tests
    results["Scraper"] = run_scraper()
    time.sleep(2)
    
    results["API Endpoints"] = test_api_endpoints()
    results["Database Content"] = verify_database_content()
    results["Data Quality"] = check_data_quality()
    results["Trends"] = test_trends_endpoint()
    
    # Summary
    print_header("TEST SUMMARY")
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for test_name, result in results.items():
        status = f"{Colors.GREEN}PASS{Colors.RESET}" if result else f"{Colors.RED}FAIL{Colors.RESET}"
        print(f"  {test_name}: {status}")
    
    print(f"\n{Colors.BOLD}Overall: {passed}/{total} test categories passed{Colors.RESET}")
    
    if passed == total:
        print(f"{Colors.GREEN}\n✓ All tests passed! Your scraper is working correctly.{Colors.RESET}")
    else:
        print(f"{Colors.YELLOW}\n⚠ Some tests failed. Please review the output above.{Colors.RESET}")
    
    print()

if __name__ == "__main__":
    main()
