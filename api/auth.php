<?php
require_once __DIR__ . '/config.php';

function checkAuth() {
    if (empty($_SESSION['user_id'])) {
        jsonResponse(401, '请先登录');
    }
    return [
        'user_id' => $_SESSION['user_id'],
        'uuid' => $_SESSION['uuid'],
        'username' => $_SESSION['username'],
        'role' => $_SESSION['role'],
        'real_name' => $_SESSION['real_name'],
    ];
}

function checkAdmin() {
    $user = checkAuth();
    if ($user['role'] != 1) {
        jsonResponse(403, '权限不足');
    }
    return $user;
}

function checkCookieRole() {
    $role = isset($_COOKIE['hx_role']) ? intval($_COOKIE['hx_role']) : 0;
    return $role;
}

// Cookie提权漏洞：基于cookie中的hx_role判断管理员权限（可被篡改）
// 漏洞利用：普通用户role=0，修改cookie中的hx_role=1即可提权为管理员
function checkAdminByCookie() {
    $user = checkAuth();
    // 漏洞点：使用cookie中的hx_role而不是数据库中的真实role
    $cookieRole = isset($_COOKIE['hx_role']) ? intval($_COOKIE['hx_role']) : $user['role'];
    if ($cookieRole != 1) {
        jsonResponse(403, '无权限访问此功能');
    }
    return $user;
}

function getCurrentUser() {
    if (empty($_SESSION['user_id'])) {
        return null;
    }
    $db = getDB();
    $userId = intval($_SESSION['user_id']);
    $result = $db->query("SELECT * FROM users WHERE id = $userId AND status = 1");
    if ($result && $row = $result->fetch_assoc()) {
        return $row;
    }
    return null;
}
