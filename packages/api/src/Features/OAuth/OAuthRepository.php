<?php

declare(strict_types=1);

namespace App\Features\OAuth;

use PDO;

/**
 * Thin PDO wrapper around all OAuth tables.
 *
 * Used by both the OAuth feature controller (for DCR) and by the league
 * repository implementations below.
 */
final class OAuthRepository
{
    public function __construct(private PDO $pdo) {}

    // --- Clients --------------------------------------------------------

    public function createClient(
        string $id,
        string $name,
        ?string $secretHash,
        array $redirectUris,
        array $grantTypes,
        array $scopes,
        bool $isConfidential,
        string $tokenEndpointAuthMethod,
        ?string $clientUri = null,
        ?string $logoUri = null,
    ): array {
        $stmt = $this->pdo->prepare('
            INSERT INTO oauth_clients
                (id, name, secret_hash, redirect_uris, grant_types, scopes, is_confidential, token_endpoint_auth_method, client_uri, logo_uri)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ');
        $stmt->execute([
            $id,
            $name,
            $secretHash,
            json_encode(array_values($redirectUris)),
            json_encode(array_values($grantTypes)),
            json_encode(array_values($scopes)),
            $isConfidential ? 1 : 0,
            $tokenEndpointAuthMethod,
            $clientUri,
            $logoUri,
        ]);

        return $this->findClient($id) ?? [];
    }

    public function findClient(string $id): ?array
    {
        $stmt = $this->pdo->prepare('SELECT * FROM oauth_clients WHERE id = ?');
        $stmt->execute([$id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return $row ? $this->hydrateClient($row) : null;
    }

    private function hydrateClient(array $row): array
    {
        return [
            'id'                         => $row['id'],
            'name'                       => $row['name'],
            'secret_hash'                => $row['secret_hash'],
            'redirect_uris'              => json_decode($row['redirect_uris'], true) ?: [],
            'grant_types'                => json_decode($row['grant_types'], true) ?: [],
            'scopes'                     => json_decode($row['scopes'], true) ?: [],
            'is_confidential'            => (bool) $row['is_confidential'],
            'token_endpoint_auth_method' => $row['token_endpoint_auth_method'],
            'client_uri'                 => $row['client_uri'] ?? null,
            'logo_uri'                   => $row['logo_uri'] ?? null,
            'created_at'                 => $row['created_at'],
        ];
    }

    // --- Scopes ---------------------------------------------------------

    public function findScope(string $identifier): ?array
    {
        $stmt = $this->pdo->prepare('SELECT * FROM oauth_scopes WHERE identifier = ?');
        $stmt->execute([$identifier]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    public function allScopes(): array
    {
        return $this->pdo->query('SELECT * FROM oauth_scopes')->fetchAll(PDO::FETCH_ASSOC) ?: [];
    }

    // --- Auth codes -----------------------------------------------------

    public function persistAuthCode(
        string $id,
        string $clientId,
        ?string $userId,
        ?string $redirectUri,
        array $scopes,
        ?string $resource,
        string $expiresAt,
    ): void {
        $stmt = $this->pdo->prepare('
            INSERT INTO oauth_auth_codes
                (id, client_id, user_id, redirect_uri, scopes, resource, expires_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ');
        $stmt->execute([
            $id, $clientId, $userId, $redirectUri,
            json_encode(array_values($scopes)),
            $resource, $expiresAt,
        ]);
    }

    public function revokeAuthCode(string $id): void
    {
        $stmt = $this->pdo->prepare('UPDATE oauth_auth_codes SET revoked = 1 WHERE id = ?');
        $stmt->execute([$id]);
    }

    public function isAuthCodeRevoked(string $id): bool
    {
        $stmt = $this->pdo->prepare('SELECT revoked FROM oauth_auth_codes WHERE id = ?');
        $stmt->execute([$id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row === false ? true : (bool) $row['revoked'];
    }

    // --- Access tokens --------------------------------------------------

    public function persistAccessToken(
        string $id,
        string $clientId,
        ?string $userId,
        array $scopes,
        ?string $resource,
        string $expiresAt,
    ): void {
        $stmt = $this->pdo->prepare('
            INSERT INTO oauth_access_tokens
                (id, client_id, user_id, scopes, resource, expires_at)
            VALUES (?, ?, ?, ?, ?, ?)
        ');
        $stmt->execute([
            $id, $clientId, $userId,
            json_encode(array_values($scopes)),
            $resource, $expiresAt,
        ]);
    }

    public function revokeAccessToken(string $id): void
    {
        $stmt = $this->pdo->prepare('UPDATE oauth_access_tokens SET revoked = 1 WHERE id = ?');
        $stmt->execute([$id]);
    }

    public function isAccessTokenRevoked(string $id): bool
    {
        $stmt = $this->pdo->prepare('SELECT revoked FROM oauth_access_tokens WHERE id = ?');
        $stmt->execute([$id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row === false ? true : (bool) $row['revoked'];
    }

    // --- Refresh tokens -------------------------------------------------

    public function persistRefreshToken(string $id, string $accessTokenId, string $expiresAt): void
    {
        $stmt = $this->pdo->prepare('
            INSERT INTO oauth_refresh_tokens (id, access_token_id, expires_at)
            VALUES (?, ?, ?)
        ');
        $stmt->execute([$id, $accessTokenId, $expiresAt]);
    }

    public function revokeRefreshToken(string $id): void
    {
        $stmt = $this->pdo->prepare('UPDATE oauth_refresh_tokens SET revoked = 1 WHERE id = ?');
        $stmt->execute([$id]);
    }

    public function isRefreshTokenRevoked(string $id): bool
    {
        $stmt = $this->pdo->prepare('SELECT revoked FROM oauth_refresh_tokens WHERE id = ?');
        $stmt->execute([$id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row === false ? true : (bool) $row['revoked'];
    }
}
