<?php
// 任意文件读取漏洞：文档预览接口
// 正常业务：用户预览上传的文档文件
// 漏洞利用：path参数未做路径限制，可通过../遍历读取服务器任意文件
//   正常调用：fileview.php?path=/uploads/docs/report.pdf
//   漏洞利用：fileview.php?path=../../../etc/passwd 或 fileview.php?path=/api/config.php

header('Content-Type: text/html; charset=utf-8');

require_once __DIR__ . '/auth.php';
$user = checkAuth();

$path = isset($_GET['path']) ? trim($_GET['path']) : '';

if (empty($path)) {
    http_response_code(400);
    echo '参数错误：缺少path参数';
    exit;
}

// 漏洞点：没有限制path的范围，可以传入绝对路径或../遍历
// 正常应该限制在上传目录下

$content = false;

// 尝试1：相对于站点根目录
$docRoot = realpath(__DIR__ . '/..');
$fullPath = $docRoot . '/' . ltrim($path, '/');
$content = @file_get_contents($fullPath);

// 尝试2：直接用path作为路径（支持绝对路径，如 /etc/passwd）
if ($content === false || $content === '') {
    $content = @file_get_contents($path);
}

if ($content === false || $content === '') {
    http_response_code(404);
    echo '文件不存在: ' . htmlspecialchars($path);
    exit;
}

// 获取文件MIME类型
$finfo = new finfo(FILEINFO_MIME_TYPE);
$mime = $finfo->buffer($content);
if ($mime) {
    header('Content-Type: ' . $mime);
} else {
    header('Content-Type: application/octet-stream');
}

// 返回文件内容
header('X-File-Path: ' . $path);
echo $content;
exit;
