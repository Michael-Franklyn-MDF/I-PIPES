<?php
// Bulk refactor script to convert UI to dynamic PHP and secure endpoints

$folders = ['admin', 'policyAnalyst', 'researcher'];
$sessionCheck = "<?php\nsession_start();\nif (!isset(\$_SESSION['role'])) { header('Location: ../login/index.html'); exit; }\n?>\n";

foreach ($folders as $folder) {
    if (!is_dir(__DIR__ . "/../$folder")) continue;
    
    $files = glob(__DIR__ . "/../$folder/*.html");
    foreach ($files as $file) {
        $content = file_get_contents($file);
        
        // 1. Rename links from .html to .php within the file
        $content = str_replace('.html', '.php', $content);
        // Fix login link to stay as index.html
        $content = str_replace('../login/index.php', '../login/index.html', $content);
        
        // 2. Add IDs for JS dynamic loading if they are missing
        if (strpos($file, 'dashboard') !== false) {
             // Dashboard tables
             $content = str_replace('<tbody>', '<tbody id="recent-tbody">', $content); // might need exact tuning, but script.js looks for 'tbody' directly in dashboard
        }
        if (strpos($file, 'policies') !== false) {
             $content = str_replace('<tbody>', '<tbody id="policies-tbody">', $content);
        }
        if (strpos($file, 'results') !== false || strpos($file, 'history') !== false) {
             $content = str_replace('<tbody>', '<tbody id="results-tbody">', $content);
        }
        if (strpos($file, 'user') !== false && strpos($file, 'user-details') === false) {
             $content = str_replace('<tbody>', '<tbody id="users-tbody">', $content);
        }

        // 3. Prepend session security
        $content = $sessionCheck . $content;
        
        // 4. Save as .php and delete .html
        $newFilename = str_replace('.html', '.php', $file);
        file_put_contents($newFilename, $content);
        unlink($file);
    }
}

// Update login.php redirects
$loginFile = __DIR__ . '/../login/login.php';
$loginContent = file_get_contents($loginFile);
$loginContent = str_replace('.html', '.php', $loginContent);
$loginContent = str_replace('index.php?error', 'index.html?error', $loginContent);
file_put_contents($loginFile, $loginContent);

// Update signup.php redirect
$signupFile = __DIR__ . '/../signup/signup.php';
$signupContent = file_get_contents($signupFile);
$signupContent = str_replace("header('Location: ../login/index.html", "header('Location: ../login/index.html", $signupContent); // unchanged
$signupContent = str_replace("header('Location: index.html", "header('Location: index.html", $signupContent); // unchanged
file_put_contents($signupFile, $signupContent);

echo "Migration complete.";
?>
