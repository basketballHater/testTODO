<?php

namespace Tests\Feature;

use App\Models\Task;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

/** End-to-end HTTP tests for the REST API (request -> controller -> service -> repository -> DB). */
class TaskApiTest extends TestCase
{
    use RefreshDatabase;

    // ---------------------------------------------------------------- index

    public function test_index_returns_an_empty_list_when_there_are_no_tasks(): void
    {
        $this->getJson('/api/tasks')
            ->assertOk()
            ->assertExactJson(['data' => []]);
    }

    public function test_index_returns_the_expected_task_shape(): void
    {
        Task::factory()->create(['title' => 'Buy books', 'description' => 'For school']);

        $this->getJson('/api/tasks')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title', 'Buy books')
            ->assertJsonPath('data.0.description', 'For school')
            ->assertJsonPath('data.0.completed', false)
            ->assertJsonStructure(['data' => [['id', 'title', 'description', 'completed', 'completed_at', 'created_at', 'updated_at']]]);
    }

    public function test_index_returns_only_the_five_most_recent_incomplete_tasks_newest_first(): void
    {
        foreach (range(1, 7) as $n) {
            Task::factory()->create(['title' => "Task {$n}", 'created_at' => Carbon::now()->addMinutes($n)]);
        }

        $titles = $this->getJson('/api/tasks')
            ->assertOk()
            ->assertJsonCount(5, 'data')
            ->json('data.*.title');

        $this->assertSame(['Task 7', 'Task 6', 'Task 5', 'Task 4', 'Task 3'], $titles);
    }

    public function test_index_breaks_created_at_ties_by_id(): void
    {
        $at = Carbon::parse('2026-11-16 08:00:00');
        $first = Task::factory()->create(['created_at' => $at]);
        $second = Task::factory()->create(['created_at' => $at]);

        $ids = $this->getJson('/api/tasks')->json('data.*.id');

        $this->assertSame([$second->id, $first->id], $ids);
    }

    public function test_index_never_includes_completed_tasks(): void
    {
        Task::factory()->completed()->create(['title' => 'Already done']);
        Task::factory()->create(['title' => 'Still open']);

        $this->getJson('/api/tasks')
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title', 'Still open');
    }

    // ---------------------------------------------------------------- store

    public function test_store_creates_a_task(): void
    {
        $this->postJson('/api/tasks', ['title' => 'Play Cricket', 'description' => 'Sunday match'])
            ->assertCreated()
            ->assertJsonPath('data.title', 'Play Cricket')
            ->assertJsonPath('data.description', 'Sunday match')
            ->assertJsonPath('data.completed', false);

        $this->assertDatabaseHas('task', ['title' => 'Play Cricket', 'description' => 'Sunday match', 'completed_at' => null]);
    }

    public function test_store_allows_a_missing_description(): void
    {
        $this->postJson('/api/tasks', ['title' => 'No details'])
            ->assertCreated()
            ->assertJsonPath('data.description', '');
    }

    public function test_store_trims_the_title(): void
    {
        $this->postJson('/api/tasks', ['title' => '   Padded   '])
            ->assertCreated()
            ->assertJsonPath('data.title', 'Padded');
    }

    public function test_store_requires_a_title(): void
    {
        $this->postJson('/api/tasks', ['description' => 'x'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['title']);

        $this->assertDatabaseCount('task', 0);
    }

    public function test_store_rejects_a_whitespace_only_title(): void
    {
        $this->postJson('/api/tasks', ['title' => '    '])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['title']);
    }

    public function test_store_rejects_a_title_longer_than_255_characters(): void
    {
        $this->postJson('/api/tasks', ['title' => str_repeat('a', 256)])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['title']);
    }

    public function test_store_accepts_a_title_of_exactly_255_characters(): void
    {
        $this->postJson('/api/tasks', ['title' => str_repeat('a', 255)])->assertCreated();
    }

    public function test_store_rejects_an_overlong_description(): void
    {
        $this->postJson('/api/tasks', ['title' => 'ok', 'description' => str_repeat('a', 5001)])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['description']);
    }

    public function test_store_ignores_attempts_to_mass_assign_completion(): void
    {
        $this->postJson('/api/tasks', ['title' => 'Sneaky', 'completed_at' => now()->toIso8601String()])
            ->assertCreated()
            ->assertJsonPath('data.completed', false);
    }

    public function test_store_returns_validation_errors_as_json_even_without_an_accept_header(): void
    {
        $this->post('/api/tasks', [])
            ->assertUnprocessable()
            ->assertJsonStructure(['message', 'errors' => ['title']]);
    }

    // ----------------------------------------------------------------- show

    public function test_show_returns_a_single_task(): void
    {
        $task = Task::factory()->create(['title' => 'Clean home']);

        $this->getJson("/api/tasks/{$task->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $task->id)
            ->assertJsonPath('data.title', 'Clean home');
    }

    public function test_show_returns_404_json_for_an_unknown_task(): void
    {
        $this->getJson('/api/tasks/999')
            ->assertNotFound()
            ->assertJsonStructure(['message']);
    }

    // --------------------------------------------------------------- update

    public function test_update_changes_title_and_description(): void
    {
        $task = Task::factory()->create(['title' => 'Old', 'description' => 'Old desc']);

        $this->putJson("/api/tasks/{$task->id}", ['title' => 'New', 'description' => 'New desc'])
            ->assertOk()
            ->assertJsonPath('data.title', 'New')
            ->assertJsonPath('data.description', 'New desc');

        $this->assertDatabaseHas('task', ['id' => $task->id, 'title' => 'New', 'description' => 'New desc']);
    }

    public function test_update_can_clear_the_description(): void
    {
        $task = Task::factory()->create(['description' => 'Something']);

        $this->putJson("/api/tasks/{$task->id}", ['title' => $task->title, 'description' => ''])
            ->assertOk()
            ->assertJsonPath('data.description', '');
    }

    public function test_update_validates_input(): void
    {
        $task = Task::factory()->create(['title' => 'Keep me']);

        $this->putJson("/api/tasks/{$task->id}", ['title' => ''])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['title']);

        $this->assertDatabaseHas('task', ['id' => $task->id, 'title' => 'Keep me']);
    }

    public function test_update_returns_404_for_an_unknown_task(): void
    {
        $this->putJson('/api/tasks/999', ['title' => 'x'])->assertNotFound();
    }

    public function test_update_does_not_change_completion_state(): void
    {
        $task = Task::factory()->completed()->create();

        $this->putJson("/api/tasks/{$task->id}", ['title' => 'Renamed'])
            ->assertOk()
            ->assertJsonPath('data.completed', true);
    }

    // ------------------------------------------------------------- complete

    public function test_complete_marks_the_task_done_and_hides_it_from_the_list(): void
    {
        $task = Task::factory()->create();

        $this->patchJson("/api/tasks/{$task->id}/complete")
            ->assertOk()
            ->assertJsonPath('data.completed', true)
            ->assertJsonPath('data.id', $task->id);

        $this->assertNotNull($task->fresh()->completed_at);
        $this->getJson('/api/tasks')->assertJsonCount(0, 'data');
    }

    public function test_completing_a_task_lets_an_older_task_take_its_place_in_the_top_five(): void
    {
        $tasks = collect(range(1, 6))->map(
            fn (int $n) => Task::factory()->create(['title' => "Task {$n}", 'created_at' => Carbon::now()->addMinutes($n)])
        );

        $this->assertNotContains('Task 1', $this->getJson('/api/tasks')->json('data.*.title'));

        $this->patchJson("/api/tasks/{$tasks->last()->id}/complete")->assertOk();

        $this->assertContains('Task 1', $this->getJson('/api/tasks')->json('data.*.title'));
    }

    public function test_complete_is_idempotent_and_keeps_the_first_completion_time(): void
    {
        $task = Task::factory()->create();

        Carbon::setTestNow('2026-11-16 08:00:00');
        $this->patchJson("/api/tasks/{$task->id}/complete")->assertOk();

        Carbon::setTestNow('2026-11-17 09:30:00');
        $this->patchJson("/api/tasks/{$task->id}/complete")->assertOk();

        $this->assertSame('2026-11-16 08:00:00', $task->fresh()->completed_at->toDateTimeString());

        Carbon::setTestNow();
    }

    public function test_complete_returns_404_for_an_unknown_task(): void
    {
        $this->patchJson('/api/tasks/999/complete')->assertNotFound();
    }

    // --------------------------------------------------------------- delete

    public function test_destroy_permanently_deletes_the_task(): void
    {
        $task = Task::factory()->create();

        $this->deleteJson("/api/tasks/{$task->id}")->assertNoContent();

        $this->assertDatabaseMissing('task', ['id' => $task->id]);
        $this->getJson('/api/tasks')->assertJsonCount(0, 'data');
    }

    public function test_destroy_returns_404_for_an_unknown_task(): void
    {
        $this->deleteJson('/api/tasks/999')->assertNotFound();
    }

    public function test_destroy_only_removes_the_requested_task(): void
    {
        $keep = Task::factory()->create();
        $remove = Task::factory()->create();

        $this->deleteJson("/api/tasks/{$remove->id}")->assertNoContent();

        $this->assertDatabaseHas('task', ['id' => $keep->id]);
    }

    // --------------------------------------------------------------- health

    public function test_health_endpoint_is_up(): void
    {
        $this->get('/up')->assertOk();
    }
}
