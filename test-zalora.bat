@echo off
echo Running Zalora test scripts...

echo.
echo Step 1: Saving Zalora HTML...
npx ts-node src/scripts/save-zalora-html.ts

echo.
echo Step 2: Testing Zalora extractor...
npx ts-node src/scripts/test-zalora-extractor.ts

echo.
echo Done!
