<?php
/**
 * 资源代理接口 - 包含两个高危漏洞
 *
 * 漏洞1: 任意文件读取 (path参数)
 *   fileview.php 功能被合并到此接口
 *   正常: proxy.php?path=/uploads/docs/report.pdf
 *   漏洞: proxy.php?path=/etc/passwd 或 proxy.php?path=/api/config.php
 *
 * 漏洞2: SSRF服务端请求伪造 (url参数)
 *   正常: proxy.php?url=https://example.com/image.png
 *   漏洞: proxy.php?url=http://127.0.0.1:3306 探测内网服务
 */

header('Content-Type: text/html; charset=utf-8');

require_once __DIR__ . '/config.php';

$action = isset($_GET['action']) ? trim($_GET['action']) : '';

// ============ 任意文件读取 (path参数) ============
if ($action === 'file' || isset($_GET['path'])) {
    $path = isset($_GET['path']) ? trim($_GET['path']) : '';

    if (empty($path)) {
        http_response_code(400);
        echo json_encode(['code' => 400, 'msg' => '缺少path参数']);
        exit;
    }

    // 漏洞点：未限制path的范围，允许绝对路径和目录遍历
    // 正常应该限制在 /var/www/html/uploads/ 下

    // 方法1: 拼接基础路径
    $basePath = '/var/www/html';
    $fullPath = $basePath . $path;
    $fullPath = preg_replace('#/+#', '/', $fullPath);

    $content = @file_get_contents($fullPath);

    // 方法2: 相对路径
    if ($content === false || $content === '') {
        $relPath = __DIR__ . '/../' . ltrim($path, '/');
        $relPath = preg_replace('#/+#', '/', $relPath);
        $content = @file_get_contents($relPath);
    }

    // 方法3: 直接作为绝对路径
    if ($content === false || $content === '') {
        $content = @file_get_contents($path);
    }

    if ($content === false || $content === '') {
        http_response_code(404);
        echo json_encode(['code' => 404, 'msg' => '文件不存在: ' . $path]);
        exit;
    }

    // 返回文件内容
    header('X-File-Path: ' . $path);
    header('Content-Type: text/plain; charset=utf-8');
    echo $content;
    exit;
}

// ============ SSRF (url参数) ============
if ($action === 'proxy' || isset($_GET['url'])) {
    $url = isset($_GET['url']) ? trim($_GET['url']) : '';

    if (empty($url)) {
        http_response_code(400);
        echo json_encode(['code' => 400, 'msg' => '缺少url参数']);
        exit;
    }

    // 漏洞点：允许http/https/file/gopher协议，未限制内网地址和端口
    $allowedProtocols = ['http://', 'https://', 'file://', 'gopher://', 'dict://'];
    $isValid = false;
    foreach ($allowedProtocols as $proto) {
        if (stripos($url, $proto) === 0) {
            $isValid = true;
            break;
        }
    }

    if (!$isValid) {
        http_response_code(400);
        echo json_encode(['code' => 400, 'msg' => '无效的URL协议']);
        exit;
    }

    // file协议：本地文件读取
    if (stripos($url, 'file://') === 0) {
        $filePath = substr($url, 7);
        $filePath = '/' . ltrim($filePath, '/');
        $content = @file_get_contents($filePath);

        if ($content === false || $content === '') {
            http_response_code(404);
            echo json_encode(['code' => 404, 'msg' => '文件不存在']);
            exit;
        }

        header('Content-Type: text/plain; charset=utf-8');
        header('X-Proxy-Target: ' . $url);
        echo $content;
        exit;
    }

    // gopher协议：可用于攻击内网服务（如MySQL）
    if (stripos($url, 'gopher://') === 0) {
        header('X-Proxy-Target: ' . $url);
        header('Content-Type: text/plain; charset=utf-8');
        echo "[Gopher request sent]\nTarget: {$url}\n[Note: Use Burp Collaborator to verify OOB interaction]";
        exit;
    }

    // http/https：使用cURL代理
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);

    // 允许重定向
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_MAXREDIRS, 3);

    // 发送请求头，伪装成浏览器
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
    $error = curl_error($ch);
    curl_close($ch);

    // 输出调试信息（便于测试者判断端口开放状态）
    $debugInfo = [
        'target_url' => $url,
        'http_code' => $httpCode,
        'content_type' => $contentType ?: 'unknown',
        'error' => $error ?: 'none',
        'response_length' => strlen($response),
    ];

    header('X-Proxy-Target: ' . $url);
    header('X-Proxy-Debug: ' . base64_encode(json_encode($debugInfo)));
    header('Content-Type: ' . ($contentType ?: 'application/octet-stream'));
    echo $response;
    exit;
}

// 默认返回帮助信息
echo json_encode([
    'code' => 400,
    'msg' => '参数错误',
    'help' => [
        'file read' => '/api/proxy.php?action=file&path=/api/config.php',
        'ssrf' => '/api/proxy.php?action=proxy&url=http://127.0.0.1:3306',
        'file://' => '/api/proxy.php?action=proxy&url=file:///etc/passwd',
        'gopher://' => '/api/proxy.php?action=proxy&url=gopher://127.0.0.1:6379/_*1%0d%0a$8%0d%0aFLUSHALL%0d%0a',
    ]
]);
