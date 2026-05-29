<?php

declare(strict_types=1);

namespace App\Features\Users;

interface UserRepositoryInterface
{
    public function findByEmail(string $email): ?User;
    public function findById(string $id): ?User;
    public function create(string $id, string $name, string $email, string $passHash): User;
    public function emailExists(string $email): bool;
    public function updateProfile(string $id, string $name, string $email, ?string $pfpUrl): ?User;
    public function falsemail(string $email, string $userId): bool;
}
