<?php
header('Content-Type: application/json; charset=utf-8');

// 支持Docker环境变量，默认localhost用于本地开发
define('DB_HOST', getenv('MYSQL_HOST') ?: 'localhost');
define('DB_PORT', getenv('MYSQL_PORT') ?: '3306');
define('DB_NAME', getenv('MYSQL_DATABASE') ?: 'tangyuan_oa');
define('DB_USER', getenv('MYSQL_USER') ?: 'root');
define('DB_PASS', getenv('MYSQL_PASSWORD') ?: '');

define('SESSION_PATH', __DIR__ . '/../tmp/sessions');
if (!is_dir(SESSION_PATH)) {
    mkdir(SESSION_PATH, 0777, true);
}
session_save_path(SESSION_PATH);
session_start();

function getDB() {
    static $conn = null;
    if ($conn === null) {
        $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME, intval(DB_PORT));
        if ($conn->connect_errno) {
            die(json_encode(['code' => 500, 'msg' => '服务暂时不可用']));
        }
        $conn->set_charset('utf8mb4');
        $conn->query("SET NAMES utf8mb4");
    }
    return $conn;
}

function jsonResponse($code, $msg, $data = null) {
    $resp = ['code' => $code, 'msg' => $msg];
    if ($data !== null) {
        $resp['data'] = $data;
    }
    echo json_encode($resp, JSON_UNESCAPED_UNICODE);
    exit;
}
