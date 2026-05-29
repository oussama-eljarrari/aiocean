<?php

declare(strict_types=1);

namespace App\Core;

use App\Core\Middleware\Pipeline;
use App\Core\Middleware\CorsMiddleware;
use App\Core\Middleware\SessionMiddleware;
use App\Core\Middleware\JsonBodyParser;
use App\Features\Collections\CollectionController;
use App\Features\Collections\CollectionRepository;
use App\Features\Collections\CollectionService;
use App\Features\Agent\AgentController;
use App\Features\Agent\AgentRepository;
use App\Features\Agent\AgentService;
use App\Features\Reports\ReportController;
use App\Features\Reports\ReportRepository;
use App\Features\Reports\ReportService;
use App\Features\Reviews\ReviewController;
use App\Features\Reviews\ReviewRepository;
use App\Features\Reviews\ReviewService;
use App\Features\Submissions\SubmissionController;
use App\Features\Submissions\SubmissionRepository;
use App\Features\Submissions\SubmissionService;
use App\Features\Tools\ToolController;
use App\Features\Tools\ToolRepository;
use App\Features\Tools\ToolService;
use App\Features\Votes\VoteController;
use App\Features\Votes\VoteRepository;
use App\Features\Votes\VoteService;

use App\Features\Users\UserController;
use App\Features\Users\UserRepository;
use App\Features\Users\UserService;
use App\Shared\EmailService;
use App\Shared\CurrentUser;
use PDO;

/**
 * Application kernel.
 */
final class Application
{
    private Pipeline $pipeline;
    private array $config;
    private string $basePath;

    /** @var array<string, object> */
    private array $controllers = [];

    public function __construct(string $basePath)
    {
        $this->basePath = $basePath;
        $this->config   = require $basePath . '/config/app.php';
        $this->pipeline = new Pipeline();

        $this->boot();
        $this->discoverRoutes();

        // Health check
        Router::get('/api/health', fn() => (new Response())->json([
            'data' => [
                'status'    => 'ok',
                'timestamp' => date('c'),
                'php'       => PHP_VERSION,
            ],
        ]));

        $corsOrigin = $this->config['cors_origin'] ?? '*';
        $this->pipeline->pipe(new CorsMiddleware($corsOrigin));
        $this->pipeline->pipe(new SessionMiddleware());
        $this->pipeline->pipe(new JsonBodyParser());
    }

    public function run(): void
    {
        $request = new Request();

        $response = $this->pipeline->run($request, function (Request $req): Response {
            return $this->dispatch($req);
        });

        $response->send();
    }

    /**
     * Wire all dependencies here. One place, explicit.
     */
    private function boot(): void
    {
        $pdo = new PDO(
            $this->config['db']['driver'] . ':' . $this->config['db']['path']
        );
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo->exec('PRAGMA foreign_keys = ON');

        $currentUser = new CurrentUser();

        $toolRepo    = new ToolRepository($pdo);
        $toolService = new ToolService($toolRepo);

        $userRepo    = new UserRepository($pdo);
        $emailService = new EmailService(
            $this->config['email']['api_key'],
            $this->config['email']['from'],
        );
        $userService = new UserService($userRepo, $emailService);

        $reviewRepo = new ReviewRepository($pdo);
        $reviewService = new ReviewService($reviewRepo, $toolRepo);

        $voteRepo = new VoteRepository($pdo);
        $voteService = new VoteService($voteRepo, $toolRepo);

        $reportRepo = new ReportRepository($pdo);
        $reportService = new ReportService($reportRepo, $toolRepo);

        $collectionRepo = new CollectionRepository($pdo);
        $collectionService = new CollectionService($collectionRepo, $toolRepo);

        $submissionRepo = new SubmissionRepository($pdo);
        $submissionService = new SubmissionService(
            $submissionRepo,
            $userRepo,
            $emailService,
            $this->config['agent_webhook_url'] ?? '',
        );

        $this->controllers[ToolController::class] = new ToolController($toolService);
        $this->controllers[UserController::class] = new UserController($userService);
        $this->controllers[ReviewController::class] = new ReviewController($reviewService, $currentUser);
        $this->controllers[VoteController::class] = new VoteController($voteService, $currentUser);
        $this->controllers[ReportController::class] = new ReportController($reportService, $currentUser);
        $this->controllers[CollectionController::class] = new CollectionController($collectionService, $currentUser);
        $agentRepo = new AgentRepository($pdo);
        $agentService = new AgentService($agentRepo);

        $this->controllers[AgentController::class] = new AgentController($agentService, $currentUser);
        $this->controllers[SubmissionController::class] = new SubmissionController($submissionService, $currentUser);
    }

    /**
     * Auto-discover feature route files via glob.
     */
    private function discoverRoutes(): void
    {
        foreach (glob($this->basePath . '/src/Features/*/routes.php') as $file) {
            require $file;
        }
    }

    private function dispatch(Request $request): Response
    {
        $method = $request->method();
        $path   = $request->path();

        $match = Router::resolve($method, $path);

        if ($match === null) {
            if (Router::pathExists($path)) {
                return (new Response())->json(['error' => 'Method not allowed'], 405);
            }
            return (new Response())->json(['error' => 'Not found'], 404);
        }

        $request->setRouteParams($match['params']);
        $handler = $match['handler'];

        if (is_array($handler)) {
            [$controllerClass, $method] = $handler;
            $controller = $this->controllers[$controllerClass]
                ?? throw new \RuntimeException("Controller '$controllerClass' not registered in Application::boot()");
            return $controller->$method($request);
        }

        return $handler($request);
    }
}
