@echo off
echo Running migration to create cache tables...
npx ts-node src/scripts/run-migration.ts 20240610_search_cache.sql

echo.
echo Testing custom scrapers...
npx ts-node src/scripts/scraper-test/index.ts

echo.
echo Done! Check the results in src/scripts/scraper-test/results directory.
pause
