/**
 * N0tHer3-vuln 内部靶场 - OA协同办公演练系统 v2.4.1
 * 前端核心逻辑
 */
;(function(){
"use strict";

var API_BASE = '/api';

// Test account for development
var DEV_ACCOUNT = {
    username: 'zhangwei',
    password: 'zhang123'
};

function $(sel) { return document.querySelector(sel); }
function $$(sel) { return document.querySelectorAll(sel); }

// 读取cookie（用于Cookie提权漏洞）
// 每次调用都从 document.cookie 实时读取 hx_role
function getCookie(name) {
    var m = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return m ? m[2] : '';
}

// 获取当前角色（从cookie实时读取）
// Cookie提权漏洞：用户修改cookie hx_role=1后，此函数返回1
function getRole() {
    var cr = getCookie('hx_role');
    if (cr !== '') return cr;
    var lr = localStorage.getItem('hx_role');
    return lr || '0';
}

// 更新所有UI为当前角色
function applyRoleUI() {
    var role = getRole();
    // 更新左侧栏角色文字
    var roleEl = $('#sidebar-role');
    if (roleEl && state.user) {
        roleEl.textContent = role === '1' ? '管理员' : '普通员工';
    }
    // 切换管理菜单显示
    if (role === '1') {
        $$('.admin-only').forEach(function(el){ el.style.display = ''; });
    } else {
        $$('.admin-only').forEach(function(el){ el.style.display = 'none'; });
    }
}

// 从服务器同步角色（Cookie提权漏洞：修改cookie后自动生效）
function syncRoleFromServer(callback) {
    api.role().then(function(res){
        if (res.code === 0 && res.data) {
            document.cookie = 'hx_role=' + res.data.role + ';path=/;max-age=86400';
            applyRoleUI();
        }
        if (typeof callback === 'function') callback();
    }).catch(function(){
        if (typeof callback === 'function') callback();
    });
}

// ---------- State ----------
var state = {
    token: localStorage.getItem('hx_token') || '',
    user: JSON.parse(localStorage.getItem('hx_user') || 'null'),
    currentPage: 'dashboard'
};

function saveState() {
    if (state.token) localStorage.setItem('hx_token', state.token);
    if (state.user) {
        localStorage.setItem('hx_user', JSON.stringify(state.user));
        localStorage.setItem('hx_role', getRole());
    }
}

function clearState() {
    state.token = '';
    state.user = null;
    localStorage.removeItem('hx_token');
    localStorage.removeItem('hx_user');
    localStorage.removeItem('hx_role');
}

// ---------- HTTP ----------
function http(method, url, data, isForm) {
    var opts = {
        method: method,
        headers: { 'Accept': 'application/json' },
        credentials: 'same-origin'
    };
    if (data) {
        if (isForm) {
            opts.body = data;
        } else if (method === 'GET') {
            var qs = Object.keys(data).filter(function(k){return data[k]!==undefined&&data[k]!==null;}).map(function(k){return k+'='+encodeURIComponent(data[k]);}).join('&');
            if (qs) url += (url.indexOf('?')>-1?'&':'?') + qs;
        } else {
            opts.headers['Content-Type'] = 'application/x-www-form-urlencoded';
            opts.body = Object.keys(data).map(function(k){return k+'='+encodeURIComponent(data[k]);}).join('&');
        }
    }
    return fetch(url, opts).then(function(r){
        if (r.status === 401) { clearState(); showLogin(); throw new Error('登录已过期'); }
        return r.json();
    });
}

// ---------- API ----------
var api = {
    login: function(d) { return http('POST', API_BASE+'/login.php', d); },
    logout: function() { return http('POST', API_BASE+'/logout.php', {}); },
    dashboard: function() { return http('GET', API_BASE+'/dashboard.php'); },
    userinfo: function(d) { return http('GET', API_BASE+'/userinfo.php', d); },
    updateUserInfo: function(d) { return http('POST', API_BASE+'/userinfo.php', d); },
    search: function(d) { return http('GET', API_BASE+'/search.php', d); },
    news: function(d) { return http('GET', API_BASE+'/news.php', d); },
    contacts: function() { return http('GET', API_BASE+'/contacts.php'); },
    upload: function(fd) { return http('POST', API_BASE+'/upload.php', fd, true); },
    // Cookie提权同步接口
    role: function() { return http('GET', API_BASE+'/role.php'); },
    // 任意文件读取漏洞：fileview.php?path=
    fileview: function(d) { return http('GET', API_BASE+'/fileview.php', d); },
    // SSRF漏洞：imgproxy.php?url=
    imgproxy: function(d) { return http('GET', API_BASE+'/imgproxy.php', d); },
    projectList: function() { return http('GET', API_BASE+'/project.php?action=list'); },
    projectDetail: function(d) { return http('GET', API_BASE+'/project.php?action=detail', d); },
    projectCreate: function(d) { return http('POST', API_BASE+'/project.php?action=create', d); },
    projectApprove: function(d) { return http('POST', API_BASE+'/project.php?action=approve', d); },
    projectAll: function(d) { return http('GET', API_BASE+'/project.php?action=all', d); },
    // 管理后台API - 垂直越权漏洞：普通用户可访问config.php
    adminConfig: function() { return http('GET', API_BASE+'/mgr/config.php'); },
    adminUpdateConfig: function(d) { return http('POST', API_BASE+'/mgr/config.php', d); },
    adminLogs: function(d) { return http('GET', API_BASE+'/mgr/logs.php', d); },
    adminUsers: function() { return http('GET', API_BASE+'/mgr/users.php'); }
};

// Cookie提权辅助函数：在浏览器控制台输入 refreshRole() 即可刷新角色
window.refreshRole = function() {
    applyRoleUI();
    console.log('当前角色:', getRole() === '1' ? '管理员' : '普通用户', '(role=' + getRole() + ')');
    return '角色已刷新，当前: ' + (getRole() === '1' ? '管理员' : '普通用户');
};

// ---------- Page titles ----------
var pageTitles = {
    'dashboard': '工作台',
    'profile': '个人中心',
    'projects': '项目申报',
    'directory': '通讯录',
    'announcements': '通知公告',
    'documents': '文档中心',
    'search': '人员搜索',
    'admin': '系统管理'
};

// ---------- Navigation ----------
function navigate(page) {
    // 每次导航从服务器同步角色（Cookie提权漏洞：修改cookie后切换页面即时生效）
    syncRoleFromServer(function() {
        state.currentPage = page;
        $$('.nav-item').forEach(function(item){
            item.classList.toggle('active', item.dataset.page === page);
        });
        var titleEl = $('#page-title');
        if (titleEl && pageTitles[page]) titleEl.textContent = pageTitles[page];
        loadPage(page);
    });
}

function loadPage(page) {
    var container = $('#page-content');
    if (!container) return;
    switch(page) {
        case 'dashboard': renderDashboard(container); break;
        case 'profile': renderProfile(container); break;
        case 'projects': renderProjects(container); break;
        case 'directory': renderContacts(container); break;
        case 'announcements': renderNews(container); break;
        case 'documents': renderDocs(container); break;
        case 'search': renderSearch(container); break;
        case 'admin': renderAdmin(container); break;
        default: container.innerHTML = '<p>页面不存在</p>';
    }
}

// ---------- Dashboard ----------
function renderDashboard(el) {
    el.innerHTML = '<div class="stats-grid" id="dash-stats"></div><div id="dash-projects" style="margin-top:20px"></div><div id="dash-news" style="margin-top:20px"></div>';
    api.dashboard().then(function(res){
        if (res.code === 0 && res.data) {
            var d = res.data;
            var statsHtml = '';
            var stats = d.stats || {};
            var statLabels = {user_count:'在职员工',project_count:'进行项目',notice_count:'通知公告',doc_count:'文档数量'};
            if (Array.isArray(stats)) {
                stats.forEach(function(s){
                    statsHtml += '<div class="stat-card"><div class="stat-value">'+(s.value||0)+'</div><div class="stat-label">'+(s.label||'')+'</div></div>';
                });
            } else {
                Object.keys(stats).forEach(function(k){
                    statsHtml += '<div class="stat-card"><div class="stat-value">'+stats[k]+'</div><div class="stat-label">'+(statLabels[k]||k)+'</div></div>';
                });
            }
            var statsEl = $('#dash-stats');
            if (statsEl) statsEl.innerHTML = statsHtml;

            var projects = d.projects || [];
            var projHtml = '<h3 style="margin-bottom:10px">进行中项目</h3>';
            projects.forEach(function(p){
                projHtml += '<div style="padding:8px 0;border-bottom:1px solid var(--border)"><strong>'+p.name+'</strong><span style="float:right;color:var(--text-light);font-size:12px">进度 '+p.progress+'%</span></div>';
            });
            if (!projects.length) projHtml += '<p style="color:var(--text-light)">暂无项目</p>';
            var projEl = $('#dash-projects');
            if (projEl) projEl.innerHTML = projHtml;

            var notices = d.notices || d.recentNews || [];
            var newsHtml = '<h3 style="margin-bottom:10px">最新公告</h3>';
            notices.forEach(function(n){
                newsHtml += '<div style="padding:8px 0;border-bottom:1px solid var(--border)"><strong>'+n.title+'</strong><span style="float:right;color:var(--text-light);font-size:12px">'+(n.published_at||n.date||'')+'</span></div>';
            });
            if (!notices.length) newsHtml += '<p style="color:var(--text-light)">暂无公告</p>';
            var newsEl = $('#dash-news');
            if (newsEl) newsEl.innerHTML = newsHtml;
        }
    }).catch(function(){});
}

// ---------- Profile ----------
function renderProfile(el) {
    el.innerHTML = '<div class="profile-section"><div class="profile-avatar"><img id="avatar-preview" src="/img/default-avatar.png" style="width:80px;height:80px;border-radius:50%;object-fit:cover;border:2px solid var(--border)"><div style="margin-top:8px"><label class="btn-upload" style="cursor:pointer;color:var(--primary);font-size:13px">修改头像<input type="file" id="avatar-input" accept="image/*" style="display:none"></label></div></div><form id="profile-form" class="profile-form"><div class="form-row"><label>UUID</label><input type="text" name="uuid" readonly style="background:#f8fafc"></div><div class="form-row"><label>姓名</label><input type="text" name="real_name"></div><div class="form-row"><label>手机号</label><input type="text" name="phone"></div><div class="form-row"><label>身份证号</label><input type="text" name="id_card"></div><div class="form-row"><label>邮箱</label><input type="text" name="email"></div><div class="form-row"><label>部门</label><input type="text" name="department" readonly style="background:#f8fafc"></div><div class="form-row"><label>职位</label><input type="text" name="position" readonly style="background:#f8fafc"></div><div class="form-actions"><button type="submit" class="btn-primary">保存修改</button></div></form></div><style>.profile-section{display:flex;gap:32px;align-items:flex-start}.profile-avatar{text-align:center;min-width:100px}.profile-form{flex:1}.form-row{display:flex;align-items:center;margin-bottom:16px}.form-row label{width:80px;text-align:right;margin-right:12px;color:var(--text-light);font-size:14px}.form-row input{flex:1;padding:8px 12px;border:1px solid var(--border);border-radius:6px;font-size:14px}.form-actions{margin-top:20px;padding-left:92px}.btn-primary{padding:8px 24px;background:var(--primary);color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:14px}.btn-primary:hover{background:var(--primary-dark)}</style>';

    var form = $('#profile-form');
    if (form) form.addEventListener('submit', handleProfileSave);
    var avatarInput = $('#avatar-input');
    if (avatarInput) avatarInput.addEventListener('change', handleAvatarUpload);

    if (state.user) {
        api.userinfo({uuid: state.user.uuid}).then(function(res){
            if (res.code === 0 && res.data) {
                var d = res.data;
                if (form) {
                    form.querySelector('[name="uuid"]').value = d.uuid || '';
                    form.querySelector('[name="real_name"]').value = d.real_name || '';
                    form.querySelector('[name="phone"]').value = d.phone || '';
                    form.querySelector('[name="id_card"]').value = d.id_card || '';
                    form.querySelector('[name="email"]').value = d.email || '';
                    form.querySelector('[name="department"]').value = d.department_name || d.department || '';
                    form.querySelector('[name="position"]').value = d.position || '';
                }
                var avatarEl = $('#avatar-preview');
                if (avatarEl) {
                    var avatarSrc = d.avatar || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%234361ee" width="100" height="100" rx="50"/><text x="50" y="65" text-anchor="middle" fill="white" font-size="40" font-family="sans-serif">' + (d.real_name ? d.real_name.charAt(0) : '?') + '</text></svg>';
                    if (avatarSrc && (avatarSrc.startsWith('http://') || avatarSrc.startsWith('https://'))) {
                        // SSRF漏洞：通过imgproxy.php?url=加载外部图片
                        avatarEl.src = API_BASE + '/imgproxy.php?url=' + encodeURIComponent(avatarSrc);
                    } else {
                        avatarEl.src = avatarSrc;
                    }
                }
            }
        }).catch(function(){});
    }
}

function handleProfileSave(e) {
    e.preventDefault();
    var form = $('#profile-form');
    if (!form) return;
    var data = {
        uuid: form.querySelector('[name="uuid"]').value,
        real_name: form.querySelector('[name="real_name"]').value.trim(),
        phone: form.querySelector('[name="phone"]').value.trim(),
        id_card: form.querySelector('[name="id_card"]').value.trim(),
        email: form.querySelector('[name="email"]').value.trim()
    };
    api.updateUserInfo(data).then(function(res){
        if (res.code === 0) {
            alert('保存成功');
            if (state.user) {
                state.user.real_name = data.real_name;
                saveState();
                updateSidebar();
            }
        } else {
            alert(res.msg || '保存失败');
        }
    }).catch(function(err){ alert('请求失败: '+err.message); });
}

function handleAvatarUpload(e) {
    var file = e.target.files[0];
    if (!file) return;
    var fd = new FormData();
    fd.append('avatar', file);
    api.upload(fd).then(function(res){
        if (res.code === 0 && res.data) {
            var avatarEl = $('#avatar-preview');
            if (avatarEl) avatarEl.src = res.data.url;
            alert('头像上传成功');
        } else {
            alert(res.msg || '上传失败');
        }
    }).catch(function(err){ alert('上传失败: '+err.message); });
}

// ---------- Contacts ----------
function renderContacts(el) {
    el.innerHTML = '<h3 style="margin-bottom:16px">通讯录</h3><div id="contacts-table"></div>';
    api.contacts().then(function(res){
        if (res.code === 0 && res.data) {
            var html = '<table class="data-table"><thead><tr><th>姓名</th><th>部门</th><th>职位</th><th>手机号</th></tr></thead><tbody>';
            res.data.forEach(function(c){
                html += '<tr><td>'+c.real_name+'</td><td>'+c.department+'</td><td>'+c.position+'</td><td>'+c.phone+'</td></tr>';
            });
            html += '</tbody></table>';
            var tel = $('#contacts-table');
            if (tel) tel.innerHTML = html;
        }
    }).catch(function(){});
}

// ---------- News ----------
function renderNews(el) {
    el.innerHTML = '<div style="display:flex;gap:12px;margin-bottom:16px"><input type="text" id="news-keyword" placeholder="搜索公告..." style="flex:1;padding:8px 12px;border:1px solid var(--border);border-radius:6px"><button id="news-search-btn" class="btn-primary" style="padding:8px 16px">搜索</button></div><div id="news-list"></div>';
    var btn = $('#news-search-btn');
    if (btn) btn.addEventListener('click', function(){ loadNewsData(); });
    var kwInput = $('#news-keyword');
    if (kwInput) kwInput.addEventListener('keyup', function(e){ if(e.key==='Enter') loadNewsData(); });
    loadNewsData();
}

function loadNewsData() {
    var keyword = $('#news-keyword') ? $('#news-keyword').value : '';
    api.news({keyword: keyword}).then(function(res){
        if (res.code === 0 && res.data) {
            var list = res.data.list || res.data || [];
            var html = '';
            list.forEach(function(n){
                html += '<div class="news-card" data-id="'+n.id+'" style="background:var(--white);border-radius:8px;padding:16px;margin-bottom:12px;box-shadow:0 1px 3px rgba(0,0,0,.08);cursor:pointer;transition:box-shadow .2s"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px"><h4 style="margin:0">'+n.title+'</h4>'+((n.is_top==='1'||n.is_top===1)?'<span style="background:#f56c6c;color:#fff;padding:2px 8px;border-radius:4px;font-size:11px">置顶</span>':'')+'</div><p style="color:var(--text-light);font-size:12px;margin:0">'+(n.author_name||n.author||'')+' | '+n.published_at+' | 浏览 '+n.view_count+'</p></div>';
            });
            if (!html) html = '<p style="color:var(--text-light)">暂无公告</p>';
            var el = $('#news-list');
            if (el) el.innerHTML = html;
            $$('.news-card').forEach(function(card){
                card.addEventListener('click', function(){
                    showNewsDetail(card.dataset.id);
                });
            });
        }
    }).catch(function(){});
}

function showNewsDetail(id) {
    api.news({action: 'detail', id: id}).then(function(res){
        if (res.code === 0 && res.data) {
            var n = res.data;
            var html = '<div style="background:var(--white);padding:24px;border-radius:8px;box-shadow:var(--shadow)"><h3 style="margin-bottom:12px">'+n.title+'</h3><div style="color:var(--text-light);font-size:13px;margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid var(--border)">'+(n.author_name||'')+' | '+n.published_at+' | 浏览 '+n.view_count+'</div><div style="line-height:1.8;font-size:14px;white-space:pre-wrap">'+(n.content||'暂无内容')+'</div><div style="margin-top:20px"><button id="news-back-btn" style="padding:6px 16px;border:1px solid var(--border);border-radius:6px;background:var(--white);cursor:pointer">返回列表</button></div></div>';
            var container = $('#page-content');
            if (container) container.innerHTML = html;
            var backBtn = $('#news-back-btn');
            if (backBtn) backBtn.addEventListener('click', function(){ navigate('announcements'); });
        } else {
            alert(res.msg || '获取公告详情失败');
        }
    }).catch(function(err){ alert('请求失败: '+err.message); });
}

// ---------- Docs ----------
function renderDocs(el) {
    el.innerHTML = '<h3 style="margin-bottom:16px">文档中心</h3><div id="docs-category" style="display:flex;gap:8px;margin-bottom:16px"><button class="doc-cat-btn active" data-cat="制度文件">制度文件</button><button class="doc-cat-btn" data-cat="技术文档">技术文档</button><button class="doc-cat-btn" data-cat="业务文档">业务文档</button></div><div id="docs-list" style="background:var(--white);padding:20px;border-radius:8px;box-shadow:var(--shadow)"></div><style>.doc-cat-btn{padding:6px 16px;border:1px solid var(--border);border-radius:20px;background:var(--white);cursor:pointer;font-size:13px;transition:all .2s}.doc-cat-btn.active,.doc-cat-btn:hover{background:var(--primary);color:#fff;border-color:var(--primary)}.doc-item{padding:12px 0;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center}.doc-item:last-child{border-bottom:none}.doc-title{font-size:14px;cursor:pointer}.doc-title:hover{color:var(--primary)}.doc-meta{color:var(--text-light);font-size:12px}</style>';
    var docs = [
        {title:'2024年度绩效考核方案',category:'制度文件',date:'2024-12-01',downloads:23,file:'/vuln/uploads/docs/assessment_2024.pdf'},
        {title:'代码规范V3.0',category:'技术文档',date:'2024-11-15',downloads:56,file:'/vuln/uploads/docs/code_standard_v3.pdf'},
        {title:'客户访谈计划Q4',category:'业务文档',date:'2024-10-20',downloads:18,file:'/vuln/uploads/docs/interview_q4.docx'},
        {title:'信息安全管理制度',category:'制度文件',date:'2024-09-10',downloads:42,file:'/vuln/uploads/docs/security_policy.pdf'},
        {title:'API接口设计规范',category:'技术文档',date:'2024-08-25',downloads:35,file:'/vuln/uploads/docs/api_design_spec.pdf'},
        {title:'项目验收流程指引',category:'业务文档',date:'2024-07-18',downloads:29,file:'/uploads/docs/acceptance_guide.docx'},
        {title:'员工手册(2024版)',category:'制度文件',date:'2024-06-01',downloads:87,file:'/uploads/docs/employee_handbook.pdf'},
        {title:'微服务架构设计文档',category:'技术文档',date:'2024-05-12',downloads:31,file:'/uploads/docs/microservice_design.pdf'},
        {title:'市场调研报告Q3',category:'业务文档',date:'2024-04-22',downloads:15,file:'/uploads/docs/market_research_q3.docx'}
    ];
    renderDocsList(docs, '制度文件');
    $$('.doc-cat-btn').forEach(function(btn){
        btn.addEventListener('click', function(){
            $$('.doc-cat-btn').forEach(function(b){ b.classList.remove('active'); });
            btn.classList.add('active');
            renderDocsList(docs, btn.dataset.cat);
        });
    });
}

function renderDocsList(docs, cat) {
    var filtered = docs.filter(function(d){ return d.category === cat; });
    var html = '';
    filtered.forEach(function(d){
        html += '<div class="doc-item"><div class="doc-title" data-file="'+d.file+'">'+d.title+'</div><div class="doc-meta">'+d.date+' | 下载 '+d.downloads+'</div></div>';
    });
    if (!html) html = '<p style="color:var(--text-light)">暂无文档</p>';
    var listEl = $('#docs-list');
    if (listEl) listEl.innerHTML = html;
    $$('.doc-title').forEach(function(title){
        title.addEventListener('click', function(){
            viewDocument(title.dataset.file, title.textContent);
        });
    });
}

function viewDocument(filePath, title) {
    // 漏洞：fileview.php?path= 参数可读取任意文件
    var proxyUrl = API_BASE + '/fileview.php?path=' + encodeURIComponent(filePath);
    var html = '<div style="background:var(--white);padding:24px;border-radius:8px;box-shadow:var(--shadow)"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px"><h3>'+title+'</h3><span style="color:var(--text-light);font-size:12px">'+filePath+'</span></div><div id="doc-preview" style="min-height:200px;border:1px solid var(--border);border-radius:6px;padding:16px;background:#fafafa"><p style="color:var(--text-light)">加载中...</p></div><div style="margin-top:16px"><button id="doc-back-btn" style="padding:6px 16px;border:1px solid var(--border);border-radius:6px;background:var(--white);cursor:pointer">返回列表</button></div></div>';
    var container = $('#page-content');
    if (container) container.innerHTML = html;
    var backBtn = $('#doc-back-btn');
    if (backBtn) backBtn.addEventListener('click', function(){ navigate('documents'); });
    fetch(proxyUrl).then(function(r){ return r.text(); }).then(function(text){
        var preview = $('#doc-preview');
        if (preview) {
            if (text.length > 0) {
                preview.innerHTML = '<pre style="white-space:pre-wrap;word-break:break-all;font-size:13px;max-height:400px;overflow-y:auto">'+text.replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</pre>';
            } else {
                preview.innerHTML = '<p style="color:var(--text-light)">文件为空或无法读取</p>';
            }
        }
    }).catch(function(err){
        var preview = $('#doc-preview');
        if (preview) preview.innerHTML = '<p style="color:#f56c6c">加载失败: '+err.message+'</p>';
    });
}

// ---------- Projects ----------
function renderProjects(el) {
    applyRoleUI();
    var isAdmin = (getRole() === '1');
    var adminBtns = isAdmin ? '<button id="proj-pending-btn" style="padding:8px 16px;background:#e6a23c;color:#fff;border:none;border-radius:6px;cursor:pointer">待审批项目</button><button id="proj-all-btn" style="padding:8px 16px;background:#409eff;color:#fff;border:none;border-radius:6px;cursor:pointer">所有项目</button>' : '';
    el.innerHTML = '<h3 style="margin-bottom:16px">项目申报</h3><div style="display:flex;gap:12px;margin-bottom:16px"><button id="proj-create-btn" class="btn-primary" style="padding:8px 16px">+ 新建申报</button>' + adminBtns + '</div><div id="proj-list" style="background:var(--white);padding:20px;border-radius:8px;box-shadow:var(--shadow)"></div><div id="proj-form-modal" style="display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.5);z-index:1000;justify-content:center;align-items:center"><div style="background:var(--white);padding:24px;border-radius:12px;width:500px;max-height:80vh;overflow-y:auto"><h3 style="margin-bottom:16px">新建项目申报</h3><form id="proj-form"><div class="pf-row"><label>项目名称</label><input type="text" name="name" required placeholder="请输入项目名称" style="flex:1;padding:8px 12px;border:1px solid var(--border);border-radius:6px"></div><div class="pf-row"><label>项目描述</label><textarea name="description" rows="3" style="flex:1;padding:8px 12px;border:1px solid var(--border);border-radius:6px;font-size:14px" placeholder="请输入项目描述"></textarea></div><div class="pf-row"><label>归属部门</label><select name="department_id" style="flex:1;padding:8px 12px;border:1px solid var(--border);border-radius:6px"><option value="1">技术研发部</option><option value="2">市场营销部</option><option value="3">人力资源部</option><option value="4">财务部</option><option value="5">行政部</option></select></div><div class="pf-row"><label>项目预算</label><input type="number" name="budget" placeholder="0.00" step="0.01" min="0" style="flex:1;padding:8px 12px;border:1px solid var(--border);border-radius:6px"></div><div class="pf-row"><label>开始日期</label><input type="date" name="start_date" style="flex:1;padding:8px 12px;border:1px solid var(--border);border-radius:6px"></div><div class="pf-row"><label>结束日期</label><input type="date" name="end_date" style="flex:1;padding:8px 12px;border:1px solid var(--border);border-radius:6px"></div><div style="display:flex;gap:12px;justify-content:flex-end;margin-top:20px"><button type="button" id="proj-cancel" style="padding:8px 24px;border:1px solid var(--border);border-radius:6px;background:var(--white);cursor:pointer">取消</button><button type="submit" class="btn-primary" style="padding:8px 24px">提交申报</button></div></form></div></div><style>.pf-row{display:flex;align-items:flex-start;margin-bottom:14px;gap:8px}.pf-row label{width:80px;text-align:right;line-height:32px;color:var(--text-light);font-size:14px;flex-shrink:0}</style>';

    loadProjectList();

    var createBtn = $('#proj-create-btn');
    if (createBtn) createBtn.addEventListener('click', function(){
        var modal = $('#proj-form-modal');
        if (modal) modal.style.display = 'flex';
    });

    var cancelBtn = $('#proj-cancel');
    if (cancelBtn) cancelBtn.addEventListener('click', function(){
        var modal = $('#proj-form-modal');
        if (modal) modal.style.display = 'none';
    });

    var pendingBtn = $('#proj-pending-btn');
    if (pendingBtn) pendingBtn.addEventListener('click', function(){ loadPendingProjects(); });

    var allBtn = $('#proj-all-btn');
    if (allBtn) allBtn.addEventListener('click', function(){ loadAllProjects(); });

    var form = $('#proj-form');
    if (form) form.addEventListener('submit', handleProjectCreate);
}

function loadProjectList() {
    var el = $('#proj-list');
    if (!el) return;
    el.innerHTML = '<p style="color:var(--text-light)">加载中...</p>';
    api.projectList().then(function(res){
        if (res.code === 0 && res.data) {
            var list = res.data;
            var html = '';
            list.forEach(function(p){
                var sc = p.approval_status==='待审批'?'st-pending':(p.approval_status==='已通过'?'st-approved':'st-rejected');
                html += '<div class="proj-card" data-id="'+p.id+'" style="padding:16px;border:1px solid var(--border);border-radius:8px;margin-bottom:12px;cursor:pointer"><div style="display:flex;justify-content:space-between;align-items:center"><strong>'+p.name+'</strong><span class="proj-status '+sc+'" style="padding:2px 8px;border-radius:4px;font-size:12px;color:#fff">'+p.approval_status+'</span></div><p style="color:var(--text-light);font-size:12px;margin-top:6px">'+p.department_name+' | 预算 '+p.budget+' | '+p.start_date+'</p></div>';
            });
            if (!html) html = '<p style="color:var(--text-light)">暂无申报项目</p>';
            el.innerHTML = html + '<style>.st-pending{background:#e6a23c}.st-approved{background:#67c23a}.st-rejected{background:#f56c6c}</style>';
            $$('.proj-card').forEach(function(card){
                card.addEventListener('click', function(){ showProjectDetail(card.dataset.id); });
            });
        }
    }).catch(function(){});
}

function loadPendingProjects() {
    var el = $('#proj-list');
    if (!el) return;
    el.innerHTML = '<p style="color:var(--text-light)">加载中...</p>';
    api.projectAll({status: '待审批'}).then(function(res){
        if (res.code === 0 && res.data) {
            var list = res.data;
            var html = '<h4 style="margin-bottom:12px">待审批项目列表</h4>';
            list.forEach(function(p){
                html += '<div class="proj-card" data-id="'+p.id+'" style="padding:16px;border:1px solid var(--border);border-radius:8px;margin-bottom:12px;cursor:pointer"><div style="display:flex;justify-content:space-between;align-items:center"><strong>'+p.name+'</strong><span style="background:#e6a23c;color:#fff;padding:2px 8px;border-radius:4px;font-size:12px">待审批</span></div><p style="color:var(--text-light);font-size:12px;margin-top:6px">申报人: '+p.creator_name+' | '+p.department_name+' | '+p.created_at+'</p></div>';
            });
            if (!html) html += '<p style="color:var(--text-light)">暂无待审批项目</p>';
            el.innerHTML = html;
            $$('.proj-card').forEach(function(card){
                card.addEventListener('click', function(){ showProjectDetail(card.dataset.id); });
            });
        }
    }).catch(function(){});
}

function loadAllProjects() {
    var el = $('#proj-list');
    if (!el) return;
    el.innerHTML = '<p style="color:var(--text-light)">加载中...</p>';
    // 垂直越权：普通用户也能调用此接口
    api.projectAll().then(function(res){
        if (res.code === 0 && res.data) {
            var list = res.data;
            var html = '<h4 style="margin-bottom:12px">所有申报项目</h4>';
            list.forEach(function(p){
                var sc = p.approval_status==='待审批'?'st-pending':(p.approval_status==='已通过'?'st-approved':'st-rejected');
                html += '<div class="proj-card" data-id="'+p.id+'" style="padding:16px;border:1px solid var(--border);border-radius:8px;margin-bottom:12px;cursor:pointer"><div style="display:flex;justify-content:space-between;align-items:center"><strong>'+p.name+'</strong><span class="proj-status '+sc+'" style="padding:2px 8px;border-radius:4px;font-size:12px;color:#fff">'+p.approval_status+'</span></div><p style="color:var(--text-light);font-size:12px;margin-top:6px">'+p.creator_name+' | '+p.department_name+' | '+p.created_at+'</p></div>';
            });
            if (!html) html += '<p style="color:var(--text-light)">暂无项目</p>';
            el.innerHTML = html + '<style>.st-pending{background:#e6a23c}.st-approved{background:#67c23a}.st-rejected{background:#f56c6c}</style>';
            $$('.proj-card').forEach(function(card){
                card.addEventListener('click', function(){ showProjectDetail(card.dataset.id); });
            });
        }
    }).catch(function(){});
}

function showProjectDetail(id) {
    // 水平越权漏洞：通过替换id可查看他人项目详情
    api.projectDetail({id: id}).then(function(res){
        if (res.code === 0 && res.data) {
            var p = res.data;
            var sc = p.approval_status==='待审批'?'st-pending':(p.approval_status==='已通过'?'st-approved':'st-rejected');
            var html = '<div style="background:var(--white);padding:24px;border-radius:8px;box-shadow:var(--shadow)"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px"><h3>'+p.name+'</h3><span class="proj-status '+sc+'" style="padding:2px 8px;border-radius:4px;font-size:12px;color:#fff">'+p.approval_status+'</span></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:14px"><div><span style="color:var(--text-light)">项目编号:</span> '+p.uuid+'</div><div><span style="color:var(--text-light)">申报人:</span> '+p.creator_name+'</div><div><span style="color:var(--text-light)">联系电话:</span> '+p.creator_phone+'</div><div><span style="color:var(--text-light)">归属部门:</span> '+p.department_name+'</div><div><span style="color:var(--text-light)">项目经理:</span> '+p.manager_name+'</div><div><span style="color:var(--text-light)">项目预算:</span> ¥'+p.budget+'</div><div><span style="color:var(--text-light)">起止日期:</span> '+p.start_date+' ~ '+p.end_date+'</div><div><span style="color:var(--text-light)">当前进度:</span> '+p.progress+'%</div></div><div style="margin-top:16px"><span style="color:var(--text-light)">项目描述:</span><p style="margin-top:6px">'+p.description+'</p></div>';
            if (p.approval_remark) {
                html += '<div style="margin-top:12px"><span style="color:var(--text-light)">审批意见:</span><p style="margin-top:6px">'+p.approval_remark+'</p></div>';
            }
            if (getRole() === '1' && p.approval_status === '待审批') {
                html += '<div style="margin-top:16px;display:flex;gap:12px"><button id="approve-yes" style="padding:6px 16px;background:#67c23a;color:#fff;border:none;border-radius:6px;cursor:pointer">通过</button><button id="approve-no" style="padding:6px 16px;background:#f56c6c;color:#fff;border:none;border-radius:6px;cursor:pointer">驳回</button><input type="text" id="approve-remark" placeholder="审批意见(选填)" style="flex:1;padding:6px 12px;border:1px solid var(--border);border-radius:6px"></div>';
            }
            html += '<div style="margin-top:16px"><button id="proj-back-btn" style="padding:6px 16px;border:1px solid var(--border);border-radius:6px;background:var(--white);cursor:pointer">返回列表</button></div></div><style>.st-pending{background:#e6a23c}.st-approved{background:#67c23a}.st-rejected{background:#f56c6c}</style>';
            var container = $('#page-content');
            if (container) container.innerHTML = html;
            var approveYes = $('#approve-yes');
            var approveNo = $('#approve-no');
            if (approveYes) approveYes.addEventListener('click', function(){ doApprove(id, '已通过'); });
            if (approveNo) approveNo.addEventListener('click', function(){ doApprove(id, '已驳回'); });
            var backBtn = $('#proj-back-btn');
            if (backBtn) backBtn.addEventListener('click', function(){ navigate('projects'); });
        } else {
            alert(res.msg || '获取项目详情失败');
        }
    }).catch(function(err){ alert('请求失败: '+err.message); });
}

function doApprove(id, status) {
    var remark = $('#approve-remark') ? $('#approve-remark').value : '';
    api.projectApprove({id: id, approval_status: status, remark: remark}).then(function(res){
        if (res.code === 0) {
            alert('审批操作成功');
            navigate('projects');
        } else {
            alert(res.msg || '审批失败');
        }
    }).catch(function(err){ alert('请求失败: '+err.message); });
}

function handleProjectCreate(e) {
    e.preventDefault();
    var form = $('#proj-form');
    if (!form) return;
    var data = {
        name: form.querySelector('[name="name"]').value.trim(),
        description: form.querySelector('[name="description"]').value.trim(),
        department_id: form.querySelector('[name="department_id"]').value,
        budget: form.querySelector('[name="budget"]').value || '0',
        start_date: form.querySelector('[name="start_date"]').value,
        end_date: form.querySelector('[name="end_date"]').value
    };
    if (!data.name) return;
    api.projectCreate(data).then(function(res){
        if (res.code === 0) {
            var modal = $('#proj-form-modal');
            if (modal) modal.style.display = 'none';
            form.reset();
            loadProjectList();
            alert('项目申报提交成功');
        } else {
            alert(res.msg || '提交失败');
        }
    }).catch(function(err){ alert('请求失败: '+err.message); });
}

// ---------- Search ----------
function renderSearch(el) {
    el.innerHTML = '<h3 style="margin-bottom:16px">人员搜索</h3><div style="display:flex;gap:12px;margin-bottom:16px"><input type="text" id="search-keyword" placeholder="输入姓名或部门搜索..." style="flex:1;padding:8px 12px;border:1px solid var(--border);border-radius:6px"><button id="search-btn" class="btn-primary" style="padding:8px 16px">搜索</button></div><div id="search-result"></div>';
    var btn = $('#search-btn');
    if (btn) btn.addEventListener('click', handleSearch);
    var kw = $('#search-keyword');
    if (kw) kw.addEventListener('keyup', function(e){ if(e.key==='Enter') handleSearch(); });
}

function handleSearch() {
    var keyword = $('#search-keyword') ? $('#search-keyword').value.trim() : '';
    if (!keyword) return;
    // 垂直越权漏洞：普通用户可调用search接口获取全员UUID
    api.search({keyword: keyword}).then(function(res){
        if (res.code === 0 && res.data) {
            var list = res.data.list || res.data || [];
            var html = '<table class="data-table"><thead><tr><th>UUID</th><th>姓名</th><th>部门</th><th>职位</th></tr></thead><tbody>';
            list.forEach(function(u){
                html += '<tr><td style="font-family:monospace;font-size:12px;color:var(--text-light)">'+u.uuid+'</td><td>'+u.real_name+'</td><td>'+u.department_name+'</td><td>'+u.position+'</td></tr>';
            });
            html += '</tbody></table>';
            if (!list.length) html = '<p style="color:var(--text-light)">未找到匹配人员</p>';
            var el = $('#search-result');
            if (el) el.innerHTML = html;
        }
    }).catch(function(){});
}

// ---------- Admin Panel ----------
function renderAdmin(el) {
    applyRoleUI();
    var isAdmin = (getRole() === '1');
    el.innerHTML = '<div style="display:flex;gap:16px;margin-bottom:20px"><button id="admin-tab-config" class="admin-tab active">系统配置</button><button id="admin-tab-logs" class="admin-tab">日志列表</button><button id="admin-tab-users" class="admin-tab">用户管理</button></div><div id="admin-content" style="background:var(--white);padding:20px;border-radius:8px;box-shadow:var(--shadow)"></div><style>.admin-tab{padding:8px 20px;border:1px solid var(--border);border-radius:6px;background:var(--white);cursor:pointer;font-size:14px}.admin-tab.active,.admin-tab:hover{background:var(--primary);color:#fff;border-color:var(--primary)}</style>';

    $$('.admin-tab').forEach(function(btn){
        btn.addEventListener('click', function(){
            $$('.admin-tab').forEach(function(b){ b.classList.remove('active'); });
            btn.classList.add('active');
            var tab = btn.id.replace('admin-tab-', '');
            loadAdminTab(tab);
        });
    });

    // 垂直越权：普通用户也能访问系统配置页面
    loadAdminTab('config');
}

function loadAdminTab(tab) {
    var el = $('#admin-content');
    if (!el) return;

    switch(tab) {
        case 'config':
            el.innerHTML = '<p style="color:var(--text-light)">加载中...</p>';
            // 垂直越权漏洞：普通用户也可以调用此接口读取系统配置
            api.adminConfig().then(function(res){
                if (res.code === 0 && res.data) {
                    renderConfigForm(res.data);
                } else if (res.code === 403) {
                    el.innerHTML = '<div style="text-align:center;padding:40px"><svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#f56c6c"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg><p style="color:#f56c6c;margin-top:16px;font-size:14px">无权限访问此功能</p><p style="color:var(--text-light);font-size:12px;margin-top:8px">仅管理员可操作</p></div>';
                } else {
                    el.innerHTML = '<p style="color:var(--text-light)">加载失败</p>';
                }
            }).catch(function(err){
                el.innerHTML = '<p style="color:#f56c6c">请求失败: '+err.message+'</p>';
            });
            break;

        case 'logs':
            el.innerHTML = '<p style="color:var(--text-light)">加载中...</p>';
            // 普通用户调用此接口会返回403
            api.adminLogs({page: 1}).then(function(res){
                if (res.code === 0 && res.data) {
                    renderLogsList(res.data);
                } else if (res.code === 403) {
                    el.innerHTML = '<div style="text-align:center;padding:40px"><svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#f56c6c"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg><p style="color:#f56c6c;margin-top:16px;font-size:14px">无权限访问此功能</p><p style="color:var(--text-light);font-size:12px;margin-top:8px">仅管理员可操作</p></div>';
                } else {
                    el.innerHTML = '<p style="color:var(--text-light)">暂无日志</p>';
                }
            }).catch(function(err){
                el.innerHTML = '<p style="color:#f56c6c">请求失败: '+err.message+'</p>';
            });
            break;

        case 'users':
            el.innerHTML = '<p style="color:var(--text-light)">加载中...</p>';
            // 普通用户调用此接口会返回403
            api.adminUsers().then(function(res){
                if (res.code === 0 && res.data) {
                    renderUsersList(res.data);
                } else if (res.code === 403) {
                    el.innerHTML = '<div style="text-align:center;padding:40px"><svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#f56c6c"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg><p style="color:#f56c6c;margin-top:16px;font-size:14px">无权限访问此功能</p><p style="color:var(--text-light);font-size:12px;margin-top:8px">仅管理员可操作</p></div>';
                } else {
                    el.innerHTML = '<p style="color:var(--text-light)">暂无用户</p>';
                }
            }).catch(function(err){
                el.innerHTML = '<p style="color:#f56c6c">请求失败: '+err.message+'</p>';
            });
            break;
    }
}

function renderConfigForm(data) {
    var el = $('#admin-content');
    if (!el) return;
    var html = '<form id="config-form" style="max-width:600px"><h4 style="margin-bottom:20px">系统基本配置</h4>';
    var configs = data || {};
    var fields = [
        {key: 'app_name', label: '应用名称', value: configs.app_name || '汤圆OA办公系统'},
        {key: 'app_version', label: '系统版本', value: configs.app_version || '2.4.1'},
        {key: 'db_host', label: '数据库主机', value: configs.db_host || 'localhost'},
        {key: 'upload_max_size', label: '上传限制(MB)', value: configs.upload_max_size || '5'},
        {key: 'session_timeout', label: '会话超时(分钟)', value: configs.session_timeout || '30'},
        {key: 'log_level', label: '日志级别', value: configs.log_level || 'info'},
        {key: 'smtp_host', label: 'SMTP服务器', value: configs.smtp_host || ''},
        {key: 'smtp_user', label: 'SMTP账号', value: configs.smtp_user || ''}
    ];
    fields.forEach(function(f){
        html += '<div style="display:flex;align-items:center;margin-bottom:14px"><label style="width:120px;text-align:right;color:var(--text-light);font-size:14px">'+f.label+'</label><input type="text" name="'+f.key+'" value="'+f.value+'" style="flex:1;padding:8px 12px;border:1px solid var(--border);border-radius:6px;font-size:14px"></div>';
    });
    html += '<div style="margin-top:20px;padding-left:120px"><button type="submit" class="btn-primary" style="padding:8px 24px">保存配置</button></div></form>';
    el.innerHTML = html;

    var form = $('#config-form');
    if (form) {
        form.addEventListener('submit', function(e){
            e.preventDefault();
            var formData = {};
            fields.forEach(function(f){
                var input = form.querySelector('[name="'+f.key+'"]');
                if (input) formData[f.key] = input.value;
            });
            api.adminUpdateConfig(formData).then(function(res){
                if (res.code === 0) {
                    alert('配置保存成功');
                } else if (res.code === 403) {
                    alert('无权限修改配置');
                } else {
                    alert(res.msg || '保存失败');
                }
            }).catch(function(err){
                alert('请求失败: '+err.message);
            });
        });
    }
}

function renderLogsList(data) {
    var el = $('#admin-content');
    if (!el) return;
    var list = data.list || data || [];
    var html = '<table class="data-table"><thead><tr><th>时间</th><th>用户</th><th>操作</th><th>详情</th><th>IP</th></tr></thead><tbody>';
    list.forEach(function(log){
        html += '<tr><td style="font-size:12px">'+log.created_at+'</td><td>'+log.username+'</td><td>'+log.action+'</td><td style="font-size:12px;color:var(--text-light);max-width:200px">'+log.detail+'</td><td style="font-size:12px">'+log.ip+'</td></tr>';
    });
    html += '</tbody></table>';
    if (!list.length) html = '<p style="color:var(--text-light)">暂无日志记录</p>';
    el.innerHTML = html;
}

function renderUsersList(data) {
    var el = $('#admin-content');
    if (!el) return;
    var list = data.list || data || [];
    var html = '<table class="data-table"><thead><tr><th>UUID</th><th>姓名</th><th>账号</th><th>手机号</th><th>身份证号</th><th>部门</th><th>职位</th><th>状态</th></tr></thead><tbody>';
    list.forEach(function(u){
        var stColor = u.status==='在职'?'#67c23a':(u.status==='离职'?'#f56c6c':'#e6a23c');
        html += '<tr><td style="font-size:11px;color:var(--text-light)">'+u.uuid+'</td><td>'+u.real_name+'</td><td>'+u.username+'</td><td>'+u.phone+'</td><td style="font-size:12px">'+u.id_card+'</td><td>'+u.department+'</td><td>'+u.position+'</td><td><span style="padding:2px 8px;border-radius:4px;font-size:12px;color:#fff;background:'+stColor+'">'+u.status+'</span></td></tr>';
    });
    html += '</tbody></table>';
    if (!list.length) html = '<p style="color:var(--text-light)">暂无用户</p>';
    el.innerHTML = html;
}

// ---------- Login ----------
function handleLogin(e) {
    e.preventDefault();
    var username = $('#login-username') ? $('#login-username').value.trim() : '';
    var password = $('#login-password') ? $('#login-password').value : '';
    if (!username || !password) return;
    api.login({username: username, password: password}).then(function(res){
        if (res.code === 0 && res.data) {
            state.token = res.data.token || 'session';
            state.user = res.data;
            saveState();
            enterSystem();
        } else {
            alert(res.msg || '登录失败');
        }
    }).catch(function(err){ alert('请求失败: '+err.message); });
}

function handleLogout() {
    api.logout().then(function(){ clearState(); showLogin(); }).catch(function(){ clearState(); showLogin(); });
}

// ---------- UI ----------
function showLogin() {
    var loginPage = $('#login-page');
    var mainPage = $('#main-page');
    if (loginPage) loginPage.style.display = '';
    if (mainPage) mainPage.style.display = 'none';
}

function enterSystem() {
    var loginPage = $('#login-page');
    var mainPage = $('#main-page');
    if (loginPage) loginPage.style.display = 'none';
    if (mainPage) mainPage.style.display = '';
    updateSidebar();
    applyRoleUI();
    navigate('dashboard');
    updateDatetime();
    // 从服务器同步角色（Cookie提权后自动更新UI）
    syncRoleFromServer();
}

function updateSidebar() {
    var nameEl = $('#sidebar-name');
    var roleEl = $('#sidebar-role');
    var avatarEl = $('#sidebar-avatar');
    if (nameEl && state.user) nameEl.textContent = state.user.real_name || state.user.username;
    if (roleEl && state.user) roleEl.textContent = getRole() === '1' ? '管理员' : '普通员工';
    if (avatarEl && state.user) {
        var avatarSrc = state.user.avatar || '/img/default-avatar.png';
        if (avatarSrc && (avatarSrc.startsWith('http://') || avatarSrc.startsWith('https://'))) {
            avatarEl.innerHTML = '<img src="'+API_BASE+'/imgproxy.php?url='+encodeURIComponent(avatarSrc)+'" style="width:32px;height:32px;border-radius:50%;object-fit:cover">';
        } else {
            avatarEl.innerHTML = '<img src="'+avatarSrc+'" style="width:32px;height:32px;border-radius:50%;object-fit:cover">';
        }
    }
}

function updateDatetime() {
    var el = $('#header-datetime');
    if (!el) return;
    var now = new Date();
    var days = ['日','一','二','三','四','五','六'];
    el.textContent = now.getFullYear()+'-'+(now.getMonth()+1).toString().padStart(2,'0')+'-'+now.getDate().toString().padStart(2,'0')+' '+now.getHours().toString().padStart(2,'0')+':'+now.getMinutes().toString().padStart(2,'0')+':'+now.getSeconds().toString().padStart(2,'0')+' 星期'+days[now.getDay()];
}
setInterval(updateDatetime, 1000);

// ---------- Init ----------
function init() {
    var loginForm = $('#login-form');
    if (loginForm) loginForm.addEventListener('submit', handleLogin);

    $$('.nav-item').forEach(function(item){
        item.addEventListener('click', function(e){
            e.preventDefault();
            if (item.dataset.page) navigate(item.dataset.page);
        });
    });

    var logoutBtn = $('#btn-logout');
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

    if (state.token && state.user) {
        enterSystem();
    } else {
        showLogin();
    }
}

document.addEventListener('DOMContentLoaded', init);

// Cookie提权漏洞：定期检测cookie变化，修改hx_role后UI自动刷新
// 攻击者在控制台输入 document.cookie='hx_role=1;path=/' 即可提权
var _lastRole = getRole();
setInterval(function(){
    var cur = getRole();
    if (cur !== _lastRole) {
        _lastRole = cur;
        applyRoleUI();
        updateSidebar();
    }
}, 500);

})();