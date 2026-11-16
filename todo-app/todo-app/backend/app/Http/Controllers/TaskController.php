<?php

namespace App\Http\Controllers;

use App\Http\Requests\SaveTaskRequest;
use App\Http\Resources\TaskResource;
use App\Models\Task;
use App\Services\TaskService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

/**
 * Thin HTTP adapter: validate (FormRequest) -> delegate (TaskService) -> shape (TaskResource).
 */
class TaskController extends Controller
{
    public function __construct(private readonly TaskService $service) {}

    public function index(): AnonymousResourceCollection
    {
        return TaskResource::collection($this->service->visibleTasks());
    }

    public function store(SaveTaskRequest $request): JsonResponse
    {
        $task = $this->service->create($request->validated());

        return (new TaskResource($task))->response()->setStatusCode(Response::HTTP_CREATED);
    }

    public function show(Task $task): TaskResource
    {
        return new TaskResource($task);
    }

    public function update(SaveTaskRequest $request, Task $task): TaskResource
    {
        return new TaskResource($this->service->update($task, $request->validated()));
    }

    public function complete(Task $task): TaskResource
    {
        return new TaskResource($this->service->complete($task));
    }

    public function destroy(Task $task): Response
    {
        $this->service->delete($task);

        return response()->noContent();
    }
}
