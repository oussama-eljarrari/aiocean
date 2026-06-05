<?php

declare(strict_types=1);

namespace App\Features\Tools;

/**
 * Tool service — business logic for listing, filtering, and retrieving tools.
 */
final class ToolService
{
    public function __construct(
        private ToolRepositoryInterface $repository,
    ) {}

    /**
     * List tools with optional search and category filters.
     *
     * @return array{tools: array, total: int, categories: string[]}
     */
    public function list(?string $search = null, ?string $category = null): array
    {
        $tools = $this->repository->findAll();

        if ($category !== null && $category !== '') {
            $tools = array_values(array_filter(
                $tools,
                fn(Tool $t) => strcasecmp($t->category, $category) === 0
            ));
        }

        if ($search !== null && $search !== '') {
            $q = strtolower($search);
            $tools = array_values(array_filter(
                $tools,
                fn(Tool $t) => str_contains(strtolower($t->name), $q)
                            || str_contains(strtolower($t->tagline), $q)
                            || str_contains(strtolower($t->primaryUseCase), $q)
            ));
        }

        return [
            'tools'      => array_map(fn(Tool $t) => $t->toArray(), $tools),
            'total'      => count($tools),
            'categories' => $this->repository->categories(),
        ];
    }

    /**
     * Get a single tool by ID.
     */
    public function getById(string $id): ?array
    {
        $tool = $this->repository->findById($id);
        return $tool?->toArray();
    }

    /**
     * Get all available categories.
     *
     * @return array<int, array{id: string, name: string}>
     */
    public function categories(): array
    {
        return $this->repository->categories();
    }
}
