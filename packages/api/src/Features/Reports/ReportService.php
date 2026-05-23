<?php

declare(strict_types=1);

namespace App\Features\Reports;

use App\Features\Tools\ToolLookupInterface;

final class ReportService
{
    private const REASONS = ['spam', 'inappropriate', 'duplicate', 'incorrect_info'];

    public function __construct(
        private ReportRepository $reports,
        private ToolLookupInterface $tools,
    ) {}

    /** @return array{report?: array, error?: string, status?: int} */
    public function create(string $toolId, string $userId, mixed $reason, mixed $note): array
    {
        if (!$this->tools->exists($toolId)) {
            return ['error' => 'Tool not found', 'status' => 404];
        }

        $reason = (string) $reason;
        if (!in_array($reason, self::REASONS, true)) {
            return ['error' => 'Invalid report reason', 'status' => 400];
        }

        $note = trim((string) ($note ?? ''));

        return ['report' => $this->reports->create($toolId, $userId, $reason, $note !== '' ? $note : null)];
    }
}
