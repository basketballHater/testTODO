<?php

namespace Tests\Unit;

use App\Models\Task;
use App\Repositories\TaskRepositoryInterface;
use App\Services\TaskService;
use Carbon\CarbonInterface;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use PHPUnit\Framework\MockObject\MockObject;
use Tests\TestCase;

/** Business rules in isolation: the repository is mocked, no database is touched. */
class TaskServiceTest extends TestCase
{
    private TaskRepositoryInterface&MockObject $repository;

    private TaskService $service;

    protected function setUp(): void
    {
        parent::setUp();

        $this->repository = $this->createMock(TaskRepositoryInterface::class);
        $this->service = new TaskService($this->repository);
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }

    public function test_visible_tasks_asks_for_exactly_five_latest_incomplete_tasks(): void
    {
        $expected = new Collection([new Task(['title' => 'A'])]);

        $this->repository->expects($this->once())
            ->method('latestIncomplete')
            ->with(5)
            ->willReturn($expected);

        $this->assertSame($expected, $this->service->visibleTasks());
        $this->assertSame(5, TaskService::VISIBLE_LIMIT);
    }

    public function test_create_delegates_to_the_repository(): void
    {
        $data = ['title' => 'A', 'description' => 'B'];
        $task = new Task($data);

        $this->repository->expects($this->once())->method('create')->with($data)->willReturn($task);

        $this->assertSame($task, $this->service->create($data));
    }

    public function test_update_delegates_to_the_repository(): void
    {
        $task = new Task(['title' => 'Old']);
        $data = ['title' => 'New'];

        $this->repository->expects($this->once())->method('update')->with($task, $data)->willReturn($task);

        $this->assertSame($task, $this->service->update($task, $data));
    }

    public function test_complete_stamps_the_current_time(): void
    {
        Carbon::setTestNow('2026-11-16 08:00:00');
        $task = new Task(['title' => 'A']);

        $this->repository->expects($this->once())
            ->method('markCompleted')
            ->with($task, $this->callback(
                fn (CarbonInterface $at) => $at->toDateTimeString() === '2026-11-16 08:00:00'
            ))
            ->willReturn($task);

        $this->assertSame($task, $this->service->complete($task));
    }

    public function test_complete_does_nothing_for_an_already_completed_task(): void
    {
        $task = new Task(['title' => 'A']);
        $task->completed_at = Carbon::parse('2026-01-01 00:00:00');

        $this->repository->expects($this->never())->method('markCompleted');

        $this->assertSame($task, $this->service->complete($task));
    }

    public function test_delete_delegates_to_the_repository(): void
    {
        $task = new Task(['title' => 'A']);

        $this->repository->expects($this->once())->method('delete')->with($task);

        $this->service->delete($task);
    }
}
