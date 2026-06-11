<?php

declare(strict_types=1);

namespace App\Features\OAuth;

use League\OAuth2\Server\Entities\AuthCodeEntityInterface;
use League\OAuth2\Server\Repositories\AuthCodeRepositoryInterface;

final class AuthCodeRepository implements AuthCodeRepositoryInterface
{
    public function __construct(private OAuthRepository $repo) {}

    public function getNewAuthCode(): AuthCodeEntityInterface
    {
        return new AuthCodeEntity();
    }

    public function persistNewAuthCode(AuthCodeEntityInterface $authCode): void
    {
        $scopeIds = array_map(fn ($s) => $s->getIdentifier(), $authCode->getScopes());

        $this->repo->persistAuthCode(
            $authCode->getIdentifier(),
            $authCode->getClient()->getIdentifier(),
            $authCode->getUserIdentifier(),
            $authCode->getRedirectUri(),
            $scopeIds,
            null,
            $authCode->getExpiryDateTime()->format('Y-m-d H:i:s'),
        );
    }

    public function revokeAuthCode(string $codeId): void
    {
        $this->repo->revokeAuthCode($codeId);
    }

    public function isAuthCodeRevoked(string $codeId): bool
    {
        return $this->repo->isAuthCodeRevoked($codeId);
    }
}
