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
     * GET /register — render the human-facing registration form.
     */
    public function registerForm(Request $request): Response
    {
        $body = $this->renderRegisterForm(null, null);
        return $this->html(HtmlView::page('Register OAuth client', $body));
    }

    /**
     * POST /register — Dynamic Client Registration.
     *
     * - Content-Type: application/json → RFC 7591 JSON response
     * - Content-Type: application/x-www-form-urlencoded → HTML success page
     *
     * Public clients (token_endpoint_auth_method=none) are the only kind we
     * issue, matching OAuth 2.1 / MCP Inspector best practice. Confidential
     * clients can be added later by extending the form.
     */
    public function register(Request $request): Response
    {
        $isForm = str_contains(
            $request->header('Content-Type') ?? '',
            'application/x-www-form-urlencoded',
        );

        $body = $isForm ? $request->body() : (array) ($request->body() ?? []);

        $redirectUris = $body['redirect_uris'] ?? null;
        if (is_string($redirectUris)) {
            $redirectUris = preg_split('/\s+/', trim($redirectUris), -1, PREG_SPLIT_NO_EMPTY) ?: [];
        }
        if (!is_array($redirectUris) || $redirectUris === []) {
            return $this->registerError('redirect_uris is required (one per line in the form, or an array in JSON)', $isForm);
        }
        foreach ($redirectUris as $uri) {
            if (!is_string($uri) || !filter_var($uri, FILTER_VALIDATE_URL)) {
                return $this->registerError("Invalid redirect_uri: " . HtmlView::e((string) $uri), $isForm);
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

        // Public clients only — PKCE is the protection.
        $authMethod = 'none';
        $isConfidential = false;

        $scopeString = isset($body['scope']) && is_string($body['scope']) && $body['scope'] !== ''
            ? $body['scope']
            : $this->config['default_scope'];
        $scopes = array_values(array_filter(explode(' ', $scopeString)));

        $clientId = bin2hex(random_bytes(16));
        $clientSecret = null;
        $secretHash = null;

        $client = $this->repo->createClient(
            $clientId,
            $clientName,
            $secretHash,
            $redirectUris,
            ['authorization_code', 'refresh_token'],
            $scopes,
            $isConfidential,
            $authMethod,
            $clientUri,
            $logoUri,
        );

        $response = [
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
        ];

        if ($isForm) {
            $html = $this->renderRegisterSuccess($response);
            return $this->html(HtmlView::page('Client registered', $html));
        }

        return $this->json($response, 201);
    }

    private function registerError(string $message, bool $isForm): Response
    {
        if ($isForm) {
            $html = $this->renderRegisterForm($message, null);
            return $this->html(HtmlView::page('Register OAuth client', $html), 400);
        }
        return $this->json(['error' => 'invalid_client_metadata', 'error_description' => $message], 400);
    }

    private function renderRegisterForm(?string $error, ?array $prefill): string
    {
        $name = HtmlView::e($prefill['client_name'] ?? '');
        $redirects = HtmlView::e($prefill['redirect_uris_raw'] ?? "http://localhost:6274/oauth/callback\nhttp://localhost:6274/oauth/callback/debug");
        $scope = HtmlView::e($prefill['scope'] ?? $this->config['default_scope']);

        $err = $error
            ? '<div class="alert alert-err">' . HtmlView::e($error) . '</div>'
            : '';

        $availableScopes = array_map(fn ($s) => $s['identifier'], $this->repo->allScopes());
        $scopesList = '';
        foreach ($availableScopes as $s) {
            $scopesList .= '<div class="scope"><div class="scope-name">' . HtmlView::e($s) . '</div><div class="muted">'
                . HtmlView::e(HtmlView::scopeDescription($s)) . '</div></div>';
        }

        return <<<HTML
<h1>Register an OAuth client</h1>
<p class="sub">Create a public client to use with MCP Inspector or another MCP client. PKCE (S256) is required.</p>
{$err}
<form method="POST" action="/register">
  <label for="client_name">Client name</label>
  <input type="text" id="client_name" name="client_name" value="{$name}" placeholder="MCP Inspector" autocomplete="off">

  <label for="redirect_uris">Redirect URIs <span class="muted">(one per line)</span></label>
  <textarea id="redirect_uris" name="redirect_uris" required spellcheck="false">{$redirects}</textarea>

  <label for="scope">Scopes <span class="muted">(space-separated)</span></label>
  <input type="text" id="scope" name="scope" value="{$scope}" spellcheck="false">

  <div class="muted" style="margin-top:14px">Available scopes:</div>
  {$scopesList}

  <div class="actions">
    <button type="submit" class="btn btn-primary">Register client</button>
  </div>
</form>
HTML;
    }

    private function renderRegisterSuccess(array $client): string
    {
        $id = HtmlView::e($client['client_id']);
        $name = HtmlView::e($client['client_name']);
        $scope = HtmlView::e($client['scope']);
        $redirects = implode('', array_map(
            fn ($u) => '<dd><code>' . HtmlView::e($u) . '</code></dd>',
            $client['redirect_uris'],
        ));
        $created = date('Y-m-d H:i:s', $client['client_id_issued_at']);

        return <<<HTML
<h1>Client registered</h1>
<p class="sub">Save these details. The <strong>client_id</strong> is required to start an authorization flow.</p>

<div class="alert alert-warn">
  This is a <strong>public client</strong>. No client secret is issued — PKCE (S256) protects the token exchange.
</div>

<dl class="kv">
  <dt>Client ID</dt>
  <dd><code class="copyable">{$id}</code> <button type="button" class="btn copy" data-copy="{$id}">Copy</button></dd>
  <dt>Client name</dt><dd>{$name}</dd>
  <dt>Scopes</dt><dd>{$scope}</dd>
  <dt>Auth method</dt><dd>none (public client, PKCE required)</dd>
  <dt>Redirect URIs</dt>{$redirects}
  <dt>Created</dt><dd class="muted">{$created}</dd>
</dl>

<div class="actions">
  <a class="btn" href="/register">Register another</a>
  <a class="btn btn-primary" href="/.well-known/oauth-authorization-server">View server metadata</a>
</div>
HTML;
    }

    /**
     * GET /authorize — render the consent screen.
     * POST /authorize — receive the Approve/Deny decision.
     *
     * If the configured auto_approve flag is on, GET issues a code immediately
     * (for curl-based E2E tests); otherwise it renders the consent page.
     */
    public function authorize(Request $request): Response
    {
        $psrRequest = Psr7Bridge::toPsrRequest($request);

        try {
            $authRequest = $this->server->validateAuthorizationRequest($psrRequest);
        } catch (OAuthServerException $e) {
            return $this->respondError($e, $request);
        } catch (\Throwable $e) {
            return $this->respondServerError($e, $request);
        }

        // Default missing/empty scope to the server's default.
        $existingScopes = $authRequest->getScopes();
        if (count($existingScopes) === 0) {
            $authRequest->setScopes(array_map(
                fn ($id) => new ScopeEntity($id),
                array_filter(explode(' ', $this->config['default_scope'])),
            ));
        }

        // Require an authenticated user. Send them to /login with a return URL
        // so the same browser session completes the OAuth flow.
        $user = $this->currentUser($request);
        if (!$user) {
            $next = $request->method() === 'POST'
                ? $request->header('Referer') ?? ('/authorize?' . http_build_query($request->allQuery()))
                : '/authorize?' . http_build_query($request->allQuery());
            $loginUrl = '/login?next=' . urlencode($next);
            return (new Response())
                ->status(302)
                ->header('Location', $loginUrl)
                ->body('');
        }

        if ($request->method() === 'POST') {
            $body = $request->body();
            $decision = (string) ($body['decision'] ?? '');
            $approved = $decision === 'approve';
            $authRequest->setUser(new UserEntity($user->id));
            $authRequest->setAuthorizationApproved($approved);

            try {
                $psrResponse = $this->server->completeAuthorizationRequest($authRequest, Psr7Bridge::emptyPsrResponse());
            } catch (OAuthServerException $e) {
                return $this->respondError($e, $request);
            } catch (\Throwable $e) {
                return $this->respondServerError($e, $request);
            }
            return Psr7Bridge::toAppResponse($psrResponse);
        }

        // GET — auto-approve (for E2E tests) or render the consent form.
        if ($this->config['auto_approve']) {
            $authRequest->setUser(new UserEntity($user->id));
            $authRequest->setAuthorizationApproved(true);
            $psrResponse = $this->server->completeAuthorizationRequest($authRequest, Psr7Bridge::emptyPsrResponse());
            return Psr7Bridge::toAppResponse($psrResponse);
        }

        $html = $this->renderConsent($authRequest, $request, $user);
        return $this->html(HtmlView::page('Authorize ' . ($authRequest->getClient()->getName() ?: $authRequest->getClient()->getIdentifier()), $html));
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
            'description' => HtmlView::scopeDescription($s->getIdentifier()),
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

    private function currentUser(Request $request): ?User
    {
        $userId = $_SESSION['user_id'] ?? null;
        if (!is_string($userId) || $userId === '') {
            return null;
        }
        return $this->users->getById($userId);
    }

    private function renderConsent(AuthorizationRequest $authRequest, Request $request, User $user): string
    {
        $client = $authRequest->getClient();
        $clientId = HtmlView::e($client->getIdentifier());
        $clientName = HtmlView::e($client->getName() ?: 'Unnamed client');
        $redirectUri = HtmlView::e($authRequest->getRedirectUri() ?? '');
        $resource = HtmlView::e((string) ($request->allQuery()['resource'] ?? ''));
        $scopes = $authRequest->getScopes();
        $state = HtmlView::e((string) ($request->allQuery()['state'] ?? ''));

        $userName = HtmlView::e($user->name);
        $userEmail = HtmlView::e($user->email);
        $userRole = HtmlView::e($user->role);

        $isLocal = HtmlView::isLocalhostUri($authRequest->getRedirectUri());
        $localWarn = $isLocal
            ? '<div class="alert alert-warn">The redirect URI points to <strong>localhost</strong>. Only approve if you trust the requesting application.</div>'
            : '';

        $scopeList = '';
        foreach ($scopes as $s) {
            $id = HtmlView::e($s->getIdentifier());
            $desc = HtmlView::e(HtmlView::scopeDescription($s->getIdentifier()));
            $scopeList .= '<div class="scope"><div class="scope-name">' . $id . '</div><div class="muted">' . $desc . '</div></div>';
        }
        if ($scopeList === '') {
            $scopeList = '<div class="muted">No scopes requested.</div>';
        }

        $resourceRow = $resource
            ? '<dt>Resource</dt><dd><code>' . $resource . '</code></dd>'
            : '';

        // Form action carries all original OAuth params in the query string
        // because league reads response_type/client_id from getQueryParams().
        $action = '/authorize?' . http_build_query(array_filter(
            $request->allQuery(),
            fn ($k) => in_array($k, ['response_type', 'client_id', 'redirect_uri', 'code_challenge', 'code_challenge_method', 'scope', 'state', 'resource'], true),
            ARRAY_FILTER_USE_KEY,
        ));

        $authed = '<div class="alert alert-ok" style="display:flex;align-items:center;gap:10px;justify-content:space-between">'
            . '<div>Signed in as <strong>' . $userName . '</strong> <span class="muted">&lt;' . $userEmail . '&gt;</span>'
            . ($userRole !== 'user' ? ' <span class="muted">(' . $userRole . ')</span>' : '')
            . '</div>'
            . '<a class="btn" href="/logout?next=' . urlencode($action) . '" style="flex:0 0 auto">Sign out</a>'
            . '</div>';

        return <<<HTML
<h1>Authorize {$clientName}</h1>
{$authed}
<p class="sub">This application is requesting permission to act on your behalf.</p>

{$localWarn}

<dl class="kv">
  <dt>Client</dt><dd>{$clientName} <span class="muted">({$clientId})</span></dd>
  <dt>Redirect to</dt><dd><code>{$redirectUri}</code></dd>
  {$resourceRow}
</dl>

<div><strong>This will allow {$clientName} to:</strong></div>
{$scopeList}

<form method="POST" action="{$action}">
  <input type="hidden" name="state" value="{$state}">
  <div class="actions">
    <button type="submit" name="decision" value="deny" class="btn btn-danger">Deny</button>
    <button type="submit" name="decision" value="approve" class="btn btn-primary">Approve</button>
  </div>
</form>
HTML;
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

    private function respondError(OAuthServerException $e, Request $request): Response
    {
        if ($this->wantsHtml($request)) {
            $payload = $e->generateHttpResponse(Psr7Bridge::emptyPsrResponse());
            $error = $e->getErrorType();
            $description = $e->getHint() !== '' ? $e->getHint() : $e->getMessage();
            $status = $payload->getStatusCode();
            $body = '<h1>Authorization error</h1>'
                . '<div class="alert alert-err"><strong>' . HtmlView::e($error) . '</strong><br>' . HtmlView::e($description) . '</div>'
                . '<a class="btn" href="/register">Back to client registration</a>';
            return $this->html(HtmlView::page('OAuth error', $body), $status);
        }
        return Psr7Bridge::toAppResponse($e->generateHttpResponse(Psr7Bridge::emptyPsrResponse()));
    }

    private function respondServerError(\Throwable $e, Request $request): Response
    {
        if ($this->wantsHtml($request)) {
            $body = '<h1>Server error</h1>'
                . '<div class="alert alert-err">' . HtmlView::e($e->getMessage()) . '</div>';
            return $this->html(HtmlView::page('OAuth error', $body), 500);
        }
        return $this->json(['error' => 'server_error', 'error_description' => $e->getMessage()], 500);
    }

    private function wantsHtml(Request $request): bool
    {
        $accept = strtolower($request->header('Accept') ?? '');
        return $accept !== '' && str_contains($accept, 'text/html') && !str_starts_with($accept, 'application/json');
    }
}
