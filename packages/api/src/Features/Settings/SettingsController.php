<?php

declare(strict_types=1);

namespace App\Features\Settings;

use App\Core\BaseController;
use App\Core\Request;
use App\Core\Response;
use App\Shared\CurrentUser;

final class SettingsController extends BaseController
{
    public function __construct(
        private SettingsRepository $settings,
        private CurrentUser $currentUser,
    ) {}

    public function index(Request $request): Response
    {
        if (!$this->currentUser->isAdmin()) {
            return $this->forbidden();
        }

        return $this->data(['settings' => $this->settings->getAll()]);
    }

    public function update(Request $request): Response
    {
        if (!$this->currentUser->isAdmin()) {
            return $this->forbidden();
        }

        $body = $request->body();
        foreach ($body as $key => $value) {
            $this->settings->set((string) $key, is_bool($value) ? ($value ? 'true' : 'false') : (string) $value);
        }

        return $this->data(['settings' => $this->settings->getAll()]);
    }
}
