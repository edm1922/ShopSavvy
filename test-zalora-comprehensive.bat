@echo off
echo ===================================================
echo Comprehensive Zalora Extractor Test
echo ===================================================
echo.

echo Step 1: Running improved Zalora extractor test...
call test-zalora-improved.bat
echo.

echo Step 2: Testing extractor with saved HTML...
call test-zalora-extractor.bat
echo.

echo Step 3: Testing API endpoint...
echo This step requires the server to be running.
echo Please make sure the server is running at http://localhost:3000
echo.
echo Press any key to continue with API testing or Ctrl+C to exit...
pause > nul

echo Making API request to test-deepseek-enhanced endpoint...
curl -s "http://localhost:3000/api/test-deepseek-enhanced?platform=zalora&query=shoes&testMode=extract-only" > zalora-api-results.json
echo Results saved to zalora-api-results.json
echo.

echo ===================================================
echo All tests completed!
echo ===================================================
pause
