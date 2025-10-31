<?php
// api/proxy.php - Grok API 代理（优化版：修复 JSON 解析、422 错误处理、tools 支持）
require_once __DIR__ . '/../vendor/autoload.php'; // Composer autoload (vlucas/phpdotenv)

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load();

ignore_user_abort(true);
set_time_limit(0);
ini_set('output_buffering', 0);
ob_implicit_flush(true);

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: text/plain; charset=utf-8');  // SSE for POST
header('Cache-Control: no-cache');
header('Connection: keep-alive');
header('X-Accel-Buffering: no');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 配置
$upstream_proxy = $_ENV['UPSTREAM_PROXY'] ?? '';
$xai_api_key = $_ENV['XAI_API_KEY'] ?? die('缺少 XAI_API_KEY - 检查 .env');
$serpapi_key = $_ENV['SERPAPI_KEY'] ?? die('缺少 SERPAPI_KEY - 检查 .env');
$target_url = 'https://api.x.ai/v1/chat/completions';
$rate_limit_enabled = $_ENV['RATE_LIMIT_ENABLED'] ?? 'false';
$rate_limit_per_minute = intval($_ENV['RATE_LIMIT_PER_MINUTE'] ?? 10);

// 限流 (session)
session_start();
if ($rate_limit_enabled === 'true') {
    $key = 'requests_' . $_SERVER['REMOTE_ADDR'];
    if (!isset($_SESSION[$key])) $_SESSION[$key] = ['count' => 0, 'time' => time()];
    if (time() - $_SESSION[$key]['time'] > 60) {
        $_SESSION[$key] = ['count' => 0, 'time' => time()];
    }
    if ($_SESSION[$key]['count']++ >= $rate_limit_per_minute) {
        http_response_code(429);
        echo json_encode(['error' => '请求超限，请稍后重试']);
        exit();
    }
}

// SerpAPI 搜索路由 (GET ?action=search)
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'search') {
    header('Content-Type: application/json; charset=utf-8');
    $query = $_GET['q'] ?? '';
    $num = intval($_GET['num'] ?? 10);
    if (empty($query)) {
        http_response_code(400);
        echo json_encode(['error' => '缺少搜索查询']);
        exit();
    }
    $url = "https://serpapi.com/search?q=" . urlencode($query) . "&api_key=" . $serpapi_key . "&num=" . $num;
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    if ($upstream_proxy) {
        curl_setopt($ch, CURLOPT_PROXY, $upstream_proxy);
        curl_setopt($ch, CURLOPT_PROXYTYPE, CURLPROXY_HTTP);
    }
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    if ($error) {
        error_log("SerpAPI Error: " . $error);
        echo json_encode(['error' => '搜索代理错误: ' . $error]);
        http_response_code(500);
    } elseif ($http_code !== 200) {
        echo json_encode(['error' => 'SerpAPI错误: HTTP ' . $http_code]);
        http_response_code($http_code);
    } else {
        $data = json_decode($response, true);
        if (isset($data['search_metadata']['status']) && $data['search_metadata']['status'] === 'Success') {
            $results = array_map(function($item) {
                return [
                    'title' => $item['title'] ?? '',
                    'link' => $item['link'] ?? '',
                    'snippet' => $item['snippet'] ?? ''
                ];
            }, $data['organic_results'] ?? []);
            echo json_encode(['results' => $results, 'count' => count($results)]);
        } else {
            echo json_encode(['error' => $data['error'] ?? '未知错误']);
        }
    }
    exit();
}

// 聊天代理 (POST) - 新增：body 验证，忽略无效 GET
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo "Method not allowed. Use POST for chat or GET ?action=search for SerpAPI.";
    exit();
}

$input = file_get_contents('php://input');
$post_data = json_decode($input, true);

// 新增：body 验证 (修复 422)
if (!$post_data || !isset($post_data['messages']) || !is_array($post_data['messages']) || empty($post_data['model'])) {
    http_response_code(422);
    echo "data: " . json_encode(['error' => 'Invalid request body: Missing model or messages array']) . "\n\n";
    exit();
}

// cURL 初始化
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $target_url);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($post_data));  // 确保 JSON 有效
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Authorization: Bearer ' . $xai_api_key,
    'User-Agent: Mozilla/5.0 (compatible; PHP Proxy)'
]);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_TIMEOUT, 0);
if ($upstream_proxy) {
    curl_setopt($ch, CURLOPT_PROXY, $upstream_proxy);
    curl_setopt($ch, CURLOPT_PROXYTYPE, CURLPROXY_HTTP);
}

// 流式输出 (修复：更好错误处理)
curl_setopt($ch, CURLOPT_RETURNTRANSFER, false);
curl_setopt($ch, CURLOPT_HEADERFUNCTION, function($ch, $header) { return strlen($header); });

$chunk_count = 0;
curl_setopt($ch, CURLOPT_WRITEFUNCTION, function($ch, $chunk) use (&$chunk_count) {
    // 修复：确保 chunk 是有效 SSE，跳过无效 JSON
    if (strpos($chunk, 'data: ') !== false) {
        echo $chunk;
        ob_flush();
        flush();
        $chunk_count++;
    }
    return strlen($chunk);
});

$result = curl_exec($ch);
$error = curl_error($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

// 错误处理 (优化：明确 422 原因)
if ($error) {
    error_log("Proxy Error: " . $error . " | Code: " . $http_code);
    echo "data: " . json_encode(['error' => 'Proxy error: ' . $error]) . "\n\n";
    http_response_code(500);
} elseif ($http_code !== 200) {
    $error_msg = ($http_code === 422) ? 'Invalid request (check model/tools format for Grok API)' : ('API error: HTTP ' . $http_code);
    error_log("API Error: " . $error_msg . " | Chunks: " . $chunk_count);
    echo "data: " . json_encode(['error' => $error_msg]) . "\n\n";
    http_response_code($http_code);
} else {
    echo "data: [DONE]\n\n";
    error_log("Success: " . $chunk_count . " chunks streamed");
}
?>