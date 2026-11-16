<?php

use Illuminate\Support\Str;

return [

    // The API is stateless; the in-process array store is enough for the
    // rate limiter and removes the need for a cache table or Redis.
    'default' => env('CACHE_STORE', 'array'),

    'stores' => [

        'array' => [
            'driver' => 'array',
            'serialize' => false,
        ],

        'file' => [
            'driver' => 'file',
            'path' => storage_path('framework/cache/data'),
            'lock_path' => storage_path('framework/cache/data'),
        ],

    ],

    'prefix' => env('CACHE_PREFIX', Str::slug((string) env('APP_NAME', 'todo-api')).'-cache-'),

];
