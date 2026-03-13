# 🪐 Andacity Travel — 🏨 + ✈️ + 🚗

Welcome to the development space for [andacity.com](https://andacity.com), an experience-driven travel booking and discovery-first travel planning site offering search modes for destinations, hotels, flights, and car rentals.

## Release Info

* Version **`0.3.1`**
* Released on `2026-03-12`

## Project Documentation

### Quik-Related Links

- [Qwik Docs](https://qwik.dev/)
- [Discord](https://qwik.dev/chat)
- [Qwik GitHub](https://github.com/QwikDev/qwik)
- [@QwikDev](https://twitter.com/QwikDev)
- [Vite](https://vitejs.dev/)

### Project Structure

This project is using Qwik with [QwikCity](https://qwik.dev/qwikcity/overview/). QwikCity is just an extra set of tools on top of Qwik to make it easier to build a full site, including directory-based routing, layouts, and more.

Inside your project, you'll see the following directory structure:

```
├── public/
│   └── ...
└── src/
    ├── components/
    │   └── ...
    └── routes/
        └── ...
```

- `src/routes`: Provides the directory-based routing, which can include a hierarchy of `layout.tsx` layout files, and an `index.tsx` file as the page. Additionally, `index.ts` files are endpoints. Please see the [routing docs](https://qwik.dev/qwikcity/routing/overview/) for more info.

- `src/components`: Recommended directory for components.

- `public`: Any static assets, like images, can be placed in the public directory. Please see the [Vite public directory](https://vitejs.dev/guide/assets.html#the-public-directory) for more info.

### Add Integrations and deployment

Use the `pnpm qwik add` command to add additional integrations. Some examples of integrations includes: Cloudflare, Netlify or Express Server, and the [Static Site Generator (SSG)](https://qwik.dev/qwikcity/guides/static-site-generation/).

```shell
pnpm qwik add # or `pnpm qwik add`
```

### Development

Development mode uses [Vite's development server](https://vitejs.dev/). The `dev` command will server-side render (SSR) the output during development.

```shell
npm start # or `pnpm start`
```

### Database Layer

Andacity now includes an initial PostgreSQL architecture using Drizzle:

- Schema: `src/lib/db/schema.ts`
- Migrations: `drizzle/*`
- DB client/repositories: `src/lib/db/*`, `src/lib/repos/*`
- Architecture note: `docs/database-architecture.md`

Useful commands:

- `pnpm db:generate`
- `pnpm db:migrate`
- `pnpm db:seed:plan`
- `pnpm db:seed`

Runtime DB reads (search routes):

- `DATABASE_URL=postgresql://...`
- `DB_READS_ENABLED=1` (optional; if unset, DB reads auto-enable when `DATABASE_URL` exists)

> Note: during dev mode, Vite may request a significant number of `.js` files. This does not represent a Qwik production build.

### Preview

The preview command will create a production build of the client modules, a production build of `src/entry.preview.tsx`, and run a local server. The preview server is only for convenience to preview a production build locally and should not be used as a production server.

```shell
pnpm preview # or `pnpm preview`
```

### Production

The production build will generate client and server modules by running both client and server build commands. The build command will use Typescript to run a type check on the source code.

```shell
pnpm build # or `pnpm build`
```

## Legal Notices

### License Info

This project is released under the **[SUNTHETIC Source Code Evaluation License, Version 1.2](https://sunthetic.media/licenses/scel-1-2)** license.

A copy of this license is provided within this project [here](LICENSE.md).

### Copyright Notice

`Copyright (c) 2026 Sunthetic Media Ventures. All rights reserved.`
