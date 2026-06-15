<?php

declare(strict_types=1);

namespace App\Shared;

/**
 * Fetches a product's official rating from the Product Hunt GraphQL API.
 *
 * Uses the client-credentials grant (no user login) to read public data.
 * Returns null whenever credentials are missing, the product isn't found,
 * or the network call fails — callers should treat it as "no rating".
 */
final class ProductHuntService
{
    private const TOKEN_URL = 'https://api.producthunt.com/v2/oauth/token';
    private const GRAPHQL_URL = 'https://api.producthunt.com/v2/api/graphql';

    private ?string $token = null;

    public function __construct(
        private string $clientId = '',
        private string $clientSecret = '',
    ) {}

    /**
     * @return array{rating: float, count: int, source: string}|null
     */
    public function fetchRating(string $slug): ?array
    {
        $slug = trim($slug);
        if ($this->clientId === '' || $this->clientSecret === '' || $slug === '') {
            return null;
        }

        $token = $this->getToken();
        if ($token === null) {
            return null;
        }

        $query = 'query($slug: String!) { post(slug: $slug) { name reviewsRating reviewsCount } }';
        $body = json_encode(['query' => $query, 'variables' => ['slug' => $slug]]);

        $raw = $this->httpPost(self::GRAPHQL_URL, $body, [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $token,
        ]);
        if ($raw === null) {
            return null;
        }

        $data = json_decode($raw, true);
        $post = $data['data']['post'] ?? null;
        if (!is_array($post) || !isset($post['reviewsRating'])) {
            return null;
        }

        $rating = (float) $post['reviewsRating'];
        if ($rating <= 0) {
            return null;
        }

        return [
            'rating' => round($rating, 1),
            'count'  => (int) ($post['reviewsCount'] ?? 0),
            'source' => 'Product Hunt',
        ];
    }

    /** Best-effort slug guess from a tool name, e.g. "Notion AI" -> "notion-ai". */
    public function slugFromName(string $name): string
    {
        $slug = strtolower(trim($name));
        $slug = preg_replace('/[^a-z0-9]+/', '-', $slug) ?? '';
        return trim($slug, '-');
    }

    private function getToken(): ?string
    {
        if ($this->token !== null) {
            return $this->token;
        }

        $body = json_encode([
            'client_id'     => $this->clientId,
            'client_secret' => $this->clientSecret,
            'grant_type'    => 'client_credentials',
        ]);

        $raw = $this->httpPost(self::TOKEN_URL, $body, ['Content-Type: application/json']);
        if ($raw === null) {
            return null;
        }

        $data = json_decode($raw, true);
        $this->token = is_array($data) ? ($data['access_token'] ?? null) : null;

        return $this->token;
    }

    /** @param string[] $headers */
    private function httpPost(string $url, string $body, array $headers): ?string
    {
        try {
            $ctx = stream_context_create([
                'http' => [
                    'method'        => 'POST',
                    'header'        => implode("\r\n", $headers),
                    'content'       => $body,
                    'timeout'       => 8,
                    'ignore_errors' => true,
                ],
            ]);
            $raw = @file_get_contents($url, false, $ctx);
            return $raw === false ? null : $raw;
        } catch (\Throwable) {
            return null;
        }
    }
}
