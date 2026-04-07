<?php

namespace App\Support\PhpSpreadsheet;

use DateInterval;
use DateTimeImmutable;
use Psr\SimpleCache\CacheInterface;

class FileCache implements CacheInterface
{
    public function __construct(private readonly string $directory)
    {
        if (! is_dir($this->directory)) {
            mkdir($this->directory, 0755, true);
        }
    }

    public function get(string $key, mixed $default = null): mixed
    {
        $path = $this->pathForKey($key);

        if (! is_file($path)) {
            return $default;
        }

        $payload = @unserialize((string) file_get_contents($path));
        if (! is_array($payload)) {
            @unlink($path);

            return $default;
        }

        if ($this->isExpired($payload['expires_at'] ?? null)) {
            @unlink($path);

            return $default;
        }

        return $payload['value'] ?? $default;
    }

    public function set(string $key, mixed $value, null|int|DateInterval $ttl = null): bool
    {
        $path = $this->pathForKey($key);
        $payload = serialize([
            'expires_at' => $this->normalizeExpiration($ttl),
            'value' => $value,
        ]);

        return file_put_contents($path, $payload, LOCK_EX) !== false;
    }

    public function delete(string $key): bool
    {
        $path = $this->pathForKey($key);

        return ! is_file($path) || @unlink($path);
    }

    public function clear(): bool
    {
        $success = true;

        foreach (glob($this->directory . DIRECTORY_SEPARATOR . '*.cache') ?: [] as $path) {
            if (is_file($path) && ! @unlink($path)) {
                $success = false;
            }
        }

        return $success;
    }

    public function getMultiple(iterable $keys, mixed $default = null): iterable
    {
        $values = [];

        foreach ($keys as $key) {
            $values[$key] = $this->get($key, $default);
        }

        return $values;
    }

    public function setMultiple(iterable $values, null|int|DateInterval $ttl = null): bool
    {
        $success = true;

        foreach ($values as $key => $value) {
            if (! $this->set((string) $key, $value, $ttl)) {
                $success = false;
            }
        }

        return $success;
    }

    public function deleteMultiple(iterable $keys): bool
    {
        $success = true;

        foreach ($keys as $key) {
            if (! $this->delete((string) $key)) {
                $success = false;
            }
        }

        return $success;
    }

    public function has(string $key): bool
    {
        $path = $this->pathForKey($key);

        if (! is_file($path)) {
            return false;
        }

        $payload = @unserialize((string) file_get_contents($path));

        return is_array($payload) && ! $this->isExpired($payload['expires_at'] ?? null);
    }

    private function pathForKey(string $key): string
    {
        $this->assertValidKey($key);

        return $this->directory . DIRECTORY_SEPARATOR . sha1($key) . '.cache';
    }

    private function assertValidKey(string $key): void
    {
        if ($key === '' || preg_match('/[{}\(\)\/\\\\@:]/', $key) === 1) {
            throw new FileCacheInvalidArgumentException("Invalid cache key [{$key}].");
        }
    }

    private function normalizeExpiration(null|int|DateInterval $ttl): ?int
    {
        if ($ttl === null) {
            return null;
        }

        if ($ttl instanceof DateInterval) {
            return (new DateTimeImmutable())->add($ttl)->getTimestamp();
        }

        return $ttl > 0 ? time() + $ttl : time() - 1;
    }

    private function isExpired(mixed $expiresAt): bool
    {
        return is_int($expiresAt) && $expiresAt < time();
    }
}
