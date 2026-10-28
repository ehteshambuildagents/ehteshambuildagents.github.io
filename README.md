# Ehtesham Mehdi — portfolio

React 19 + TypeScript + Vite. Static site, no backend.

## Edit content

Everything public lives in `src/content.ts`: profile, about, projects, experience, capabilities.
The CV served by the site is `public/Ehtesham_Mehdi_AI_Engineer_Resume.pdf`; replace that file
(same name) to update it. Page title, social metadata and Person structured data are in `index.html`.

The 3D stage (`src/Scene.tsx`, three.js via react-three-fiber) reads the same `projects` list: each
project becomes a chip orbiting the eclipse planet and a curved screen in the Work carousel, whose
artwork is drawn from the project's `flow` steps. Adding or removing a project needs no 3D changes.
`src/scroll.ts` maps page scroll to the scene and drives the glide when you click a project.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build into dist/
npm run lint
```

## Deploy

Live at https://ehteshambuildagents.github.io. GitHub Pages serves the `gh-pages` branch; the
source is on `main`.

```bash
npm run deploy   # build, then force-push dist/ to gh-pages; live in a minute or two
```

`dist/` is a plain static site, so Vercel, Netlify or Cloudflare Pages work too (build command
`npm run build`, output directory `dist`).

The address appears in `index.html` (canonical link, `og:url`, JSON-LD `url`); update those if the
site moves to a custom domain. There is no `og:image` yet, so shared links preview without a picture.
