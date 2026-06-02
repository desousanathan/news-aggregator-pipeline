#!/bin/bash

# COLOR CODES
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}╔════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║           NEWS SCRAPER - SETUP & RUN ALL SERVICES                  ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════════════╝${NC}\n"

# Check MongoDB
echo -e "${BLUE}→ Checking MongoDB...${NC}"
if mongo --version > /dev/null 2>&1; then
    echo -e "${GREEN}✓ MongoDB found${NC}"
else
    echo -e "${RED}✗ MongoDB not found. Please install MongoDB.${NC}"
    exit 1
fi

# Check Python
echo -e "${BLUE}→ Checking Python...${NC}"
if python3 --version > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Python found${NC}"
else
    echo -e "${RED}✗ Python3 not found. Please install Python 3.${NC}"
    exit 1
fi

# Check Node.js
echo -e "${BLUE}→ Checking Node.js...${NC}"
if node --version > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Node.js found${NC}"
else
    echo -e "${RED}✗ Node.js not found. Please install Node.js.${NC}"
    exit 1
fi

# Check Scrapy
echo -e "${BLUE}→ Checking Scrapy...${NC}"
if python3 -c "import scrapy" 2>/dev/null; then
    echo -e "${GREEN}✓ Scrapy found${NC}"
else
    echo -e "${YELLOW}⚠ Scrapy not found. Installing...${NC}"
    pip3 install scrapy scrapy-playwright
fi

echo -e "\n${CYAN}═══════════════════════════════════════════════════════════════════${NC}\n"

# Display options
echo -e "${CYAN}What would you like to do?${NC}\n"
echo -e "  ${GREEN}1${NC}) Start all services (MongoDB, FastAPI, Dashboard, run scraper)"
echo -e "  ${GREEN}2${NC}) Start MongoDB only"
echo -e "  ${GREEN}3${NC}) Start FastAPI backend only"
echo -e "  ${GREEN}4${NC}) Start Next.js dashboard only"
echo -e "  ${GREEN}5${NC}) Run scraper only"
echo -e "  ${GREEN}6${NC}) Run comprehensive tests"
echo -e "  ${GREEN}0${NC}) Exit"
echo ""
read -p "Choose an option [0-6]: " option

case $option in
    1)
        echo -e "\n${CYAN}Starting all services...${NC}\n"
        
        # Kill any existing processes
        pkill -f "mongod" 2>/dev/null
        pkill -f "uvicorn" 2>/dev/null
        pkill -f "next" 2>/dev/null
        
        # Start MongoDB
        echo -e "${BLUE}→ Starting MongoDB...${NC}"
        mongod --quiet &
        MONGO_PID=$!
        sleep 2
        echo -e "${GREEN}✓ MongoDB started (PID: $MONGO_PID)${NC}"
        
        # Start FastAPI
        echo -e "${BLUE}→ Starting FastAPI backend...${NC}"
        cd /Users/nathandesousa/Desktop/Projects/Scraping/NEWS/MongoDB
        python app.py > /tmp/fastapi.log 2>&1 &
        FASTAPI_PID=$!
        sleep 3
        echo -e "${GREEN}✓ FastAPI started (PID: $FASTAPI_PID)${NC}"
        echo -e "  ${YELLOW}→ Running on http://localhost:8000${NC}"
        
        # Start Dashboard
        echo -e "${BLUE}→ Starting Next.js Dashboard...${NC}"
        cd /Users/nathandesousa/Desktop/Projects/Scraping/NEWS/news-dashboard
        npm run dev > /tmp/nextjs.log 2>&1 &
        NEXT_PID=$!
        sleep 5
        echo -e "${GREEN}✓ Dashboard started (PID: $NEXT_PID)${NC}"
        echo -e "  ${YELLOW}→ Running on http://localhost:3000${NC}"
        
        # Run scraper
        echo -e "\n${BLUE}→ Starting scraper...${NC}"
        echo -e "${YELLOW}Note: This may take 2-5 minutes${NC}\n"
        cd /Users/nathandesousa/Desktop/Projects/Scraping/NEWS/news_scraper
        scrapy crawl news_scraper
        
        echo -e "\n${GREEN}✓ All services started!${NC}"
        echo -e "\n${CYAN}Services running:${NC}"
        echo -e "  • MongoDB: http://localhost:27017"
        echo -e "  • FastAPI: http://localhost:8000"
        echo -e "  • Dashboard: http://localhost:3000"
        echo -e "\n${YELLOW}Press Ctrl+C to stop (this will only stop the current process)${NC}"
        echo -e "${YELLOW}To stop all services:${NC}"
        echo -e "  pkill mongod"
        echo -e "  kill $FASTAPI_PID"
        echo -e "  kill $NEXT_PID"
        ;;
        
    2)
        echo -e "\n${BLUE}Starting MongoDB...${NC}"
        mongod
        ;;
        
    3)
        echo -e "\n${BLUE}Starting FastAPI...${NC}"
        cd /Users/nathandesousa/Desktop/Projects/Scraping/NEWS/MongoDB
        python app.py
        ;;
        
    4)
        echo -e "\n${BLUE}Starting Next.js Dashboard...${NC}"
        cd /Users/nathandesousa/Desktop/Projects/Scraping/NEWS/news-dashboard
        npm run dev
        ;;
        
    5)
        echo -e "\n${BLUE}Running Scraper...${NC}"
        echo -e "${YELLOW}Make sure MongoDB and FastAPI are running!${NC}\n"
        cd /Users/nathandesousa/Desktop/Projects/Scraping/NEWS/news_scraper
        scrapy crawl news_scraper
        ;;
        
    6)
        echo -e "\n${BLUE}Running comprehensive tests...${NC}"
        echo -e "${YELLOW}Make sure MongoDB and FastAPI are running!${NC}\n"
        python /Users/nathandesousa/Desktop/Projects/Scraping/NEWS/test_scraper.py
        ;;
        
    0)
        echo -e "\n${CYAN}Goodbye!${NC}"
        exit 0
        ;;
        
    *)
        echo -e "\n${RED}Invalid option. Please choose 0-6.${NC}"
        exit 1
        ;;
esac
