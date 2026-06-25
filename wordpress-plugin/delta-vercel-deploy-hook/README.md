# Delta Vercel Deploy Hook

Triggers a Vercel rebuild of the Delta frontend when WordPress content changes.
Watches `post` and `program` changes (publish, edit, unpublish, trash, delete, and
scheduled `future` → `publish`), waits 60 seconds (debounce — many quick edits =
one build), calls the Vercel deploy hook, retries failures up to three times, and
stores its last result in the `delta_vercel_deploy_hook_status` option.

## Setup (recommended — no file editing)

1. Install this directory as a WordPress plugin and **activate** it. Activation
   alone does nothing until a hook URL is configured, so it is safe.
2. Go to **Settings → Delta Deploy**.
3. Paste the **Staging** deploy hook URL from Vercel
   (Project → Settings → Git → Deploy Hooks, branch `main`) and click **Save**.
4. Click **Rebuild staging now** to test, then watch Vercel → Deployments.

The URL is stored as a WordPress option — no `wp-config.php` edit required, and it
can be cleared at any time from the same page.

## Advanced alternative (wp-config constant)

Defining the constant locks the value and hides the settings field:

```php
define('DELTA_VERCEL_DEPLOY_HOOK_STAGING', 'https://api.vercel.com/v1/integrations/deploy/...');
```

`DELTA_VERCEL_DEPLOY_HOOK_PRODUCTION` is **only** ever set via wp-config, and only
after the production cutover is approved (Phase 8) — it is never exposed in the
admin UI, so routine editing can never trigger a production build.
