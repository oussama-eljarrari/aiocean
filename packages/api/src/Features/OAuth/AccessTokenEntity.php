<?php

declare(strict_types=1);

namespace App\Features\OAuth;

use DateTimeImmutable;
use Lcobucci\JWT\Configuration;
use Lcobucci\JWT\Signer\Key\InMemory;
use Lcobucci\JWT\Signer\Rsa\Sha256;
use League\OAuth2\Server\CryptKeyInterface;
use League\OAuth2\Server\Entities\AccessTokenEntityInterface;
use League\OAuth2\Server\Entities\Traits\EntityTrait;
use League\OAuth2\Server\Entities\Traits\TokenEntityTrait;
use RuntimeException;
use SensitiveParameter;

/**
 * Custom access token: signs an RS256 JWT whose `aud` claim is the
 * MCP resource server URL (RFC 8707) instead of the OAuth client id.
 *
 * Also adds `iss`, `client_id`, and `scope` (space-delimited) claims so the
 * resource server can verify them with stock JWT libraries.
 */
final class AccessTokenEntity implements AccessTokenEntityInterface
{
    use EntityTrait;
    use TokenEntityTrait;

    private CryptKeyInterface $privateKey;
    private string $issuer = '';
    private string $audience = '';

    public function setPrivateKey(
        #[SensitiveParameter]
        CryptKeyInterface $privateKey,
    ): void {
        $this->privateKey = $privateKey;
    }

    public function setIssuer(string $issuer): void
    {
        $this->issuer = $issuer;
    }

    public function setAudience(string $audience): void
    {
        $this->audience = $audience;
    }

    public function toString(): string
    {
        $privateKeyContents = $this->privateKey->getKeyContents();
        if ($privateKeyContents === '') {
            throw new RuntimeException('Private key is empty');
        }

        $jwtConfig = Configuration::forAsymmetricSigner(
            new Sha256(),
            InMemory::plainText($privateKeyContents, $this->privateKey->getPassPhrase() ?? ''),
            InMemory::plainText('empty', 'empty'),
        );

        $scopes = array_map(fn ($s) => $s->getIdentifier(), $this->getScopes());
        $subject = $this->getUserIdentifier() ?? $this->getClient()->getIdentifier();

        $builder = $jwtConfig->builder()
            ->issuedBy($this->issuer)
            ->permittedFor($this->audience)
            ->identifiedBy($this->getIdentifier())
            ->issuedAt(new DateTimeImmutable())
            ->canOnlyBeUsedAfter(new DateTimeImmutable())
            ->expiresAt($this->getExpiryDateTime())
            ->relatedTo($subject)
            ->withClaim('client_id', $this->getClient()->getIdentifier())
            ->withClaim('scope', implode(' ', $scopes))
            ->withClaim('scopes', $scopes);

        return $builder->getToken($jwtConfig->signer(), $jwtConfig->signingKey())->toString();
    }
}
