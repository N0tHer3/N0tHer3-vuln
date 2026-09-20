<?php
require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(405, '请求方法不允许');
}

$username = isset($_POST['username']) ? trim($_POST['username']) : '';
$password = isset($_POST['password']) ? trim($_POST['password']) : '';

if (empty($username) || empty($password)) {
    jsonResponse(400, '用户名和密码不能为空');
}

$db = getDB();
$stmt = $db->prepare("SELECT id, uuid, username, role, real_name, password, avatar, status FROM users WHERE username = ? AND status = 1");
$stmt->bind_param('s', $username);
$stmt->execute();
$result = $stmt->get_result();

if ($row = $result->fetch_assoc()) {
    $hashedPassword = md5($password);
    if ($hashedPassword === $row['password']) {
        $_SESSION['user_id'] = $row['id'];
        $_SESSION['uuid'] = $row['uuid'];
        $_SESSION['username'] = $row['username'];
        $_SESSION['role'] = $row['role'];
        $_SESSION['real_name'] = $row['real_name'];

        // 设置cookie角色标识 - 此处仅用cookie存储角色，后端鉴权以cookie为准
        setcookie('hx_role', strval($row['role']), time() + 86400, '/', '', false, false);
        setcookie('hx_user', $row['username'], time() + 86400, '/', '', false, false);

        // 更新最后登录时间
        $db->query("UPDATE users SET last_login = NOW() WHERE id = " . intval($row['id']));

        // 记录登录日志
        $ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
        $uname = $db->real_escape_string($row['username']);
        $db->query("INSERT INTO sys_logs (user_id, username, action, module, ip_address, detail) VALUES ({$row['id']}, '$uname', '登录系统', '认证', '$ip', '用户登录成功')");

        jsonResponse(0, '登录成功', [
            'uuid' => $row['uuid'],
            'username' => $row['username'],
            'role' => $row['role'],
            'real_name' => $row['real_name'],
            'avatar' => $row['avatar']
        ]);
    }
}

jsonResponse(401, '用户名或密码错误');
