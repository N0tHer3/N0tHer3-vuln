<?php
require_once __DIR__ . '/config.php';

$_SESSION = [];
setcookie('hx_role', '', time() - 3600, '/');
setcookie('hx_user', '', time() - 3600, '/');
session_destroy();

jsonResponse(0, '已退出登录');
