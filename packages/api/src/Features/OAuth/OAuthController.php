<?php

declare(strict_types=1);

namespace App\Features\OAuth;

use App\Core\BaseController;
use App\Core\Request;
use App\Core\Response;
use App\Features\Users\User;
use App\Features\Users\UserService;
use GuzzleHttp\Psr7\ServerRequest;
use League\OAuth2\Server\AuthorizationServer;
use League\OAuth2\Server\Exception\OAuthServerException;
use League\OAuth2\Server\RequestTypes\AuthorizationRequest;

final class OAuthController extends BaseController
{
    /**
     * @param array{
     *   issuer: string,
     *   frontend_url: string,
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
    public function __construct(
        private AuthorizationServer $server,
        private OAuthRepository $repo,
        private UserService $users,
        private array $config,
    ) {}

    /**
     * RFC 8414 — Authorization Server Metadata (always JSON)
     */
    public function metadata(Request $request): Response
    {
        $issuer = rtrim($this->config['issuer'], '/');
        $frontendUrl = rtrim($this->config['frontend_url'], '/');
        $scopes = array_map(fn ($s) => $s['identifier'], $this->repo->allScopes());

        return $this->json([
            'issuer'                                      => $issuer,
            'authorization_endpoint'                      => $frontendUrl . '/authorize',
            'token_endpoint'                              => $issuer . '/token',
            'registration_endpoint'                       => $issuer . '/api/oauth/register',
            'response_types_supported'                    => ['code'],
            'grant_types_supported'                       => ['authorization_code', 'refresh_token'],
            'code_challenge_methods_supported'            => ['S256'],
            'token_endpoint_auth_methods_supported'       => ['none'],
            'scopes_supported'                            => $scopes,
            'service_documentation'                       => $issuer . '/.well-known/oauth-authorization-server',
        ]);
    }

    /**
     * POST /register — Dynamic Client Registration (JSON API).
     */
    public function register(Request $request): Response
    {
        $body = (array) ($request->body() ?? []);

        $redirectUris = $body['redirect_uris'] ?? null;
        if (is_string($redirectUris)) {
            $redirectUris = preg_split('/\s+/', trim($redirectUris), -1, PREG_SPLIT_NO_EMPTY) ?: [];
        }
        if (!is_array($redirectUris) || $redirectUris === []) {
            return $this->json(['error' => 'invalid_client_metadata', 'error_description' => 'redirect_uris is required'], 400);
        }
        foreach ($redirectUris as $uri) {
            if (!is_string($uri) || !filter_var($uri, FILTER_VALIDATE_URL)) {
                return $this->json(['error' => 'invalid_client_metadata', 'error_description' => 'Invalid redirect_uri: ' . $uri], 400);
            }
        }

        $clientName = isset($body['client_name']) && is_string($body['client_name']) && $body['client_name'] !== ''
            ? $body['client_name']
            : 'Unnamed client';

        $clientUri = isset($body['client_uri']) && is_string($body['client_uri']) && $body['client_uri'] !== ''
            ? $body['client_uri']
            : null;

        $logoUri = isset($body['logo_uri']) && is_string($body['logo_uri']) && $body['logo_uri'] !== ''
            ? $body['logo_uri']
            : null;

        $scopeString = isset($body['scope']) && is_string($body['scope']) && $body['scope'] !== ''
            ? $body['scope']
            : $this->config['default_scope'];
        $scopes = array_values(array_filter(explode(' ', $scopeString)));

        $clientId = bin2hex(random_bytes(16));
        $client = $this->repo->createClient(
            $clientId,
            $clientName,
            null,
            $redirectUris,
            ['authorization_code', 'refresh_token'],
            $scopes,
            false,
            'none',
            $clientUri,
            $logoUri,
        );

        return $this->json([
            'client_id'                  => $client['id'],
            'client_id_issued_at'        => (int) (new \DateTimeImmutable($client['created_at']))->format('U'),
            'client_name'                => $client['name'],
            'client_uri'                 => $client['client_uri'],
            'logo_uri'                   => $client['logo_uri'],
            'redirect_uris'              => $client['redirect_uris'],
            'grant_types'                => $client['grant_types'],
            'response_types'             => ['code'],
            'token_endpoint_auth_method' => $client['token_endpoint_auth_method'],
            'scope'                      => implode(' ', $client['scopes']),
        ], 201);
    }

    /**
     * GET /api/oauth/authorize-info
     *
     * JSON API for the React frontend to validate the authorization request
     * and return client info, scopes, and user auth status.
     */
    public function authorizeInfo(Request $request): Response
    {
        $psrRequest = Psr7Bridge::toPsrRequest($request);

        try {
            $authRequest = $this->server->validateAuthorizationRequest($psrRequest);
        } catch (OAuthServerException $e) {
            return $this->json([
                'error'             => $e->getErrorType(),
                'error_description' => $e->getHint() ?: $e->getMessage(),
            ], $e->getHttpStatusCode());
        } catch (\Throwable $e) {
            return $this->serverError($e->getMessage());
        }

        $user = $this->currentUser($request);
        $scopes = array_map(fn ($s) => [
            'identifier'  => $s->getIdentifier(),
            'description' => $this->scopeDescription($s->getIdentifier()),
        ], $authRequest->getScopes());

        $client = $authRequest->getClient();
        $clientRow = $this->repo->findClient($client->getIdentifier());

        return $this->json([
            'client'           => [
                'id'         => $client->getIdentifier(),
                'name'       => $client->getName() ?: $client->getIdentifier(),
                'client_uri' => $clientRow['client_uri'] ?? null,
                'logo_uri'   => $clientRow['logo_uri'] ?? null,
            ],
            'redirect_uri'     => $authRequest->getRedirectUri(),
            'scopes'           => $scopes,
            'state'            => $request->allQuery()['state'] ?? null,
            'resource'         => $request->allQuery()['resource'] ?? null,
            'user'             => $user ? [
                'id'    => $user->id,
                'name'  => $user->name,
                'email' => $user->email,
            ] : null,
            'authenticated'    => $user !== null,
        ]);
    }

    /**
     * POST /api/oauth/consent
     *
     * JSON API for the React frontend to complete (approve/deny) the
     * authorization request. Expects all OAuth params + "decision" in the
     * JSON body.
     */
    public function consent(Request $request): Response
    {
        $user = $this->currentUser($request);
        if (!$user) {
            return $this->unauthorized('You must be signed in to authorize an application.');
        }

        $body = $request->body() ?? [];
        $decision = (string) ($body['decision'] ?? '');
        $approved = $decision === 'approve';

        $oauthParams = array_intersect_key($body, array_flip([
            'response_type', 'client_id', 'redirect_uri',
            'code_challenge', 'code_challenge_method',
            'scope', 'state', 'resource',
        ]));

        $psrRequest = new ServerRequest(
            'GET',
            '/authorize?' . http_build_query($oauthParams),
        );
        $psrRequest = $psrRequest->withQueryParams(array_filter($oauthParams));

        try {
            $authRequest = $this->server->validateAuthorizationRequest($psrRequest);
        } catch (OAuthServerException $e) {
            return $this->json([
                'error'             => $e->getErrorType(),
                'error_description' => $e->getHint() ?: $e->getMessage(),
            ], $e->getHttpStatusCode());
        } catch (\Throwable $e) {
            return $this->serverError($e->getMessage());
        }

        $authRequest->setUser(new UserEntity($user->id));
        $authRequest->setAuthorizationApproved($approved);

        try {
            $psrResponse = $this->server->completeAuthorizationRequest($authRequest, Psr7Bridge::emptyPsrResponse());
        } catch (OAuthServerException $e) {
            return $this->json([
                'error'             => $e->getErrorType(),
                'error_description' => $e->getHint() ?: $e->getMessage(),
            ], $e->getHttpStatusCode());
        } catch (\Throwable $e) {
            return $this->serverError($e->getMessage());
        }

        return $this->json([
            'redirect' => $psrResponse->getHeaderLine('Location'),
        ]);
    }

    /**
     * Token endpoint. Handles authorization_code (with PKCE) and refresh_token.
     * Always JSON.
     */
    public function token(Request $request): Response
    {
        $psrRequest = Psr7Bridge::toPsrRequest($request);

        try {
            $psrResponse = $this->server->respondToAccessTokenRequest($psrRequest, Psr7Bridge::emptyPsrResponse());
            return Psr7Bridge::toAppResponse($psrResponse);
        } catch (OAuthServerException $e) {
            return $this->respondError($e, $request);
        } catch (\Throwable $e) {
            return $this->respondServerError($e, $request);
        }
    }

    private function currentUser(Request $request): ?User
    {
        $userId = $_SESSION['user_id'] ?? null;
        if (!is_string($userId) || $userId === '') {
            return null;
        }
        return $this->users->getById($userId);
    }

    private function scopeDescription(string $scope): string
    {
        return match ($scope) {
            'mcp:user' => 'Search and read AI tools in the directory, list categories, and review submissions.',
            'mcp:admin' => 'Approve, reject, or revert tool submissions on behalf of the directory.',
            default => 'Access the MCP resource server.',
        };
    }

    private function respondError(OAuthServerException $e, Request $request): Response
    {
        return Psr7Bridge::toAppResponse($e->generateHttpResponse(Psr7Bridge::emptyPsrResponse()));
    }

    private function respondServerError(\Throwable $e, Request $request): Response
    {
        return $this->json(['error' => 'server_error', 'error_description' => $e->getMessage()], 500);
    }
}
