# Belote production runtime

Copy only the files below to the static runtime for `belote.qqnd.fyi`:

```text
index.html
belote_multiplayer.js
```

`index.html` is the canonical entry point and references `belote_multiplayer.js` from the same directory.

Do **not** copy these development/legacy paths to production:

```text
.github/
tests/
playwright-report/
test-results/
cloudflare-signaling/
DEPLOY_MULTIPLAYER.md
README*.md
package*.json
playwright.config.mjs
belote_offline_single.html
```

The legacy P2P/Cloudflare files remain in the repository temporarily for rollback until the QQND server migration passes live smoke. They are not part of the production runtime.
