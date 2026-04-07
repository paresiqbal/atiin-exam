<?php

namespace App\Support\PhpSpreadsheet;

use InvalidArgumentException;
use Psr\SimpleCache\InvalidArgumentException as PsrInvalidArgumentException;

class FileCacheInvalidArgumentException extends InvalidArgumentException implements PsrInvalidArgumentException
{
}
