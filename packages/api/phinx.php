<?php

declare(strict_types=1);

$config = require __DIR__ . '/config/app.php';

return [
    'paths' => [
        'migrations' => __DIR__ . '/migrations',
        'seeds'      => __DIR__ . '/seeds',
    ],
    'environments' => [
        'default_migration_table' => 'phinxlog',
        'default_environment'     => 'development',
        'development' => [
            'adapter' => $config['db']['driver'],
            'name'    => $config['db']['path'],
            'suffix'  => '',
        ],
    ],
];
