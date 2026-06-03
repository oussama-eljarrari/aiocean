<?php

declare(strict_types=1);

namespace App\Features\Users;

use PDO;

final class UserRepository implements UserRepositoryInterface
{
    public function __construct(private PDO $pdo) {}

    public function findByEmail(string $email): ?User
    {
        $stmt = $this->pdo->prepare('SELECT * FROM users WHERE email = ?');
        $stmt->execute([$email]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return $row ? $this->hydrate($row) : null;
    }

    public function findById(string $id): ?User
    {
        $stmt = $this->pdo->prepare('SELECT * FROM users WHERE id = ?');
        $stmt->execute([$id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return $row ? $this->hydrate($row) : null;
    }

    public function emailExists(string $email): bool
    {
        $stmt = $this->pdo->prepare('SELECT 1 FROM users WHERE email = ?');
        $stmt->execute([$email]);
        return (bool) $stmt->fetch();
    }

    public function create(string $id, string $name, string $email, string $passHash): User
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO users (id, name, email, pass_hash, role) VALUES (?, ?, ?, ?, ?)'
        );
        $stmt->execute([$id, $name, $email, $passHash, 'user']);

        return new User($id, $name, $email, $passHash, 'user', null);
    }

    private function hydrate(array $row): User
    {
        return new User(
            $row['id'],
            $row['name'],
            $row['email'],
            $row['pass_hash'],
            $row['role'],
            $row['pfp_url'] ?? null
        );
    }

    public function updateProfile(string $id, string $name, string $email, ?string $pfpUrl): ?User
    {
        $stmt = $this->pdo->prepare(
            'UPDATE users SET name = ?, email = ?, pfp_url = ? WHERE id = ?'
        );
        $stmt->execute([$name, $email, $pfpUrl, $id]);
        return $this->findById($id);
    }


    public function updatePassword(string $id, string $passHash): void
    {
        $stmt = $this->pdo->prepare('UPDATE users SET pass_hash = ? WHERE id = ?');
        $stmt->execute([$passHash, $id]);
    }

    public function falsemail(string $email, string $userId): bool
    {
        $stmt = $this->pdo->prepare(
            'SELECT 1 FROM users WHERE email = ? AND id != ?'
        );
        $stmt->execute([$email, $userId]);
        return (bool) $stmt->fetch();
    }

}
