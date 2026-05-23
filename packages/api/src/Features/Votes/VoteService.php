<?php

declare(strict_types=1);

namespace App\Features\Votes;

use App\Features\Tools\ToolLookupInterface;

final class VoteService
{
    public function __construct(
        private VoteRepository $votes,
        private ToolLookupInterface $tools,
    ) {}

    /** @return array{voted?: bool, count?: int, error?: string, status?: int} */
    public function toggle(string $toolId, string $userId): array
    {
        if (!$this->tools->exists($toolId)) {
            return ['error' => 'Tool not found', 'status' => 404];
        }

        $voted = $this->votes->toggle($toolId, $userId);

        return [
            'voted' => $voted,
            'count' => $this->votes->countForTool($toolId),
        ];
    }
}
