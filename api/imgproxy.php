<?php
// SSRF漏洞：外部图片资源代理接口
// 正常业务：前端通过此接口加载外部图片资源
// 漏洞利用：url参数可访问内网服务（如探测内网MySQL、Redis等服务）
//   正常调用：imgproxy.php?url=https://example.com/avatar.png
//   漏洞利用：imgproxy.php?url=http://127.0.0.1:3306 或 imgproxy.php?url=http://192.168.1.100:80

header('Content-Type: text/html; charset=utf-8');

$url = isset($_GET['url']) ? trim($_GET['url']) : '';

if (empty($url)) {
    // 没有url参数时返回默认头像
    header('Content-Type: image/png');
    @readfile(__DIR__ . '/../assets/default_avatar.png');
    exit;
}

// 漏洞点：允许http/https/file协议，未限制访问内网地址
// 正常应该限制只能访问外部图片URL，禁止访问内网IP和敏感端口
$allowedProtocols = ['http://', 'https://', 'file://'];
$isValid = false;
foreach ($allowedProtocols as $proto) {
    if (stripos($url, $proto) === 0) {
        $isValid = true;
        break;
    }
}

if (!$isValid) {
    http_response_code(400);
    echo '无效的URL协议';
    exit;
}

// file协议：使用file_get_contents读取本地文件
if (stripos($url, 'file://') === 0) {
    $filePath = substr($url, 7);
    $filePath = '/' . ltrim($filePath, '/');

    $content = @file_get_contents($filePath);
    if ($content === false || $content === '') {
        http_response_code(404);
        echo '文件不存在: ' . htmlspecialchars($filePath);
        exit;
    }

    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime = $finfo->buffer($content);
    header('Content-Type: ' . ($mime ?: 'application/octet-stream'));
    header('X-Proxy-Target: ' . $url);
    echo $content;
    exit;
}

// http/https：使用cURL代理请求（SSRF核心漏洞点）
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 8);
curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5);
// 漏洞：允许访问任意协议和端口，可以探测内网服务
curl_setopt($ch, CURLOPT_PROTOCOLS, CURLPROTO_HTTP | CURLPROTO_HTTPS);
curl_setopt($ch, CURLOPT_REDIR_PROTOCOLS, CURLPROTO_HTTP | CURLPROTO_HTTPS);
// 允许所有SSL证书（便于测试）
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
$error = curl_error($ch);
curl_close($ch);

if ($error) {
    http_response_code(500);
    echo '代理请求失败: ' . htmlspecialchars($error);
    exit;
}

if ($response === false) {
    http_response_code(404);
    echo '资源未找到';
    exit;
}

// 返回代理响应
if ($contentType) {
    header('Content-Type: ' . $contentType);
} else {
    header('Content-Type: application/octet-stream');
}
header('X-Proxy-Target: ' . $url);
header('X-HTTP-Code: ' . $httpCode);
echo $response;
exit;