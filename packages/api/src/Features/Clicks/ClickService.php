<?php

declare(strict_types=1);

namespace App\Features\Clicks;

use App\Features\Tools\ToolLookupInterface;

final class ClickService
{
    public function __construct(
        private ClickRepository $clicks,
        private ToolLookupInterface $tools,
    ) {}

    /** @return array{clicked?: bool, count?: int, error?: string, status?: int} */
    public function record(string $toolId, string $userId): array
    {
        if (!$this->tools->exists($toolId)) {
            return ['error' => 'Tool not found', 'status' => 404];
        }

        $this->clicks->record($toolId, $userId);

        return [
            'clicked' => true,
            'count' => $this->clicks->countForTool($toolId),
        ];
    }
}
