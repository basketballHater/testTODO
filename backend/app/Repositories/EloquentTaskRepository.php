<?php

namespace App\Repositories;

use App\Models\Task;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;

class EloquentTaskRepository implements TaskRepositoryInterface
{
    public function latestIncomplete(int $limit): Collection
    {
        // Served by the (completed_at, created_at) index: filter on completed_at,
        // then read newest-first. `id` breaks ties for rows created in the same second.
        return Task::query()
            ->whereNull('completed_at')
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->limit($limit)
            ->get();
    }

    public function create(array $attributes): Task
    {
        return Task::create($attributes);
    }

    public function update(Task $task, array $attributes): Task
    {
        $task->update($attributes);

        return $task;
    }

    public function markCompleted(Task $task, CarbonInterface $completedAt): Task
    {
        $task->completed_at = $completedAt;
        $task->save();

        return $task;
    }

    public function delete(Task $task): void
    {
        $task->delete();
    }
}
