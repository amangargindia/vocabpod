const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  // Emulate mobile device
  await page.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true });
  await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1');

  // Capture console messages
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

  console.log('Navigating to https://www.vocabpod.shop/upgrade/success ...');
  await page.goto('https://www.vocabpod.shop/upgrade/success', { waitUntil: 'networkidle2' });
  
  console.log('Taking screenshot...');
  await page.screenshot({ path: 'mobile_test.png' });
  
  await browser.close();
  console.log('Done.');
})();
