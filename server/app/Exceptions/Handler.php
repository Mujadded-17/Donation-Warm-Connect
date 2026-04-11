<?php

namespace App\Exceptions;

use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Validation\ValidationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Throwable;

class Handler extends ExceptionHandler
{
    /**
     * A list of the exception types that are not reported.
     *
     * @var array<int, class-string<Throwable>>
     */
    protected $dontReport = [
        //
    ];

    /**
     * A list of the inputs that are never flashed for validation exceptions.
     *
     * @var array<int, string>
     */
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    /**
     * Register the exception handling callbacks for the application.
     *
     * @return void
     */
    public function register()
    {
        $this->reportable(function (Throwable $e) {
            //
        });
    }

    /**
     * Render an exception into an HTTP response.
     *
     * @param \Illuminate\Http\Request $request
     * @param \Throwable $exception
     * @return \Illuminate\Http\JsonResponse|\Symfony\Component\HttpFoundation\Response
     */
    public function render($request, Throwable $exception)
    {
        if ($request->expectsJson()) {
            $status = 500;
            $message = $this->getMessage($exception);

            if ($exception instanceof AuthenticationException) {
                $status = 401;
            } elseif ($exception instanceof ValidationException) {
                $status = 422;
            } elseif ($exception instanceof ModelNotFoundException) {
                $status = 404;
            } elseif ($exception instanceof HttpExceptionInterface) {
                $status = $exception->getStatusCode();
                if (!$message) {
                    $message = $exception->getMessage();
                }
            }

            return response()->json([
                'success' => false,
                'message' => $message ?: 'An unexpected error occurred.',
            ], $status);
        }

        return parent::render($request, $exception);
    }



    /**
     * Get the error message from the exception.
     *
     * @param \Throwable $exception
     * @return string
     */
    protected function getMessage(Throwable $exception): string
    {
        if ($exception instanceof ValidationException) {
            return 'Validation failed.';
        }

        if ($exception instanceof ModelNotFoundException) {
            return 'Resource not found.';
        }

        return $exception->getMessage() ?: 'An unexpected error occurred.';
    }

}
