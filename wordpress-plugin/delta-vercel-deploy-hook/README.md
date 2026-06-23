# Delta Vercel Deploy Hook

Install this directory as a WordPress plugin and activate it. Add the staging hook to `wp-config.php`:

```php
define('DELTA_VERCEL_DEPLOY_HOOK_STAGING', 'https://api.vercel.com/v1/integrations/deploy/...');
```

Add `DELTA_VERCEL_DEPLOY_HOOK_PRODUCTION` only after the production cutover is approved.

The plugin waits 60 seconds after a relevant `post` or `program` change, triggers the configured Vercel hook, retries failures up to three times, and stores its last result in the `delta_vercel_deploy_hook_status` option. Scheduled `future` → `publish` transitions are included.

