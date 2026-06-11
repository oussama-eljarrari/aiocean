<?php

declare(strict_types=1);

namespace App\Features\OAuth;

use League\OAuth2\Server\Entities\ClientEntityInterface;
use League\OAuth2\Server\Entities\ScopeEntityInterface;
use League\OAuth2\Server\Repositories\ScopeRepositoryInterface;

final class ScopeRepository implements ScopeRepositoryInterface
{
    public function __construct(
        private OAuthRepository $repo,
        private \App\Features\Users\UserRepositoryInterface $userRepo
    ) {}

    public function getScopeEntityByIdentifier(string $identifier): ?ScopeEntityInterface
    {
        $row = $this->repo->findScope($identifier);
        if ($row === null) {
            return null;
        }

        $scope = new ScopeEntity();
        $scope->setIdentifier($row['identifier']);
        return $scope;
    }

    public function finalizeScopes(
        array $scopes,
        string $grantType,
        ClientEntityInterface $clientEntity,
        ?string $userIdentifier = null,
        ?string $authCodeId = null,
    ): array {
        if ($userIdentifier !== null) {
            $user = $this->userRepo->findById($userIdentifier);
            $isAdmin = $user !== null && $user->role === 'admin';

            if (!$isAdmin) {
                $scopes = array_filter($scopes, function ($scope) {
                    return $scope->getIdentifier() !== 'mcp:admin';
                });
            }
        } else {
            // If there is no user associated, strip mcp:admin scope by default
            $scopes = array_filter($scopes, function ($scope) {
                return $scope->getIdentifier() !== 'mcp:admin';
            });
        }
        return array_values($scopes);
    }
}
