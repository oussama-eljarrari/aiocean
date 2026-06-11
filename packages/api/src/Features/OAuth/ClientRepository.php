<?php

declare(strict_types=1);

namespace App\Features\OAuth;

use League\OAuth2\Server\Entities\ClientEntityInterface;
use League\OAuth2\Server\Repositories\ClientRepositoryInterface;

final class ClientRepository implements ClientRepositoryInterface
{
    public function __construct(private OAuthRepository $repo) {}

    public function getClientEntity(string $clientIdentifier): ?ClientEntityInterface
    {
        $row = $this->repo->findClient($clientIdentifier);
        if ($row === null) {
            return null;
        }

        $entity = new ClientEntity();
        $entity->setIdentifier($row['id']);
        $entity->setName($row['name']);
        $entity->setRedirectUri($row['redirect_uris']);
        $entity->setIsConfidential($row['is_confidential']);

        return $entity;
    }

    public function validateClient(string $clientIdentifier, ?string $clientSecret, ?string $grantType): bool
    {
        $row = $this->repo->findClient($clientIdentifier);
        if ($row === null) {
            return false;
        }

        if ($grantType !== null && $grantType !== '' && !in_array($grantType, $row['grant_types'], true)) {
            return false;
        }

        // Public clients (PKCE flow): no secret required, no secret to verify
        if (!$row['is_confidential']) {
            return true;
        }

        // Confidential clients: secret required and must match
        if ($clientSecret === null || $clientSecret === '') {
            return false;
        }

        return $row['secret_hash'] !== null && password_verify($clientSecret, $row['secret_hash']);
    }
}
