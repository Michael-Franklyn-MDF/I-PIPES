<?php
// Initialize database tables for I-PIPES
require 'db.php';

try {
    echo "Creating Policies table...\n";
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS Policies (
            policyID INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            category VARCHAR(100) NOT NULL,
            year VARCHAR(10) NOT NULL,
            agency VARCHAR(255) NOT NULL,
            indicators INT DEFAULT 0,
            status VARCHAR(50) DEFAULT 'Active',
            createdBy INT,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (createdBy) REFERENCES Users(userID) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");

    echo "Creating Evaluations table...\n";
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS Evaluations (
            runId VARCHAR(50) PRIMARY KEY,
            policyID INT,
            period VARCHAR(50) NOT NULL,
            runType VARCHAR(100) NOT NULL,
            dataset VARCHAR(255) NOT NULL,
            score DECIMAL(5,2) NOT NULL,
            band VARCHAR(50) NOT NULL,
            evaluationDate VARCHAR(50) NOT NULL,
            notes TEXT,
            evaluatedBy INT,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (policyID) REFERENCES Policies(policyID) ON DELETE CASCADE,
            FOREIGN KEY (evaluatedBy) REFERENCES Users(userID) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");

    echo "Tables created successfully.\n";

} catch (PDOException $e) {
    die("Error creating tables: " . $e->getMessage() . "\n");
}
?>
