<?php
// One-time migration to align Policies schema with admin CRUD.
require __DIR__ . '/db.php';

try {
    $cols = $pdo->query("
        SELECT COLUMN_NAME, COLUMN_TYPE
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'Policies'
    ")->fetchAll(PDO::FETCH_KEY_PAIR);

    if (!$cols) {
        die("Policies table not found. Run setup_db.php first.\n");
    }

    $colNames = array_map('strtolower', array_keys($cols));
    $has = fn($name) => in_array(strtolower($name), $colNames, true);

    // Rename `name` -> `policyName`
    if (!$has('policyName') && $has('name')) {
        $pdo->exec("ALTER TABLE Policies CHANGE name policyName VARCHAR(255) NOT NULL");
        echo "Renamed column name -> policyName\n";
    }

    // Add missing columns used by the admin CRUD
    if (!$has('description')) {
        $pdo->exec("ALTER TABLE Policies ADD description TEXT NULL AFTER policyName");
        echo "Added column description\n";
    }
    if (!$has('targetArea')) {
        $pdo->exec("ALTER TABLE Policies ADD targetArea VARCHAR(255) NULL AFTER agency");
        echo "Added column targetArea\n";
    }

    // Rename createdAt -> dateCreated
    if (!$has('dateCreated') && $has('createdAt')) {
        $pdo->exec("ALTER TABLE Policies CHANGE createdAt dateCreated TIMESTAMP DEFAULT CURRENT_TIMESTAMP");
        echo "Renamed column createdAt -> dateCreated\n";
    }

    // Normalize status column to enum('active','review','inactive')
    $statusType = $cols['status'] ?? '';
    if ($statusType && stripos($statusType, "enum('active','review','inactive')") === false) {
        $pdo->exec("
            UPDATE Policies
            SET status = CASE
                WHEN status IN ('Under review','Review','review') THEN 'review'
                WHEN status IN ('Inactive','inactive') THEN 'inactive'
                WHEN status IN ('Active','active') THEN 'active'
                ELSE 'active'
            END
        ");
        $pdo->exec("
            ALTER TABLE Policies
            MODIFY status ENUM('active','review','inactive') NOT NULL DEFAULT 'active'
        ");
        echo "Normalized column status to enum('active','review','inactive')\n";
    }

    echo "Migration complete.\n";
} catch (PDOException $e) {
    die("Migration failed: " . $e->getMessage() . "\n");
}
?>
