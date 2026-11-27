# ngiambla.github.io

A terminal-style personal site.

## Updating content

Everything the terminal shows (bio, experience, papers, projects) comes from
[`content/site.json`](content/site.json). Edit it, and the next deploy picks it up.
`public/cv.pdf` is the downloadable CV.

## Running locally

```sh
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
```

## Deploying

Pushing to the default branch runs `.github/workflows/deploy.yml`, which builds
the site and publishes `dist/` to GitHub Pages. In the repository's
Settings → Pages, set **Source** to **GitHub Actions** (one-time).
