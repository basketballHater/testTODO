<?php

namespace Tests\Integration;

use App\Models\Task;
use App\Repositories\EloquentTaskRepository;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

/** Repository against a real database (SQLite by default, MySQL in CI / Docker). */
class EloquentTaskRepositoryTest extends TestCase
{
    use RefreshDatabase;

    private EloquentTaskRepository $repository;

    protected function setUp(): void
    {
        parent::setUp();

        $this->repository = new EloquentTaskRepository;
    }

    public function test_latest_incomplete_respects_the_limit_and_orders_newest_first(): void
    {
        foreach (range(1, 4) as $n) {
            Task::factory()->create(['title' => "T{$n}", 'created_at' => Carbon::now()->addMinutes($n)]);
        }

        $titles = $this->repository->latestIncomplete(3)->pluck('title')->all();

        $this->assertSame(['T4', 'T3', 'T2'], $titles);
    }

    public function test_latest_incomplete_skips_completed_tasks(): void
    {
        Task::factory()->completed()->create();
        $open = Task::factory()->create();

        $this->assertSame([$open->id], $this->repository->latestIncomplete(5)->pluck('id')->all());
    }

    public function test_create_persists_a_task(): void
    {
        $task = $this->repository->create(['title' => 'A', 'description' => 'B']);

        $this->assertDatabaseHas('task', ['id' => $task->id, 'title' => 'A', 'description' => 'B']);
    }

    public function test_update_persists_changes(): void
    {
        $task = Task::factory()->create();

        $this->repository->update($task, ['title' => 'Changed', 'description' => null]);

        $this->assertDatabaseHas('task', ['id' => $task->id, 'title' => 'Changed', 'description' => null]);
    }

    public function test_mark_completed_stores_the_timestamp(): void
    {
        $task = Task::factory()->create();
        $at = Carbon::parse('2026-11-16 08:00:00');

        $this->repository->markCompleted($task, $at);

        $this->assertSame('2026-11-16 08:00:00', $task->fresh()->completed_at->toDateTimeString());
    }

    public function test_delete_removes_the_row(): void
    {
        $task = Task::factory()->create();

        $this->repository->delete($task);

        $this->assertDatabaseMissing('task', ['id' => $task->id]);
    }
}
