<?php

declare(strict_types=1);

namespace App\Features\OAuth;

use League\OAuth2\Server\Entities\RefreshTokenEntityInterface;
use League\OAuth2\Server\Repositories\RefreshTokenRepositoryInterface;

final class RefreshTokenRepository implements RefreshTokenRepositoryInterface
{
    public function __construct(private OAuthRepository $repo) {}

    public function getNewRefreshToken(): ?RefreshTokenEntityInterface
    {
        return new RefreshTokenEntity();
    }

    public function persistNewRefreshToken(RefreshTokenEntityInterface $token): void
    {
        $this->repo->persistRefreshToken(
            $token->getIdentifier(),
            $token->getAccessToken()->getIdentifier(),
            $token->getExpiryDateTime()->format('Y-m-d H:i:s'),
        );
    }

    public function revokeRefreshToken(string $tokenId): void
    {
        $this->repo->revokeRefreshToken($tokenId);
    }

    public function isRefreshTokenRevoked(string $tokenId): bool
    {
        return $this->repo->isRefreshTokenRevoked($tokenId);
    }
}
