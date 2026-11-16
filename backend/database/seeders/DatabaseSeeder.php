<?php

namespace Database\Seeders;

use App\Models\Task;
use Illuminate\Database\Seeder;

/** Demo data matching the UI mockup. Run with `php artisan db:seed`. */
class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Idempotent: never pile demo rows on top of real data (the container
        // entrypoint seeds on every start when DB_SEED=true).
        if (Task::query()->exists()) {
            return;
        }

        $tasks = [
            ['Help Saman', 'Saman needs help with his software project'],
            ['Play Cricket', 'Plan the soft ball match on Sunday'],
            ['Takehome assignment', 'Finish the mid-term assignment'],
            ['Clean home', 'Need to clean the bedroom'],
            ['Buy books', 'Buy books for the next school year'],
        ];

        // Created oldest-first so "Buy books" ends up as the newest, i.e. the first card.
        foreach ($tasks as $i => [$title, $description]) {
            Task::create(['title' => $title, 'description' => $description])
                ->forceFill(['created_at' => now()->addSeconds($i)])
                ->save();
        }
    }
}
