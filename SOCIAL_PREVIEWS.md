# Social preview deployment

## Staging

Configure the `test.deltainc.gr` Vercel environment with:

```dotenv
VITE_SITE_URL=https://test.deltainc.gr
VITE_WP_BASE_URL=https://deltainc.gr
VITE_CANONICAL_SITE_URL=https://deltainc.gr
VITE_ALLOW_INDEXING=false
```

`pnpm build` fetches published WordPress posts/programs, builds the SPA, emits route-specific HTML under `dist/blog/<slug>/index.html` and `dist/courses/<slug>/index.html`, creates `dist/404.html`, and verifies the output.

Install `wordpress-plugin/delta-vercel-deploy-hook` in WordPress and define only `DELTA_VERCEL_DEPLOY_HOOK_STAGING` while testing.

## Production cutover

Before the frontend takes over `deltainc.gr`, move WordPress to `https://cms.deltainc.gr`, rebuild Yoast indexables, migrate stored `/wp-content/` URLs, and configure:

```dotenv
VITE_SITE_URL=https://deltainc.gr
VITE_WP_BASE_URL=https://cms.deltainc.gr
VITE_CANONICAL_SITE_URL=https://deltainc.gr
VITE_ALLOW_INDEXING=true
```

When the WordPress and public frontend hosts differ, the generated Vercel configuration includes compatibility rewrites for `/wp-content/*` and `/wp-json/*`.

Do not enable `DELTA_VERCEL_DEPLOY_HOOK_PRODUCTION` until the CMS hostname and production preview checks pass.
