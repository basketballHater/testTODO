<?php

namespace Tests\Unit;

use App\Http\Resources\TaskResource;
use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class TaskResourceTest extends TestCase
{
    public function test_it_exposes_a_boolean_completed_flag_and_iso_dates(): void
    {
        $task = new Task(['title' => 'A', 'description' => 'B']);
        $task->id = 1;
        $task->created_at = Carbon::parse('2026-11-16 08:00:00', 'UTC');
        $task->updated_at = $task->created_at;

        $array = (new TaskResource($task))->toArray(Request::create('/'));

        $this->assertFalse($array['completed']);
        $this->assertNull($array['completed_at']);
        $this->assertSame('2026-11-16T08:00:00+00:00', $array['created_at']);
    }

    public function test_it_reports_completion_and_turns_a_null_description_into_an_empty_string(): void
    {
        $task = new Task(['title' => 'A']);
        $task->completed_at = Carbon::parse('2026-11-16 09:00:00', 'UTC');

        $array = (new TaskResource($task))->toArray(Request::create('/'));

        $this->assertTrue($array['completed']);
        $this->assertSame('', $array['description']);
    }
}
