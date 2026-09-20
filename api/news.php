<?php
require_once __DIR__ . '/auth.php';
$user = checkAuth();
$db = getDB();

$action = isset($_GET['action']) ? $_GET['action'] : 'list';

if ($action === 'list') {
    // SQL注入漏洞：keyword参数直接拼接进SQL语句，未使用参数化查询
    // 测试方法：输入1个单引号报错（3个单引号），2个单引号不报错（转义的2个）
    $keyword = isset($_GET['keyword']) ? $_GET['keyword'] : '';
    $category = isset($_GET['category']) ? $_GET['category'] : '';
    $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
    $pageSize = isset($_GET['pagesize']) ? min(50, max(1, intval($_GET['pagesize']))) : 10;
    $offset = ($page - 1) * $pageSize;

    $where = "1=1";
    if (!empty($keyword)) {
        // SQL注入漏洞：keyword参数直接拼接进SQL语句，未使用参数化查询
        // 注入payload示例（在Burp Suite中使用）：
        // keyword=' UNION SELECT user()--
        // 注意：--后面必须有空格，URL编码为：keyword=%27%20UNION%20SELECT%20user()--%20
        // 测试方法：输入1个单引号报错，2个单引号不报错
        $where .= " AND a.title LIKE '%{$keyword}%'";
    }
    if (!empty($category)) {
        $cat = $db->real_escape_string($category);
        $where .= " AND a.category = '{$cat}'";
    }

    // 查询总数 - 容错处理：即使count报错也继续执行列表查询（方便UNION注入）
    $countSql = "SELECT COUNT(*) as total FROM announcements a WHERE {$where}";
    $countResult = $db->query($countSql);
    $total = 0;
    if ($countResult) {
        $total = intval($countResult->fetch_assoc()['total']);
    }

    // 查询列表 - 添加明确的错误提示
    // SQL注入漏洞：ORDER BY使用列位置而非别名，使UNION注入可正常执行
    // UNION注入payload：keyword=' UNION SELECT 1,user(),3,4,5,6,7--+
    $listSql = "SELECT a.id, a.title, a.category, a.is_top, a.view_count, a.published_at, u.real_name as author_name
                FROM announcements a
                LEFT JOIN users u ON a.author_id = u.id
                WHERE {$where}
                ORDER BY 4 DESC, 6 DESC
                LIMIT {$pageSize} OFFSET {$offset}";
    $listResult = $db->query($listSql);
    $list = [];
    if ($listResult) {
        while ($row = $listResult->fetch_assoc()) {
            $list[] = $row;
        }
    } elseif (!$countResult) {
        // count和list都失败时才返回错误
        jsonResponse(500, 'SQL语法错误: ' . $db->error, ['sql' => $listSql]);
    }

    jsonResponse(0, 'success', [
        'list' => $list,
        'total' => $total,
        'page' => $page,
        'pagesize' => $pageSize
    ]);

} elseif ($action === 'detail') {
    $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
    if ($id <= 0) {
        jsonResponse(400, '参数错误');
    }

    // 更新浏览量
    $db->query("UPDATE announcements SET view_count = view_count + 1 WHERE id = $id");

    $stmt = $db->prepare("SELECT a.*, u.real_name as author_name FROM announcements a LEFT JOIN users u ON a.author_id = u.id WHERE a.id = ?");
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($row = $result->fetch_assoc()) {
        jsonResponse(0, 'success', $row);
    } else {
        jsonResponse(404, '公告不存在');
    }
}
