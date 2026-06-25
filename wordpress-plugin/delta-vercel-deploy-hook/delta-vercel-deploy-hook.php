<?php
/**
 * Plugin Name: Delta Vercel Deploy Hook
 * Description: Debounces WordPress content changes and triggers Delta staging/production Vercel builds. Configure the staging hook URL under Settings → Delta Deploy (no wp-config edit required).
 * Version: 1.1.0
 * Author: Delta Inc
 */

if (!defined('ABSPATH')) {
    exit;
}

const DELTA_VERCEL_CRON_EVENT = 'delta_vercel_dispatch_deploy_hooks';
const DELTA_VERCEL_DEBOUNCE_SECONDS = 60;
const DELTA_VERCEL_MAX_ATTEMPTS = 3;
const DELTA_VERCEL_STAGING_OPTION = 'delta_vercel_deploy_hook_staging_url';

function delta_vercel_supported_post($post): bool
{
    return $post instanceof WP_Post
        && in_array($post->post_type, ['post', 'program'], true)
        && !wp_is_post_revision($post->ID)
        && !wp_is_post_autosave($post->ID);
}

function delta_vercel_schedule_deploy(): void
{
    if (wp_next_scheduled(DELTA_VERCEL_CRON_EVENT)) {
        return;
    }

    wp_schedule_single_event(
        time() + DELTA_VERCEL_DEBOUNCE_SECONDS,
        DELTA_VERCEL_CRON_EVENT,
        [1]
    );
}

function delta_vercel_on_status_transition(string $new_status, string $old_status, WP_Post $post): void
{
    if (!delta_vercel_supported_post($post)) {
        return;
    }

    // This includes manual publish, scheduled future -> publish, published edits,
    // unpublish, and publish -> trash transitions.
    if ($new_status === 'publish' || $old_status === 'publish') {
        delta_vercel_schedule_deploy();
    }
}
add_action('transition_post_status', 'delta_vercel_on_status_transition', 10, 3);

function delta_vercel_before_delete(int $post_id): void
{
    $post = get_post($post_id);
    if (delta_vercel_supported_post($post) && $post->post_status === 'publish') {
        delta_vercel_schedule_deploy();
    }
}
add_action('before_delete_post', 'delta_vercel_before_delete');

// Resolve the staging hook URL. A wp-config constant wins (explicit / locked for
// advanced setups); otherwise the value saved on Settings → Delta Deploy is used.
function delta_vercel_staging_hook_url(): string
{
    if (defined('DELTA_VERCEL_DEPLOY_HOOK_STAGING') && DELTA_VERCEL_DEPLOY_HOOK_STAGING) {
        return (string) DELTA_VERCEL_DEPLOY_HOOK_STAGING;
    }
    return (string) get_option(DELTA_VERCEL_STAGING_OPTION, '');
}

function delta_vercel_hook_urls(): array
{
    $hooks = [];
    $staging = delta_vercel_staging_hook_url();
    if ($staging) {
        $hooks['staging'] = $staging;
    }
    // Production is intentionally NOT exposed in the admin UI before cutover — it
    // can only be enabled by defining DELTA_VERCEL_DEPLOY_HOOK_PRODUCTION in
    // wp-config.php (Phase 8), so day-to-day editing can never hit production.
    if (defined('DELTA_VERCEL_DEPLOY_HOOK_PRODUCTION') && DELTA_VERCEL_DEPLOY_HOOK_PRODUCTION) {
        $hooks['production'] = DELTA_VERCEL_DEPLOY_HOOK_PRODUCTION;
    }
    return $hooks;
}

function delta_vercel_dispatch_deploy_hooks(int $attempt = 1): void
{
    $hooks = delta_vercel_hook_urls();
    if (!$hooks) {
        error_log('Delta Vercel: no deploy hook is configured (Settings → Delta Deploy).');
        return;
    }

    $failed = [];
    $results = [];
    foreach ($hooks as $environment => $url) {
        $response = wp_remote_post($url, [
            'timeout' => 10,
            'redirection' => 2,
            'blocking' => true,
            'headers' => ['Content-Type' => 'application/json'],
            'body' => wp_json_encode([
                'source' => 'wordpress',
                'environment' => $environment,
                'attempt' => $attempt,
            ]),
        ]);

        if (is_wp_error($response)) {
            $failed[] = $environment;
            $results[$environment] = $response->get_error_message();
            continue;
        }

        $status = wp_remote_retrieve_response_code($response);
        $results[$environment] = $status;
        if ($status < 200 || $status >= 300) {
            $failed[] = $environment;
        }
    }

    update_option('delta_vercel_deploy_hook_status', [
        'timestamp' => current_time('mysql', true),
        'attempt' => $attempt,
        'results' => $results,
    ], false);

    if ($failed && $attempt < DELTA_VERCEL_MAX_ATTEMPTS) {
        wp_schedule_single_event(time() + ($attempt * 60), DELTA_VERCEL_CRON_EVENT, [$attempt + 1]);
        error_log(sprintf(
            'Delta Vercel: deploy hook attempt %d failed for %s; retry scheduled.',
            $attempt,
            implode(', ', $failed)
        ));
    } elseif ($failed) {
        error_log(sprintf(
            'Delta Vercel: deploy hooks failed after %d attempts for %s.',
            $attempt,
            implode(', ', $failed)
        ));
    }
}
add_action(DELTA_VERCEL_CRON_EVENT, 'delta_vercel_dispatch_deploy_hooks', 10, 1);

// ─── Admin UI: Settings → Delta Deploy ───────────────────────────────────────
// Lets a novice paste the Vercel staging deploy-hook URL and run a test build
// WITHOUT editing wp-config.php. The URL is stored as a WordPress option.

function delta_vercel_admin_menu(): void
{
    add_options_page('Delta Deploy', 'Delta Deploy', 'manage_options', 'delta-vercel', 'delta_vercel_render_settings_page');
}
add_action('admin_menu', 'delta_vercel_admin_menu');

// Only accept genuine Vercel deploy-hook URLs, so the trigger can never be
// pointed at an arbitrary host.
function delta_vercel_is_valid_hook_url(string $url): bool
{
    return (bool) preg_match('#^https://api\.vercel\.com/#', $url);
}

function delta_vercel_render_settings_page(): void
{
    if (!current_user_can('manage_options')) {
        return;
    }

    $notice = '';
    $notice_type = 'info';

    if (isset($_POST['delta_vercel_action'])) {
        check_admin_referer('delta_vercel_settings');
        $action = sanitize_text_field(wp_unslash($_POST['delta_vercel_action']));

        if ($action === 'save') {
            $url = isset($_POST['delta_vercel_staging_url'])
                ? esc_url_raw(trim(wp_unslash($_POST['delta_vercel_staging_url'])))
                : '';
            if ($url === '' || delta_vercel_is_valid_hook_url($url)) {
                update_option(DELTA_VERCEL_STAGING_OPTION, $url, false);
                $notice = $url === '' ? 'Staging deploy hook cleared.' : 'Staging deploy hook saved.';
            } else {
                $notice = 'That does not look like a Vercel deploy hook URL (it must start with https://api.vercel.com/). Nothing was saved.';
                $notice_type = 'error';
            }
        } elseif ($action === 'rebuild') {
            if (delta_vercel_staging_hook_url()) {
                delta_vercel_dispatch_deploy_hooks(1);
                $notice = 'Rebuild triggered. Open Vercel → Deployments — a new build should appear within a few seconds.';
            } else {
                $notice = 'Save a deploy hook URL first, then try the rebuild button.';
                $notice_type = 'error';
            }
        }
    }

    $constant_locked = defined('DELTA_VERCEL_DEPLOY_HOOK_STAGING') && DELTA_VERCEL_DEPLOY_HOOK_STAGING;
    $current = (string) get_option(DELTA_VERCEL_STAGING_OPTION, '');
    $status = get_option('delta_vercel_deploy_hook_status', []);

    echo '<div class="wrap">';
    echo '<h1>Delta Deploy</h1>';
    echo '<p>When you publish, edit, unpublish, or delete a post or program, this site asks Vercel to rebuild the <strong>staging</strong> site (<code>test.deltainc.gr</code>) after a 60-second debounce. The live <code>deltainc.gr</code> site is never touched.</p>';

    if ($notice) {
        echo '<div class="notice notice-' . esc_attr($notice_type) . '"><p>' . esc_html($notice) . '</p></div>';
    }

    echo '<form method="post">';
    wp_nonce_field('delta_vercel_settings');
    echo '<table class="form-table"><tr>';
    echo '<th scope="row"><label for="delta_vercel_staging_url">Staging deploy hook URL</label></th>';
    echo '<td>';
    if ($constant_locked) {
        echo '<p><code>Locked in wp-config.php (DELTA_VERCEL_DEPLOY_HOOK_STAGING). Remove that constant to manage it here.</code></p>';
    } else {
        echo '<input type="url" id="delta_vercel_staging_url" name="delta_vercel_staging_url" class="regular-text" value="' . esc_attr($current) . '" placeholder="https://api.vercel.com/v1/integrations/deploy/...">';
        echo '<p class="description">Paste the Staging deploy hook from Vercel → Project → Settings → Git → Deploy Hooks. Starts with <code>https://api.vercel.com/</code>. Treat it like a password.</p>';
    }
    echo '</td></tr></table>';
    if (!$constant_locked) {
        echo '<p><button type="submit" name="delta_vercel_action" value="save" class="button button-primary">Save</button></p>';
    }
    echo '</form>';

    echo '<hr><h2>Test</h2>';
    echo '<p>Trigger a staging rebuild right now — no need to publish a post:</p>';
    echo '<form method="post">';
    wp_nonce_field('delta_vercel_settings');
    echo '<p><button type="submit" name="delta_vercel_action" value="rebuild" class="button">Rebuild staging now</button></p>';
    echo '</form>';

    if (!empty($status) && is_array($status)) {
        echo '<h2>Last trigger</h2>';
        echo '<p>Time (UTC): <code>' . esc_html((string) ($status['timestamp'] ?? '—')) . '</code><br>';
        echo 'Attempt: <code>' . esc_html((string) ($status['attempt'] ?? '—')) . '</code><br>';
        echo 'Result: <code>' . esc_html((string) wp_json_encode($status['results'] ?? [])) . '</code></p>';
        echo '<p class="description">A result of <code>{"staging":201}</code> (any 2xx) means Vercel accepted the build request.</p>';
    }

    echo '</div>';
}
