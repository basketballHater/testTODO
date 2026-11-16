<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('task', function (Blueprint $table) {
            $table->id();
            $table->string('title', 255);
            // Optional free text; NULL and "" are both rendered as "no description".
            $table->text('description')->nullable();
            // NULL = still open. A timestamp (instead of a boolean) also records *when*
            // the task was finished, at no extra cost.
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            // Serves the only hot query: "newest open tasks"
            //   WHERE completed_at IS NULL ORDER BY created_at DESC, id DESC LIMIT 5
            // InnoDB appends the primary key to every secondary index, so `id` is
            // available for the tie-break without being listed here.
            $table->index(['completed_at', 'created_at'], 'task_open_recent_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('task');
    }
};
