<?php

declare(strict_types=1);

namespace App\Features\OAuth;

use League\OAuth2\Server\Entities\UserEntityInterface;

final class UserEntity implements UserEntityInterface
{
    public function __construct(private string $id) {}

    public function getIdentifier(): string
    {
        return $this->id;
    }
}
