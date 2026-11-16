<?php

namespace Tests\Integration;

use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

/** Guards the database design decisions: table name, columns, constraints and index. */
class TaskSchemaTest extends TestCase
{
    use RefreshDatabase;

    public function test_the_table_is_named_task_and_has_the_expected_columns(): void
    {
        $this->assertTrue(Schema::hasTable('task'));
        $this->assertTrue(Schema::hasColumns('task', [
            'id', 'title', 'description', 'completed_at', 'created_at', 'updated_at',
        ]));
    }

    public function test_the_open_tasks_index_exists_on_completed_at_and_created_at(): void
    {
        $index = collect(Schema::getIndexes('task'))->firstWhere('name', 'task_open_recent_index');

        $this->assertNotNull($index, 'Expected index task_open_recent_index');
        $this->assertSame(['completed_at', 'created_at'], $index['columns']);
    }

    public function test_title_is_required_at_the_database_level(): void
    {
        $this->expectException(QueryException::class);

        DB::table('task')->insert(['description' => 'no title', 'created_at' => now(), 'updated_at' => now()]);
    }

    public function test_description_and_completed_at_are_nullable(): void
    {
        DB::table('task')->insert(['title' => 'Only a title', 'created_at' => now(), 'updated_at' => now()]);

        $row = DB::table('task')->first();

        $this->assertNull($row->description);
        $this->assertNull($row->completed_at);
    }
}
