<?php

namespace App\Repositories;

use App\Models\Task;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;

/**
 * Persistence boundary for tasks. The service layer depends on this contract
 * (not on Eloquent), so storage can be swapped or faked without touching
 * business rules.
 */
interface TaskRepositoryInterface
{
    /**
     * The most recently created tasks that are not completed, newest first.
     *
     * @return Collection<int, Task>
     */
    public function latestIncomplete(int $limit): Collection;

    /** @param  array{title: string, description?: string|null}  $attributes */
    public function create(array $attributes): Task;

    /** @param  array{title: string, description?: string|null}  $attributes */
    public function update(Task $task, array $attributes): Task;

    public function markCompleted(Task $task, CarbonInterface $completedAt): Task;

    public function delete(Task $task): void;
}
