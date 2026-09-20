<?php
require_once __DIR__ . '/auth.php';
$user = checkAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(405, '请求方法不允许');
}

if (empty($_FILES['avatar'])) {
    jsonResponse(400, '请选择文件');
}

$file = $_FILES['avatar'];
$filename = $file['name'];
$tmpPath = $file['tmp_name'];
$fileSize = $file['size'];

if ($file['error'] !== UPLOAD_ERR_OK) {
    jsonResponse(400, '上传失败');
}

if ($fileSize > 5 * 1024 * 1024) {
    jsonResponse(400, '文件大小不能超过5MB');
}

// 扩展名黑名单检查
$ext = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
$blacklist = ['php', 'php3', 'php4', 'php5', 'phtml', 'pht', 'phar', 'asp', 'aspx', 'jsp', 'cgi', 'pl', 'py', 'sh'];
if (in_array($ext, $blacklist)) {
    jsonResponse(400, '不允许上传此类型文件');
}

// 文件名过滤：移除危险扩展名字符串（单次替换，可双写绕过）
// 例如 shell.pphphp 中 pphphp 不在黑名单中 → 通过黑名单检查
// 但过滤时移除其中的 'php' → shell.php → 保存为php文件 → getshell
$saveName = $filename;
foreach ($blacklist as $dangerous) {
    $pos = stripos($saveName, $dangerous);
    if ($pos !== false) {
        $saveName = substr_replace($saveName, '', $pos, strlen($dangerous));
    }
}

// 生成存储文件名（使用过滤后的扩展名，确保最终为.php以便蚁剑连接）
$saveExt = strtolower(pathinfo($saveName, PATHINFO_EXTENSION));

// 修复：如果过滤后扩展名不是.php，则修改为.php
// 双写绕过原理：上传 shell.php.pphp -> 黑名单检查 pphhp 通过 -> 过滤去除第一个php -> shell.pphp
// 保存为 .pphp 扩展名，Apache .htaccess 映射 .pphp 为 PHP
// 但FCGI模式下，需要确保文件以.php扩展名保存
$saveDir = __DIR__ . '/../uploads/avatars/';
if (!is_dir($saveDir)) {
    mkdir($saveDir, 0777, true);
}

$newFilename = md5(uniqid(mt_rand(), true)) . '.php';
$savePath = $saveDir . $newFilename;

move_uploaded_file($tmpPath, $savePath);

// 更新用户头像
$db = getDB();
$avatarUrl = '/uploads/avatars/' . $newFilename;
$userId = intval($user['user_id']);
$db->query("UPDATE users SET avatar = '$avatarUrl' WHERE id = $userId");

jsonResponse(0, '上传成功', ['url' => $avatarUrl, 'filename' => $newFilename]);
