# Define your item pipelines here
#
# Don't forget to add your pipeline to the ITEM_PIPELINES setting
# See: https://docs.scrapy.org/en/latest/topics/item-pipeline.html


# useful for handling different item types with a single interface
from itemadapter import ItemAdapter
import pymongo
import hashlib
import logging
from scrapy.exceptions import DropItem
import datetime

logger = logging.getLogger(__name__)

class MongoPipeline:
    COLLECTION_NAME = "news"

    def __init__(self, mongo_uri, mongo_db):
        self.mongo_uri = mongo_uri
        self.mongo_db = mongo_db
    
    @classmethod
    def from_crawler(cls, crawler):
        return cls(
            mongo_uri = crawler.settings.get("MONGO_URI"),
            mongo_db = crawler.settings.get("MONGO_DATABASE", "news_db")
        )
    def open_spider(self):
        self.client = pymongo.MongoClient(self.mongo_uri)
        self.db = self.client[self.mongo_db]
    
    def close_spider(self):
        self.client.close()

    def process_item(self, item, spider):
        try:
            item_id = self.compute_item_id(item)

            if not item.get("title") or not item.get("url"):
                raise DropItem(f"Invalid article found: {item}")
            doc = dict(ItemAdapter(item))
            doc["_id"] = item_id
            doc["scraped_at"] = datetime.datetime.now()
            self.db[self.COLLECTION_NAME].update_one(
                {"_id": item_id},
                {"$set": doc},
                upsert=True
            )
            return item
        except DropItem:
            raise
        except Exception as e:
            logger.error(f"Error processing item: {e}")
            raise
    
    def compute_item_id(self, item):
        adapter = ItemAdapter(item)
        url = item["url"]
        return hashlib.sha256(url.encode("utf-8")).hexdigest()
