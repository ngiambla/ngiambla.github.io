# ngiambla.github.io

A personal site that is a real Linux machine: Alpine Linux (i386) boots in the
browser under the [v86](https://github.com/copy/v86) emulator, wired to an
xterm.js terminal. The first visit cold-boots; afterwards the machine is saved in
the browser (IndexedDB) and resumes where the visitor left off, until they run
`reboot` or clear site data. A deploy with a new image also forces a fresh boot.

Inside: the bio, CV, papers and projects as files in `~`, `gcc`, and `explore`,
an ASCII first-person walk around a wafer-scale chip (`linux/explore/`).

## Layout

| Path | What |
| --- | --- |
| `content/site.json` | bio, experience, papers, projects |
| `scripts/build-content.mjs` | turns it into the home directory files |
| `linux/Dockerfile`, `linux/rootfs/` | the guest image (packages, autologin, helpers) |
| `scripts/build-linux.sh` | builds the image into `public/linux/` (needs docker) |
| `src/main.ts` | boots v86, saves and restores the machine |
| `linux/explore/explore.c` | the game |

## Updating content

Everything the terminal shows (bio, experience, papers, projects) comes from
[`content/site.json`](content/site.json). Edit it, and the next deploy picks it up.
`public/cv.pdf` is the downloadable CV.

## Running locally

```sh
npm install
scripts/build-linux.sh   # once, needs docker + `pip install zstandard`
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
```

## Deploying

Pushing to the default branch runs `.github/workflows/deploy.yml`, which builds
the Linux image and the site and publishes `dist/` to GitHub Pages. Pushes to
other branches build just the image and publish it to the `linux-image` branch
for testing. In the repository's
Settings → Pages, set **Source** to **GitHub Actions** (one-time).
