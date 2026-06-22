<?php
/**
 * Plugin Name: Delta Vercel Deploy Hook
 * Description: Debounces WordPress content changes and triggers Delta staging/production Vercel builds.
 * Version: 1.0.0
 * Author: Delta Inc
 */

if (!defined('ABSPATH')) {
    exit;
}

const DELTA_VERCEL_CRON_EVENT = 'delta_vercel_dispatch_deploy_hooks';
const DELTA_VERCEL_DEBOUNCE_SECONDS = 60;
const DELTA_VERCEL_MAX_ATTEMPTS = 3;

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

function delta_vercel_hook_urls(): array
{
    $hooks = [];
    if (defined('DELTA_VERCEL_DEPLOY_HOOK_STAGING') && DELTA_VERCEL_DEPLOY_HOOK_STAGING) {
        $hooks['staging'] = DELTA_VERCEL_DEPLOY_HOOK_STAGING;
    }
    if (defined('DELTA_VERCEL_DEPLOY_HOOK_PRODUCTION') && DELTA_VERCEL_DEPLOY_HOOK_PRODUCTION) {
        $hooks['production'] = DELTA_VERCEL_DEPLOY_HOOK_PRODUCTION;
    }
    return $hooks;
}

function delta_vercel_dispatch_deploy_hooks(int $attempt = 1): void
{
    $hooks = delta_vercel_hook_urls();
    if (!$hooks) {
        error_log('Delta Vercel: no deploy hook constants are configured.');
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
