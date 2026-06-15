<?php

declare(strict_types=1);

/**
 * Backfills tools' official ratings from Product Hunt.
 *
 * Usage:
 *   php bin/refresh-ratings.php            # all active tools (skips ones already rated)
 *   php bin/refresh-ratings.php --force    # re-fetch every active tool
 *
 * Matching: uses each tool's stored producthunt_slug, else a slug guessed
 * from its name. Tools not found on Product Hunt are left unrated.
 */

require __DIR__ . '/../vendor/autoload.php';

use App\Features\Tools\ToolRepository;
use App\Shared\ProductHuntService;

$config = require __DIR__ . '/../config/app.php';

$force = in_array('--force', $argv, true);

$pdo = new PDO($config['db']['driver'] . ':' . $config['db']['path']);
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$repo = new ToolRepository($pdo);
$ph = new ProductHuntService(
    $config['producthunt']['client_id'] ?? '',
    $config['producthunt']['client_secret'] ?? '',
);

$tools = $repo->allForRatingRefresh();
echo 'Found ' . count($tools) . " active tools.\n";

$updated = 0;
$missed = 0;

foreach ($tools as $tool) {
    $slug = $tool['producthunt_slug'] ?: $ph->slugFromName($tool['name']);
    $result = $ph->fetchRating($slug);

    if ($result === null) {
        echo "  - {$tool['name']}: no Product Hunt match (slug: {$slug})\n";
        $missed++;
        continue;
    }

    $repo->updateExternalRating($tool['id'], $result['rating'], $result['count'], $result['source'], $slug);
    echo "  ✓ {$tool['name']}: {$result['rating']} ({$result['count']} reviews) via {$result['source']}\n";
    $updated++;

    usleep(300000); // be gentle with the API
}

echo "\nDone. Updated {$updated}, missed {$missed}.\n";
