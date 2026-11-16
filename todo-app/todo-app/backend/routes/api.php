<?php

use App\Http\Controllers\TaskController;
use Illuminate\Support\Facades\Route;

/*
 * RESTful task API (all routes are prefixed with /api).
 *
 *   GET    /api/tasks                 latest 5 incomplete tasks
 *   POST   /api/tasks                 create
 *   GET    /api/tasks/{task}          read one
 *   PUT    /api/tasks/{task}          update title + description
 *   PATCH  /api/tasks/{task}/complete mark as done (hides it from the list)
 *   DELETE /api/tasks/{task}          delete permanently
 */
Route::apiResource('tasks', TaskController::class);
Route::patch('tasks/{task}/complete', [TaskController::class, 'complete'])->name('tasks.complete');
