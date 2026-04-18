# Marathon Live Tracker

A single-page web app that displays the 2026 Boston Marathon course on a full-screen interactive map and simulates a runner's live position based on a pacing plan and start time. Built with vanilla HTML/CSS/JS and [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/).

## Prerequisites

- [Node.js](https://nodejs.org/) 18+ (for running tests and the GPX conversion script)
- A [Mapbox access token](https://account.mapbox.com/access-tokens/)

## Setup

```bash
# Install dev dependencies (tests only — the app itself has no runtime dependencies)
npm install

# Set your Mapbox token
cp config.example.js config.js
# Edit config.js and replace YOUR_MAPBOX_TOKEN with your actual token
```

## Project Structure

```
├── index.html              # Entry point
├── style.css               # Full-screen map + UI overlay styles
├── app.js                  # Main orchestrator (imports all modules)
├── config.js               # Your Mapbox token (gitignored)
├── config.example.js       # Template for config.js
├── course-data.js          # Pre-generated GeoJSON course data (~1,381 points)
├── pacing-plan.js          # Miles-to-pace table + cumulative time builder
├── position-calculator.js  # Distance-at-time + geographic interpolation
├── cookie-store.js         # Start time persistence via browser cookie
├── map-controller.js       # Mapbox GL JS map, course layer, runner marker
├── ui-controller.js        # Start time input, debug mode, view toggle
├── scripts/
│   ├── convert-gpx.js      # One-time GPX → course-data.js converter
│   └── verify-course-data.mjs
├── course/
│   └── *.gpx               # Source GPX file
└── tests/                  # 11 test files, 49 tests (vitest + fast-check)
```

## Running Locally

No build step required. Serve the project root with any static file server:

```bash
npx serve .
```

Then open `http://localhost:3000` in your browser.

## Running Tests

```bash
npm test
```

This runs all 49 tests (unit + property-based) via vitest, covering 9 correctness properties defined in the design spec.

## Regenerating Course Data

If you need to update the course from a new GPX file, place it in `course/` and run:

```bash
node scripts/convert-gpx.js
```

This parses the GPX, extracts trackpoints as `[lng, lat]` pairs, computes the bounding box, and writes `course-data.js`.

## Deployment

This is a fully static site — just HTML, CSS, and JS files. No server-side code, no build step. Any static hosting platform works.

### Recommended: GitHub Pages

The simplest option since you're already using git.

1. Push your repo to GitHub.

2. Add your Mapbox token as a repository secret:
   - Go to **Settings → Secrets and variables → Actions**
   - Click **New repository secret**
   - Name: `MAPBOX_TOKEN`
   - Value: your Mapbox access token (e.g. `pk.eyJ1Ijo...`)

3. Go to **Settings → Pages** in your repo.

4. Under **Source**, select **GitHub Actions**.

5. The workflow at `.github/workflows/deploy.yml` is already included in the repo. It:
   - Runs all tests
   - Generates `config.js` from the `MAPBOX_TOKEN` secret
   - Deploys the site to GitHub Pages

6. Push to `main` — the site deploys automatically after tests pass.

Your app will be live at `https://<username>.github.io/<repo-name>/`.

### Alternatives

- **Netlify** — connect your repo or drag-and-drop the project folder. Zero config needed for static sites. Free tier includes HTTPS and custom domains.
- **Cloudflare Pages** — git-based deploy with a fast global CDN. Free tier is generous.
- **Vercel** — works out of the box for static sites. Connect your repo and deploy.

For all of these, the "build command" is empty and the "publish directory" is `.` (the project root).

### Environment Variable: Mapbox Token

Your Mapbox token lives in `config.js` (gitignored). The deploy workflow generates it automatically from the `MAPBOX_TOKEN` GitHub secret.

For local development, copy the template and add your token:

```bash
cp config.example.js config.js
# Edit config.js and paste your token
```

For public repos, restrict the token to your deployment domain in the [Mapbox dashboard](https://account.mapbox.com/access-tokens/).
