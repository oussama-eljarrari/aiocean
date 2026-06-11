<?php

declare(strict_types=1);

namespace App\Features\OAuth;

use App\Core\Request as AppRequest;
use App\Core\Response as AppResponse;
use GuzzleHttp\Psr7\HttpFactory;
use GuzzleHttp\Psr7\ServerRequest;
use GuzzleHttp\Psr7\Utils;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

/**
 * Convert between our framework's Request/Response and PSR-7 messages,
 * because league/oauth2-server requires PSR-7 throughout.
 */
final class Psr7Bridge
{
    public static function toPsrRequest(AppRequest $request): ServerRequestInterface
    {
        $method = $request->method();
        $uri = ($_SERVER['REQUEST_SCHEME'] ?? 'http') . '://'
             . ($_SERVER['HTTP_HOST'] ?? 'localhost')
             . ($_SERVER['REQUEST_URI'] ?? '/');

        $headers = [];
        foreach ($_SERVER as $key => $value) {
            if (str_starts_with($key, 'HTTP_')) {
                $name = str_replace('_', '-', substr($key, 5));
                $headers[$name] = $value;
            }
        }
        if (isset($_SERVER['CONTENT_TYPE'])) {
            $headers['Content-Type'] = $_SERVER['CONTENT_TYPE'];
        }
        if (isset($_SERVER['CONTENT_LENGTH'])) {
            $headers['Content-Length'] = $_SERVER['CONTENT_LENGTH'];
        }

        $body = file_get_contents('php://input') ?: '';

        $psr = new ServerRequest(
            $method,
            $uri,
            $headers,
            $body,
            '1.1',
            $_SERVER,
        );

        $parsedBody = $request->body();
        if (!empty($parsedBody)) {
            $psr = $psr->withParsedBody($parsedBody);
        } else {
            $contentType = $headers['Content-Type'] ?? '';
            if (str_contains($contentType, 'application/x-www-form-urlencoded') && $body !== '') {
                parse_str($body, $parsed);
                $psr = $psr->withParsedBody($parsed);
            }
        }

        return $psr->withQueryParams($request->allQuery());
    }

    public static function emptyPsrResponse(): ResponseInterface
    {
        return (new HttpFactory())->createResponse();
    }

    public static function toAppResponse(ResponseInterface $psr): AppResponse
    {
        $response = (new AppResponse())
            ->status($psr->getStatusCode())
            ->body((string) $psr->getBody());

        foreach ($psr->getHeaders() as $name => $values) {
            $response->header($name, implode(', ', $values));
        }

        return $response;
    }
}
