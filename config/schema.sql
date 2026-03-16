-- Minimal schema for I-PIPES (MySQL)
-- Adjust types/constraints to match your final model.

CREATE TABLE IF NOT EXISTS Users (
  userID INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(64) NOT NULL UNIQUE,
  password CHAR(32) NOT NULL,
  role ENUM('admin','analyst','researcher') NOT NULL DEFAULT 'researcher',
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Policies (
  policyID INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(128) NOT NULL,
  year INT NOT NULL,
  agency VARCHAR(255) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'Active',
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

