-- The `todo` database and user are created by the MySQL image from the MYSQL_* variables.
-- The backend test-suite runs against a separate throw-away database so it can never
-- wipe real data (tests/TestCase.php refuses to run on a database not ending in `_test`).
CREATE DATABASE IF NOT EXISTS todo_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON todo_test.* TO 'todo'@'%';
FLUSH PRIVILEGES;
