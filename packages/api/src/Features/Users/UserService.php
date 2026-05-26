<?php

declare(strict_types=1);

namespace App\Features\Users;

use App\Shared\EmailService;

final class UserService
{
    public function __construct(
        private UserRepositoryInterface $userRepository,
        private EmailService $emailService,
    ) {}

    public function verifyCredentials(string $email, string $password): ?User
    {
        $user = $this->userRepository->findByEmail($email);

        if (!$user) {
            return null;
        }

        return password_verify($password, $user->pass_hash) ? $user : null;
    }

    public function getById(string $id): ?User
    {
        return $this->userRepository->findById($id);
    }

    /**
     * @return array{user: User}|array{error: string}
     */
    public function register(string $name, string $email, string $password): array
    {
        if ($this->userRepository->emailExists($email)) {
            return ['error' => 'Email already in use'];
        }

        $id   = bin2hex(random_bytes(16));
        $hash = password_hash($password, PASSWORD_DEFAULT);
        $user = $this->userRepository->create($id, $name, $email, $hash);

        // Send welcome email — silently skip if not configured
        if ($this->emailService !== null) {
            try {
                $this->emailService->sendWelcome($email, $name);
            } catch (\Throwable) {
                // do not fail registration if email fails
            }
        }

        return ['user' => $user];
    }

    public function updateProfile(string $userId, string $name, string $email, ?string $pfpUrl): array
    {
        $user = $this->userRepository->findById($userId);
        if (!$user) {
            return ['error' => 'User not found'];
        }
        if ($this->userRepository->falsemail($email, $userId)) {
            return ['error' => 'Email already in use'];
        }
        $updatedUser = $this->userRepository->updateProfile($userId, $name, $email, $pfpUrl);
        if (!$updatedUser) {
            return ['error' => 'Could not update profile'];
        }
        return ['user' => $updatedUser];
    }



}
