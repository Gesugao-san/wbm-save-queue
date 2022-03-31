
const puppeteer = require('puppeteer');
const { inspect } = require('util');

var target_cookie_present = false, target_cookie = "", auth_cookie_valid = false;
var target_cookie_names = ["logged-in-user", "logged-in-sig"]; // "PHPSESSID"

// https://stackoverflow.com/a/61722618/8175291
async function mainLoop() {
	console.clear();
	console.log("Hi");
	process.stdout.write("Connecting to local Google Chrome with debug mode on... ");

	//const browser = await puppeteer.launch();
	const browserURL = 'http://127.0.0.1:21222';
	try {
		var browser = await puppeteer.connect({browserURL}); // https://stackoverflow.com/a/55100293/8175291
		console.log("Ok");
	} catch (e) {
		if (e.code === "ECONNREFUSED") {
			console.error(`FetchError: Failed to fetch browser. Google Chrome is not launched or launched not under debug mode.\nTo use Chrome Devtools Protocol you need to start it with debugging on, so try something this first in CMD please:\nSTART "" "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" --remote-debugging-port=21222`);
			process.exit(1);
		} else {
			throw e;
		}
	}
	var page = await browser.newPage();

	process.stdout.write("Getting userAgent from browser... ");
	const userAgent = await browser.userAgent();
	console.log("Ok");
	console.log("Target userAgent data:", userAgent.split(")")[0] + ") + secret");

	process.stdout.write("Opening website with cookies (may take a long time)... "); // page loading speed depends on internet speed
	await page.goto('https://archive.org/about/', {waitUntil : 'networkidle0' }).then(() => {
		console.log("Ok");
	}).catch(function(err) {
		console.error(err);
		//if (e.code === "TimeoutError") {}
		process.exit(1);
	});

	/* process.stdout.write("Opening debug session with browser... ");
	const client = await page.target().createCDPSession(); // https://chromedevtools.github.io/devtools-protocol/tot/Network/#method-getAllCookies
	console.log("Ok"); */

	process.stdout.write("Getting cookies from page... ");
	//const all_browser_cookies = (await client.send('Network.getCookies')).cookies;
	const current_url_cookies = await page.cookies();
	//const third_party_cookies = all_browser_cookies.filter(cookie => cookie.domain !== current_url_cookies[0].domain);
	console.log("Ok");

	process.stdout.write("Searching target cookie... ");
	for (var i in current_url_cookies) {
		for (var ii in target_cookie_names) {
			if (target_cookie_names[ii].includes(current_url_cookies[i].name)) {
				//console.log(key + " -> " + p[key]);
				console.log("Ok");
				target_cookie = {"name": current_url_cookies[i].name, "value": "secret"}; // current_url_cookies[i].value
				console.log("Target cookie data:", target_cookie);
				target_cookie_present = true;
				//break;
			}
		}
		//console.log(JSON.stringify(content, null, 4));
	}
	if (!target_cookie_present) {
		console.error("No target cookie here!");
		process.exit(1);
	}

	var _pages = await browser.pages();
	console.log("browser.pages():", _pages[0]); // inspect() //JSON.stringify

	process.stdout.write("Closing website with cookies... ");
	await page.close();
	console.log("Ok");

	process.stdout.write("Disconnecting from real browser... ");
	await browser.disconnect();
	console.log("Ok");

	process.stdout.write("Connecting to virtual browser... "); // Target cookie present
	browser = await puppeteer.launch({});
	page = await browser.newPage();
	console.log("Ok");
	process.stdout.write("Setting real userAgent to virtual browser to mimic the real one... ");
	await page.setUserAgent(userAgent);
	console.log("Ok");
	process.stdout.write("Setting real cookies to virtual browser to mimic the real one... ");
	await page.setCookie(...current_url_cookies);
	console.log("Ok");

	//https://stackoverflow.com/a/60663733/8175291
	//console.log("all_browser_cookies:", all_browser_cookies); // All Browser Cookies // and ... 2946 more items
	//console.log("current_url_cookies:", current_url_cookies); // Current URL Cookies
	//console.log("third_party_cookies:", third_party_cookies); // Third-Party Cookies

	/* process.stdout.write("Asking real ArchAge API from virtual browser is real cookie valid... ");
	await page.goto('https://archeage.ru/dynamic/auth/?a=checkuser', {waitUntil : 'networkidle0' }).then(() => {
		console.log("Ok");
	}).catch(function(err) {
		console.error(err);
	});
	let bodyHTML = await page.evaluate(() => document.body.innerHTML);
	auth_cookie_valid = Boolean(JSON.parse(bodyHTML).enable && JSON.parse(bodyHTML).status);
	console.log("Is cookie valid?", auth_cookie_valid);
	if (!auth_cookie_valid) {
		console.error("Please log in to target accont to proceed.");
		await page.close();
		await browser.close();
		process.exit(0);
	}
	console.log("Now we can proceed to automatic promo activating (ToDo)..."); */

	console.log("Bye");
	await page.close();
	await browser.close();
	process.exit(0);
}

mainLoop();
