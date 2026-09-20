<?php
/**
 * 角色检查接口 - 用于前端同步Cookie提权状态
 * 漏洞点：基于cookie中的hx_role返回角色，可被篡改
 */
require_once __DIR__ . '/auth.php';
$user = checkAuth();
$cookieRole = isset($_COOKIE['hx_role']) ? intval($_COOKIE['hx_role']) : intval($user['role']);
jsonResponse(0, 'success', ['role' => $cookieRole]);
