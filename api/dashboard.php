<?php
require_once __DIR__ . '/auth.php';
$user = checkAuth();
$db = getDB();

// 获取统计数据
$stats = [];

$r = $db->query("SELECT COUNT(*) as cnt FROM users WHERE status = 1");
$stats['user_count'] = $r ? intval($r->fetch_assoc()['cnt']) : 0;

$r = $db->query("SELECT COUNT(*) as cnt FROM projects");
$stats['project_count'] = $r ? intval($r->fetch_assoc()['cnt']) : 0;

$r = $db->query("SELECT COUNT(*) as cnt FROM announcements");
$stats['notice_count'] = $r ? intval($r->fetch_assoc()['cnt']) : 0;

$r = $db->query("SELECT COUNT(*) as cnt FROM documents");
$stats['doc_count'] = $r ? intval($r->fetch_assoc()['cnt']) : 0;

// 获取进行中项目
$projects = [];
$r = $db->query("SELECT p.name, p.status, p.progress, u.real_name as manager FROM projects p LEFT JOIN users u ON p.manager_id = u.id WHERE p.status = '进行中' ORDER BY p.progress DESC LIMIT 5");
while ($r && $row = $r->fetch_assoc()) {
    $projects[] = $row;
}

// 获取最近公告
$notices = [];
$r = $db->query("SELECT a.id, a.title, a.category, a.published_at, u.real_name as author FROM announcements a LEFT JOIN users u ON a.author_id = u.id ORDER BY a.is_top DESC, a.published_at DESC LIMIT 5");
while ($r && $row = $r->fetch_assoc()) {
    $notices[] = $row;
}

jsonResponse(0, 'success', [
    'stats' => $stats,
    'projects' => $projects,
    'notices' => $notices
]);
