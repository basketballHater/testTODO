<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\DB;

abstract class TestCase extends BaseTestCase
{
    /**
     * Hook called by RefreshDatabase right BEFORE it runs `migrate:fresh` (which drops every
     * table). Refuse to continue unless the database looks throw-away, so `php artisan test`
     * can never erase dev data.
     */
    protected function beforeRefreshingDatabase(): void
    {
        $connection = DB::connection();

        if ($connection->getDriverName() === 'sqlite') {
            return;
        }

        $database = (string) $connection->getDatabaseName();

        if (! str_ends_with($database, '_test')) {
            $this->fail(
                "Refusing to run tests against database '{$database}'. ".
                "Use a database whose name ends in '_test' (e.g. DB_DATABASE=todo_test)."
            );
        }
    }
}
