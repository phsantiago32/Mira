const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    const testEmail = process.env.TEST_ADMIN_EMAIL;
    const testPassword = process.env.TEST_ADMIN_PASSWORD;

    if (!testEmail || !testPassword) {
        console.error('Error: TEST_ADMIN_EMAIL and TEST_ADMIN_PASSWORD environment variables must be set.');
        process.exit(1);
    }

    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();

    console.log('Navigating to app...');
    await page.goto('http://localhost:5174');

    await page.waitForSelector('input[type="text"]');
    console.log('Typing credentials...');
    await page.type('input[type="text"]', testEmail);
    await page.type('input[type="password"]', testPassword);

    console.log('Clicking login...');
    await page.click('button[type="submit"]');

    console.log('Waiting 8 seconds...');
    await new Promise(r => setTimeout(r, 8000));

    const content = await page.content();
    console.log("PAGE CONTENT INCLUDES ADMIN HUB?", content.includes("ADMIN HUB"));
    console.log("PAGE CONTENT INCLUDES HOME MIRA?", content.includes("ECOSSISTEMA MIRA"));

    await page.screenshot({ path: 'test_admin_screenshot.png' });
    console.log('Saved screenshot.');

    await browser.close();
})();
