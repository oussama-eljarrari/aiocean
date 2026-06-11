<?php

declare(strict_types=1);

namespace App\Features\OAuth;

use League\OAuth2\Server\Entities\AccessTokenEntityInterface;
use League\OAuth2\Server\Entities\ClientEntityInterface;
use League\OAuth2\Server\Repositories\AccessTokenRepositoryInterface;

final class AccessTokenRepository implements AccessTokenRepositoryInterface
{
    public function __construct(
        private OAuthRepository $repo,
        private string $issuer,
        private string $audience,
    ) {}

    public function getNewToken(
        ClientEntityInterface $clientEntity,
        array $scopes,
        ?string $userIdentifier = null,
    ): AccessTokenEntityInterface {
        $token = new AccessTokenEntity();
        $token->setClient($clientEntity);
        $token->setIssuer($this->issuer);
        $token->setAudience($this->audience);
        foreach ($scopes as $scope) {
            $token->addScope($scope);
        }
        if ($userIdentifier !== null) {
            $token->setUserIdentifier($userIdentifier);
        }
        return $token;
    }

    public function persistNewAccessToken(AccessTokenEntityInterface $token): void
    {
        $scopeIds = array_map(fn ($s) => $s->getIdentifier(), $token->getScopes());

        $this->repo->persistAccessToken(
            $token->getIdentifier(),
            $token->getClient()->getIdentifier(),
            $token->getUserIdentifier(),
            $scopeIds,
            $this->audience,
            $token->getExpiryDateTime()->format('Y-m-d H:i:s'),
        );
    }

    public function revokeAccessToken(string $tokenId): void
    {
        $this->repo->revokeAccessToken($tokenId);
    }

    public function isAccessTokenRevoked(string $tokenId): bool
    {
        return $this->repo->isAccessTokenRevoked($tokenId);
    }
}
