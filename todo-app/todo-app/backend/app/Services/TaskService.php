<?php

namespace App\Services;

use App\Models\Task;
use App\Repositories\TaskRepositoryInterface;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

/**
 * Business rules for tasks. Knows nothing about HTTP or about how tasks are stored.
 */
class TaskService
{
    /** Only this many of the newest incomplete tasks are ever shown. */
    public const VISIBLE_LIMIT = 5;

    public function __construct(private readonly TaskRepositoryInterface $tasks) {}

    /** @return Collection<int, Task> */
    public function visibleTasks(): Collection
    {
        return $this->tasks->latestIncomplete(self::VISIBLE_LIMIT);
    }

    /** @param  array{title: string, description?: string|null}  $data */
    public function create(array $data): Task
    {
        return $this->tasks->create($data);
    }

    /** @param  array{title: string, description?: string|null}  $data */
    public function update(Task $task, array $data): Task
    {
        return $this->tasks->update($task, $data);
    }

    /** Completing is idempotent: the original completion time is kept. */
    public function complete(Task $task): Task
    {
        if ($task->isCompleted()) {
            return $task;
        }

        return $this->tasks->markCompleted($task, Carbon::now());
    }

    public function delete(Task $task): void
    {
        $this->tasks->delete($task);
    }
}
