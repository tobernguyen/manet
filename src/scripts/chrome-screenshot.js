(function () { // jshint ignore:line
    "use strict";

    /* Modules & Constants */

    const webdriverio = require('webdriverio'),
        chromedriver = require('chromedriver'),
        fs = require('fs'),
        gm = require('gm'),
        promisify = require('es6-promisify'),
        atob = require('atob');

    var DEF_ZOOM = 1,
        DEF_QUALITY = 1,
        DEF_DELAY = 100,
        DEF_WIDTH = 1280,
        DEF_HEIGHT = 1280,
        DEF_PAPER_FORMAT = 'letter',
        DEF_PAPER_ORIENTATION = 'portrait',
        DEF_JS_ENABLED = true,
        DEF_IMAGES_ENABLED = true,
        DEF_FORMAT = 'png',
        DEF_HEADERS = {},
        DEF_STYLES = 'body { background: #fff; }';

    const PATH_TO_CANARY = '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary';
    const PORT = 9515;

    chromedriver.start([
        '--url-base=wd/hub',
        `--port=${PORT}`
    ]);

    /* Common functions */

    function argument(index) {
        return process.argv.slice(2)[index];
    }

    function parseOptions(base64) {
        var optionsJSON = atob(base64);
        return JSON.parse(optionsJSON);
    }

    function composeOptions(base64, outputFile) {
        try {
            var options = parseOptions(base64);
            options.outputFile = outputFile;
            return options;
        } catch (e) {
            throw e;
        }
    }

    function pageClipRect(options) {
        var cr = options.clipRect;
        return (cr && cr.top >= 0 && cr.left >= 0 && cr.width && cr.height) ? cr : null;
    }

    async function captureScreenshot(options) {
        try {
            const opts = {
                port: PORT,
                desiredCapabilities: {
                    browserName: 'chrome',
                    chromeOptions: {
                        binary: PATH_TO_CANARY, // Screenshots require Chrome 60. Force Canary.
                        args: [
                            '--headless',
                            `--window-size=${options.width || DEF_WIDTH},${options.height || DEF_HEIGHT}`
                        ]
                    }
                }
            };

            const browser = webdriverio.remote(opts).init();

            await browser.url(options.url);
            const imgBuf = await browser.saveScreenshot();
            const clipRect = pageClipRect(options)
            if (clipRect) {
              gm(imgBuf)
                .crop(clipRect.width, clipRect.height, clipRect.top, clipRect.left)
                .write(options.outputFile, (err) => {
                  if (err) throw err;

                  browser.endAll();             
                  chromedriver.stop();
                })
            } else {
              browser.endAll();              
              chromedriver.stop();
            }
        } catch (e) {
            throw e;
        }
    }


    /* Configuration reading */

    var base64 = argument(0),
        outputFile = argument(1),
        options = composeOptions(base64, outputFile);


    /* Fire starter */
    captureScreenshot(options);
})();
