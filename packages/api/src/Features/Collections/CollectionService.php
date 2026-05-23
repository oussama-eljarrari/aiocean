<?php

declare(strict_types=1);

namespace App\Features\Collections;

use App\Features\Tools\ToolLookupInterface;

final class CollectionService
{
    public function __construct(
        private CollectionRepository $collections,
        private ToolLookupInterface $tools,
    ) {}

    public function list(string $userId): array
    {
        return $this->collections->findForUser($userId);
    }

    /** @return array{collection?: array, error?: string, status?: int} */
    public function create(string $userId, mixed $name, mixed $isPublic): array
    {
        $name = trim((string) $name);
        if ($name === '') {
            return ['error' => 'Collection name is required', 'status' => 400];
        }

        return ['collection' => $this->collections->create($userId, $name, (bool) $isPublic)];
    }

    /** @return array{collection?: array, error?: string, status?: int} */
    public function update(string $id, string $userId, array $body): array
    {
        $name = array_key_exists('name', $body) ? trim((string) $body['name']) : null;
        if ($name === '') {
            return ['error' => 'Collection name cannot be empty', 'status' => 400];
        }

        $isPublic = array_key_exists('is_public', $body) ? (bool) $body['is_public'] : null;
        $collection = $this->collections->update($id, $userId, $name, $isPublic);

        if ($collection === null) {
            return ['error' => 'Collection not found', 'status' => 404];
        }

        return ['collection' => $collection];
    }

    /** @return array{deleted?: bool, error?: string, status?: int} */
    public function delete(string $id, string $userId): array
    {
        if (!$this->collections->delete($id, $userId)) {
            return ['error' => 'Collection not found', 'status' => 404];
        }

        return ['deleted' => true];
    }

    /** @return array{collection?: array, error?: string, status?: int} */
    public function addTool(string $collectionId, string $userId, mixed $toolId): array
    {
        $toolId = (string) $toolId;
        if ($toolId === '' || !$this->tools->exists($toolId)) {
            return ['error' => 'Tool not found', 'status' => 404];
        }

        $collection = $this->collections->addTool($collectionId, $userId, $toolId);
        if ($collection === null) {
            return ['error' => 'Collection not found', 'status' => 404];
        }

        return ['collection' => $collection];
    }

    /** @return array{collection?: array, error?: string, status?: int} */
    public function removeTool(string $collectionId, string $userId, mixed $toolId): array
    {
        $toolId = (string) $toolId;
        if ($toolId === '') {
            return ['error' => 'Tool id is required', 'status' => 400];
        }

        $collection = $this->collections->removeTool($collectionId, $userId, $toolId);
        if ($collection === null) {
            return ['error' => 'Collection not found', 'status' => 404];
        }

        return ['collection' => $collection];
    }
}
