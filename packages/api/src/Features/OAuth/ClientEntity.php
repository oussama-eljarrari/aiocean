<?php

declare(strict_types=1);

namespace App\Features\OAuth;

use League\OAuth2\Server\Entities\ClientEntityInterface;
use League\OAuth2\Server\Entities\Traits\ClientTrait;
use League\OAuth2\Server\Entities\Traits\EntityTrait;

final class ClientEntity implements ClientEntityInterface
{
    use ClientTrait;
    use EntityTrait;

    public function setName(string $name): void
    {
        $this->name = $name;
    }

    /**
     * @param string|string[] $uri
     */
    public function setRedirectUri(string|array $uri): void
    {
        $this->redirectUri = $uri;
    }

    public function setIsConfidential(bool $confidential): void
    {
        $this->isConfidential = $confidential;
    }
}
