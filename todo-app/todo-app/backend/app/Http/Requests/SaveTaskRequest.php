<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Validates the payload for both creating and (fully) updating a task.
 * Laravel's TrimStrings / ConvertEmptyStringsToNull middleware run first, so a
 * whitespace-only title is treated as missing.
 */
class SaveTaskRequest extends FormRequest
{
    public const TITLE_MAX = 255;

    public const DESCRIPTION_MAX = 5000;

    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<int, string>> */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:'.self::TITLE_MAX],
            'description' => ['nullable', 'string', 'max:'.self::DESCRIPTION_MAX],
        ];
    }
}
