const puppeteer = require('puppeteer');

(async () => {
    const testEmail = process.env.TEST_USER_EMAIL;
    const testPassword = process.env.TEST_USER_PASSWORD;

    if (!testEmail || !testPassword) {
        console.error('Error: TEST_USER_EMAIL and TEST_USER_PASSWORD environment variables must be set.');
        process.exit(1);
    }

    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();

    // Capture console messages
    page.on('console', msg => {
        console.log(`[BROWSER CONSOLE] ${msg.type().toUpperCase()}: ${msg.text()}`);
    });

    page.on('pageerror', error => {
        console.log(`[PAGE ERROR] ${error.message}`);
    });

    console.log('Navigating to app...');
    await page.goto('http://localhost:5176');

    await page.waitForSelector('input[type="text"]');

    console.log('Typing credentials...');
    await page.type('input[type="text"]', testEmail);
    await page.type('input[type="password"]', testPassword);

    console.log('Clicking login...');
    await page.click('button[type="submit"]');

    console.log('Waiting 10 seconds...');
    await new Promise(r => setTimeout(r, 10000));

    const content = await page.content();
    console.log("PAGE CONTENT INCLUDES A PROCESSAR?", content.includes("A PROCESSAR..."));

    console.log('Done waiting.');
    await browser.close();
})();
