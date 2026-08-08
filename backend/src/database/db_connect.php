<?php

declare(strict_types=1);

/**
 * File: db_connect.php
 * Description: Provides the database connection instance for the application.
 * Connects to MySQL using PDO and the credentials defined in config.php.
 */
require_once __DIR__ . '/../../config.php';

/**
 * Section: Get Database Connection
 * Instantiates and returns a PDO object for database queries.
 */
function getDatabaseConnection(): PDO
{
    $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=' . DB_CHARSET;

    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];

    return new PDO($dsn, DB_USER, DB_PASS, $options);
}
