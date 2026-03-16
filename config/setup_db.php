<?php
// Initialize database tables for I-PIPES
require 'db.php';

try {
    // FIX: Users table must be created BEFORE Policies and Evaluations,
    // because both tables have FOREIGN KEY references to Users(userID).
    echo "Creating Users table...\n";
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS Users (
            userID     INT AUTO_INCREMENT PRIMARY KEY,
            full_name  VARCHAR(255)        NOT NULL,
            email      VARCHAR(255)        NOT NULL UNIQUE,
            username   VARCHAR(100)        NOT NULL UNIQUE,
            password   VARCHAR(255)        NOT NULL,
            role       ENUM('admin','analyst','researcher') NOT NULL DEFAULT 'researcher',
            status     ENUM('active','inactive')           NOT NULL DEFAULT 'active',
            createdAt  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");

    // Seed a default admin account (password = 'admin1234', md5 hashed to match login.php)
    $adminHash = md5('admin1234');
    $pdo->exec("
        INSERT IGNORE INTO Users (full_name, email, username, password, role, status)
        VALUES ('Michael Franklyn', 'michael@example.org', 'michael', '$adminHash', 'admin', 'active');
    ");
    echo "Default admin seeded (username: michael / password: admin1234)\n";

    echo "Creating Policies table...\n";
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS Policies (
            policyID   INT AUTO_INCREMENT PRIMARY KEY,
            name       VARCHAR(255) NOT NULL,
            category   VARCHAR(100) NOT NULL,
            year       VARCHAR(10)  NOT NULL,
            agency     VARCHAR(255) NOT NULL,
            indicators INT          DEFAULT 0,
            status     VARCHAR(50)  DEFAULT 'Active',
            createdBy  INT,
            createdAt  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (createdBy) REFERENCES Users(userID) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");

    echo "Creating Evaluations table...\n";
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS Evaluations (
            runId           VARCHAR(50)    PRIMARY KEY,
            policyID        INT,
            period          VARCHAR(50)    NOT NULL,
            runType         VARCHAR(100)   NOT NULL,
            dataset         VARCHAR(255)   NOT NULL,
            score           DECIMAL(5,2)   NOT NULL,
            band            VARCHAR(50)    NOT NULL,
            evaluationDate  VARCHAR(50)    NOT NULL,
            notes           TEXT,
            evaluatedBy     INT,
            createdAt       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (policyID)    REFERENCES Policies(policyID)  ON DELETE CASCADE,
            FOREIGN KEY (evaluatedBy) REFERENCES Users(userID)        ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");

    echo "All tables created successfully.\n";

}
catch (PDOException $e) {
    die("Error: " . $e->getMessage() . "\n");
}
?>
?>