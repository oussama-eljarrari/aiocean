<?php

declare(strict_types=1);

namespace App\Features\OAuth;

use DateInterval;
use League\OAuth2\Server\AuthorizationServer;
use League\OAuth2\Server\Grant\AuthCodeGrant;
use League\OAuth2\Server\Grant\RefreshTokenGrant;

/**
 * Builds a fully-configured league/oauth2-server AuthorizationServer instance.
 */
final class AuthorizationServerFactory
{
    /**
     * @param array{
     *   issuer: string,
     *   resource_server: string,
     *   private_key_path: string,
     *   public_key_path: string,
     *   encryption_key: string,
     *   auth_code_ttl: string,
     *   access_token_ttl: string,
     *   refresh_token_ttl: string,
     *   default_scope: string,
     *   auto_approve: bool,
     * } $config
     */
    public function build(
        ClientRepository $clientRepo,
        AccessTokenRepository $accessTokenRepo,
        ScopeRepository $scopeRepo,
        AuthCodeRepository $authCodeRepo,
        RefreshTokenRepository $refreshTokenRepo,
        array $config,
    ): AuthorizationServer {
        $server = new AuthorizationServer(
            $clientRepo,
            $accessTokenRepo,
            $scopeRepo,
            'file://' . $config['private_key_path'],
            $config['encryption_key'],
        );
        $server->setDefaultScope($config['default_scope']);

        $authCodeGrant = new AuthCodeGrant(
            $authCodeRepo,
            $refreshTokenRepo,
            new DateInterval($config['auth_code_ttl']),
        );
        $authCodeGrant->setRefreshTokenTTL(new DateInterval($config['refresh_token_ttl']));
        $server->enableGrantType($authCodeGrant, new DateInterval($config['access_token_ttl']));

        $refreshGrant = new RefreshTokenGrant($refreshTokenRepo);
        $refreshGrant->setRefreshTokenTTL(new DateInterval($config['refresh_token_ttl']));
        $server->enableGrantType($refreshGrant, new DateInterval($config['access_token_ttl']));

        return $server;
    }
}
