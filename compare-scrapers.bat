@echo off
echo Comparing custom scrapers with Serper.dev API...
npx ts-node src/scripts/scraper-test/compare.ts

echo.
echo Done! Check the comparison results in src/scripts/scraper-test/results directory.
pause
