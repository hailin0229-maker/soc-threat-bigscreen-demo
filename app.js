(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const frameParams = new URLSearchParams(location.search);
  // 背景 SVG 外框全部移除；保留 neon 皮肤与标题修饰
  if (frameParams.get('frame') !== 'classic') $('#stage').classList.add('svg-frame-mode');

  // 页面由 CSS 流体布局自适应，不再整体缩放。
  window.addEventListener('resize', () => {
    if (trendChart) trendChart.resize();
    if (mapChart) mapChart.resize();
  });

  /* ------------------------------------------------------------------ */
  /* Data                                                               */
  /* ------------------------------------------------------------------ */

  const CITIES = {
    '北京': { coord: [116.407, 39.904], province: '北京市' },
    '上海': { coord: [121.474, 31.230], province: '上海市' },
    '沈阳': { coord: [123.431, 41.805], province: '辽宁省' },
    '广州': { coord: [113.264, 23.129], province: '广东省' },
  };

  const PROVINCE_META = {
    '辽宁省': { city: '沈阳', top: [['美国', 9], ['德国', 5], ['未解析', 3]] },
    '北京市': { city: '北京', top: [['美国', 16], ['德国', 8], ['新加坡', 5]] },
    '上海市': { city: '上海', top: [['德国', 10], ['荷兰', 6], ['美国', 5]] },
    '广东省': { city: '广州', top: [['新加坡', 7], ['巴西', 4], ['未解析', 3]] },
    '浙江省': { city: '杭州', top: [['美国', 4], ['日本', 2], ['未解析', 1]] },
    '江苏省': { city: '南京', top: [['德国', 3], ['荷兰', 2], ['未解析', 1]] },
    '山东省': { city: '济南', top: [['日本', 3], ['美国', 2], ['未解析', 1]] },
    '四川省': { city: '成都', top: [['美国', 2], ['新加坡', 1], ['未解析', 1]] },
    '湖北省': { city: '武汉', top: [['德国', 2], ['未解析', 1], ['美国', 1]] },
    '福建省': { city: '福州', top: [['日本', 1], ['美国', 1], ['未解析', 1]] },
    '天津市': { city: '天津', top: [['暂无数据', 0]] },
    '河北省': { city: '石家庄', top: [['暂无数据', 0]] },
    '山西省': { city: '太原', top: [['暂无数据', 0]] },
    '内蒙古自治区': { city: '呼和浩特', top: [['暂无数据', 0]] },
    '吉林省': { city: '长春', top: [['暂无数据', 0]] },
    '黑龙江省': { city: '哈尔滨', top: [['暂无数据', 0]] },
    '安徽省': { city: '合肥', top: [['暂无数据', 0]] },
    '江西省': { city: '南昌', top: [['暂无数据', 0]] },
    '河南省': { city: '郑州', top: [['暂无数据', 0]] },
    '湖南省': { city: '长沙', top: [['暂无数据', 0]] },
    '广西壮族自治区': { city: '南宁', top: [['暂无数据', 0]] },
    '海南省': { city: '海口', top: [['暂无数据', 0]] },
    '重庆市': { city: '重庆', top: [['暂无数据', 0]] },
    '贵州省': { city: '贵阳', top: [['暂无数据', 0]] },
    '云南省': { city: '昆明', top: [['暂无数据', 0]] },
    '西藏自治区': { city: '拉萨', top: [['暂无数据', 0]] },
    '陕西省': { city: '西安', top: [['暂无数据', 0]] },
    '甘肃省': { city: '兰州', top: [['暂无数据', 0]] },
    '青海省': { city: '西宁', top: [['暂无数据', 0]] },
    '宁夏回族自治区': { city: '银川', top: [['暂无数据', 0]] },
    '新疆维吾尔自治区': { city: '乌鲁木齐', top: [['暂无数据', 0]] },
    '台湾省': { city: '台北', top: [['暂无数据', 0]] },
    '香港特别行政区': { city: '香港', top: [['暂无数据', 0]] },
    '澳门特别行政区': { city: '澳门', top: [['暂无数据', 0]] },
  };

  const CHINA_CITY_SOURCES = [
    { name: '乌鲁木齐', coord: [87.62, 43.82], count: 5, target: '北京' },
    { name: '兰州', coord: [103.83, 36.06], count: 4, target: '北京' },
    { name: '成都', coord: [104.07, 30.67], count: 8, target: '北京' },
    { name: '重庆', coord: [106.55, 29.56], count: 6, target: '上海' },
    { name: '武汉', coord: [114.30, 30.59], count: 9, target: '上海' },
    { name: '长沙', coord: [112.98, 28.19], count: 6, target: '上海' },
    { name: '广州', coord: [113.26, 23.13], count: 12, target: '上海' },
    { name: '深圳', coord: [114.06, 22.55], count: 10, target: '上海' },
    { name: '杭州', coord: [120.15, 30.28], count: 8, target: '上海' },
    { name: '南京', coord: [118.80, 32.06], count: 6, target: '上海' },
    { name: '郑州', coord: [113.62, 34.75], count: 6, target: '北京' },
    { name: '济南', coord: [117.12, 36.65], count: 4, target: '北京' },
    { name: '哈尔滨', coord: [126.63, 45.75], count: 3, target: '沈阳' },
    { name: '西安', coord: [108.95, 34.27], count: 5, target: '北京' },
    { name: '福州', coord: [119.30, 26.08], count: 4, target: '上海' },
    { name: '昆明', coord: [102.71, 25.04], count: 5, target: '上海' },
  ];

  const DATA = {
    30: {
      total: 101, unclosed: 58, handled: 43, rate: 42.6, ips: 30, assets: 10,
      deltas: { total: '↑ 12.4%', unclosed: '↑ 8.2%', handled: '↓ 3.1%' },
      sources: {
        '美国': { ips: 8, alerts: 36, coord: [-100, 40], labelPos: 'right' },
        '德国': { ips: 5, alerts: 20, coord: [10.5, 51], labelPos: 'right' },
        '新加坡': { ips: 4, alerts: 14, coord: [103.8, 1.35], labelPos: 'right' },
        '日本': { ips: 2, alerts: 7, coord: [138, 36], labelPos: 'right' },
        '荷兰': { ips: 2, alerts: 4, coord: [5.5, 52], labelPos: 'left' },
        '巴西': { ips: 1, alerts: 2, coord: [-47, -15], labelPos: 'right' },
        '未解析': { ips: 8, alerts: 18, coord: null },
      },
      targets: {
        '北京': 44, '上海': 32, '沈阳': 25,
      },
      provinces: {
        '辽宁省': 25, '北京市': 44, '上海市': 32, '广东省': 18, '浙江省': 12,
        '江苏省': 10, '山东省': 8, '四川省': 6, '湖北省': 5, '福建省': 4,
      },
      ipsList: [
        { ip: '203.0.113.101', region: '美国 · 加州', type: '数据库注入', count: 23, unresolved: false },
        { ip: '198.51.100.99', region: '德国 · 法兰克福', type: '暴力破解', count: 17, unresolved: false },
        { ip: '11.128.241.162', region: '新加坡', type: '流量洪泛', count: 12, unresolved: false },
        { ip: '47.94.14.179', region: '日本 · 东京', type: '漏洞利用', count: 9, unresolved: false },
        { ip: '45.153.160.2', region: '荷兰 · 阿姆斯特丹', type: '端口扫描', count: 7, unresolved: false },
        { ip: '185.220.101.4', region: '德国 · 柏林', type: '暴力破解', count: 6, unresolved: false },
        { ip: '103.145.12.8', region: '新加坡', type: '网站探测', count: 5, unresolved: false },
        { ip: '191.101.31.7', region: '巴西 · 圣保罗', type: '恶意扫描', count: 4, unresolved: false },
        { ip: '192.0.2.81', region: '未解析', type: '数据库注入', count: 3, unresolved: true },
        { ip: '198.18.0.9', region: '未解析', type: '端口扫描', count: 3, unresolved: true },
      ],
      assetRows: [
        { name: '生产区核心网关', ip: '10.48.31.73', count: 21, crit: '核心', level: 'high' },
        { name: '上海办公网出口', ip: '198.51.100.42', count: 18, crit: '核心', level: 'high' },
        { name: '财务系统前置机', ip: '10.48.31.18', count: 14, crit: '重要', level: 'mid' },
        { name: '邮件安全网关', ip: '10.48.31.26', count: 11, crit: '重要', level: 'mid' },
        { name: '运维堡垒机', ip: '10.48.31.9', count: 9, crit: '一般', level: 'low' },
      ],
      types: [
        { name: '数据库注入', count: 17, side: 'net' },
        { name: '终端-异常登录', count: 13, side: 'end' },
        { name: '终端-异常账号', count: 13, side: 'end' },
        { name: '终端-敏感行为', count: 13, side: 'end' },
        { name: '终端-病毒查杀', count: 13, side: 'end' },
      ],
      honeypots: [
        { title: '境外扫描器探测远程登录弱口令', src: '198.51.100.99', dst: '10.0.50.21', sev: '中危', sevClass: 'mid', status: '待处置', statusClass: '', time: '10:13:27', high: false },
        { title: '蜜罐扫描日志 · 横向探测', src: '45.153.160.2', dst: '10.0.50.22', sev: '低危', sevClass: 'low', status: '处置中', statusClass: 'doing', time: '09:58:12', high: false },
        { title: '远程登录暴力破解尝试', src: '185.220.101.4', dst: '10.0.50.23', sev: '高危', sevClass: 'high', status: '已处置', statusClass: 'ok', time: '09:31:45', high: true },
      ],
      intel: [
        { t: '13:02', title: '境外地址段新增暴力破解特征', src: '情报', hot: true },
        { t: '12:48', title: '钓鱼邮件样本命中「发票回执」主题', src: '邮件', hot: false },
        { t: '11:20', title: '美国远控域名活跃', src: '开源', hot: false },
        { t: '10:05', title: '辽宁重点单位遭定向扫描，建议排查', src: '运营', hot: false },
      ],
      trend: {
        labels: ['10-14','10-15','10-16','10-17','10-18','10-19','10-20','10-21','10-22','10-23','10-24','10-25','10-26','10-27','10-28','10-29','10-30','10-31','11-01','11-02','11-03','11-04','11-05','11-06','11-07','11-08','11-09','11-10','11-11','11-12'],
        handled: [2,3,4,5,7,11,16,22,31,26,15,9,7,6,8,12,16,14,10,6,4,6,9,7,4,3,4,2,3,2],
        open: [1,1,2,3,5,7,10,12,19,12,7,5,3,2,3,6,6,8,6,4,2,2,3,2,2,1,1,1,1,0],
      },
    },
    90: {
      total: 222, unclosed: 126, handled: 96, rate: 43.2, ips: 111, assets: 14,
      deltas: { total: '↑ 18.2%', unclosed: '↑ 14.6%', handled: '↑ 9.4%' },
      sources: {
        '美国': { ips: 38, alerts: 88, coord: [-100, 40], labelPos: 'right' },
        '德国': { ips: 22, alerts: 50, coord: [10.5, 51], labelPos: 'right' },
        '新加坡': { ips: 15, alerts: 34, coord: [103.8, 1.35], labelPos: 'right' },
        '日本': { ips: 8, alerts: 18, coord: [138, 36], labelPos: 'right' },
        '荷兰': { ips: 12, alerts: 18, coord: [5.5, 52], labelPos: 'left' },
        '巴西': { ips: 7, alerts: 8, coord: [-47, -15], labelPos: 'right' },
        '未解析': { ips: 9, alerts: 6, coord: null },
      },
      targets: { '北京': 96, '上海': 70, '沈阳': 56 },
      provinces: {
        '辽宁省': 56, '北京市': 96, '上海市': 70, '广东省': 42, '浙江省': 28,
        '江苏省': 22, '山东省': 18, '四川省': 12, '湖北省': 10, '福建省': 8,
      },
      ipsList: [
        { ip: '203.0.113.101', region: '美国 · 加州', type: '数据库注入', count: 46, unresolved: false },
        { ip: '198.51.100.99', region: '德国 · 法兰克福', type: '暴力破解', count: 34, unresolved: false },
        { ip: '11.128.241.162', region: '新加坡', type: '流量洪泛', count: 27, unresolved: false },
        { ip: '47.94.14.179', region: '日本 · 东京', type: '漏洞利用', count: 21, unresolved: false },
        { ip: '45.153.160.2', region: '荷兰 · 阿姆斯特丹', type: '端口扫描', count: 18, unresolved: false },
        { ip: '185.220.101.4', region: '德国 · 柏林', type: '暴力破解', count: 15, unresolved: false },
        { ip: '103.145.12.8', region: '新加坡', type: '网站探测', count: 12, unresolved: false },
        { ip: '191.101.31.7', region: '巴西 · 圣保罗', type: '恶意扫描', count: 9, unresolved: false },
        { ip: '192.0.2.81', region: '未解析', type: '数据库注入', count: 6, unresolved: true },
        { ip: '198.18.0.9', region: '未解析', type: '端口扫描', count: 4, unresolved: true },
      ],
      assetRows: [
        { name: '生产区核心网关', ip: '10.48.31.73', count: 48, crit: '核心', level: 'high' },
        { name: '上海办公网出口', ip: '198.51.100.42', count: 39, crit: '核心', level: 'high' },
        { name: '财务系统前置机', ip: '10.48.31.18', count: 31, crit: '重要', level: 'mid' },
        { name: '邮件安全网关', ip: '10.48.31.26', count: 24, crit: '重要', level: 'mid' },
        { name: '运维堡垒机', ip: '10.48.31.9', count: 17, crit: '一般', level: 'low' },
      ],
      types: [
        { name: '数据库注入', count: 42, side: 'net' },
        { name: '终端-异常登录', count: 31, side: 'end' },
        { name: '终端-异常账号', count: 28, side: 'end' },
        { name: '终端-敏感行为', count: 26, side: 'end' },
        { name: '终端-病毒查杀', count: 22, side: 'end' },
      ],
      honeypots: [
        { title: '境外扫描器探测远程登录弱口令', src: '198.51.100.99', dst: '10.0.50.21', sev: '中危', sevClass: 'mid', status: '待处置', statusClass: '', time: '11-12 10:13', high: false },
        { title: '蜜罐扫描日志 · 横向探测', src: '45.153.160.2', dst: '10.0.50.22', sev: '低危', sevClass: 'low', status: '处置中', statusClass: 'doing', time: '11-12 09:58', high: false },
        { title: '远程登录暴力破解尝试', src: '185.220.101.4', dst: '10.0.50.23', sev: '高危', sevClass: 'high', status: '已处置', statusClass: 'ok', time: '11-12 09:31', high: true },
      ],
      intel: [
        { t: '11-12', title: '境外地址段新增暴力破解特征', src: '情报', hot: true },
        { t: '11-11', title: '钓鱼邮件样本命中「发票回执」主题', src: '邮件', hot: false },
        { t: '11-10', title: '美国远控域名活跃', src: '开源', hot: false },
        { t: '11-09', title: '辽宁重点单位遭定向扫描，建议排查', src: '运营', hot: false },
      ],
      trend: {
        labels: ['08-15','08-18','08-21','08-24','08-27','08-30','09-02','09-05','09-08','09-11','09-14','09-17','09-20','09-23','09-26','09-29','10-02','10-05','10-08','10-11','10-14','10-17','10-20','10-23','10-26','10-29','11-01','11-04','11-08','11-12'],
        handled: [4,6,8,12,16,24,33,42,52,38,24,18,14,11,16,24,34,31,23,15,9,13,19,15,9,7,8,5,6,4],
        open: [2,3,4,7,10,15,21,27,35,24,14,10,7,5,8,13,16,18,14,9,5,5,7,5,4,2,3,2,2,1],
      },
    },
  };

  /* ------------------------------------------------------------------ */
  /* Utilities                                                          */
  /* ------------------------------------------------------------------ */

  const esc = (v) => String(v).replace(/[&<>"]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
  const fmt = (n) => new Intl.NumberFormat('en-US').format(n);
  const pad = (n) => String(n).padStart(2, '0');
  const nowTime = () => {
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };
  const nowClock = () => {
    const d = new Date();
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };

  let toastTimer = null;
  const toast = (msg) => {
    let el = $('#toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'toast';
      el.style.cssText = 'position:fixed;left:50%;bottom:70px;transform:translateX(-50%) translateY(8px);z-index:80;padding:11px 18px;background:linear-gradient(160deg,rgba(6,24,43,.96),rgba(3,12,24,.96));border:1px solid rgba(74,210,240,.35);color:#bff6ff;font-size:11px;letter-spacing:.5px;box-shadow:0 16px 40px rgba(0,0,0,.45);opacity:0;transition:.25s;pointer-events:none';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    requestAnimationFrame(() => { el.style.opacity = '1'; el.style.transform = 'translateX(-50%) translateY(0)'; });
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateX(-50%) translateY(8px)'; }, 2200);
  };

  /* ------------------------------------------------------------------ */
  /* Header clock / range                                               */
  /* ------------------------------------------------------------------ */

  let range = 30;
  let mapMode = 'world';
  let selectedProvince = null;
  let mapZoom = null;
  let mapChart = null;
  let trendChart = null;
  let geoChina = null;
  let geoWorld = null;
  let geoProvince = null;
  let southSeaGeo = null;
  let provinceAdcode = '';

  const updateClock = () => {
    const text = nowClock();
    $('#updatedText').textContent = `数据更新于 ${text}`;
    const footerTimeEl = $('#footerTime');
    if (footerTimeEl) footerTimeEl.textContent = nowTime();
  };
  setInterval(updateClock, 1000);
  updateClock();

  const refreshBtn = $('#refreshBtn');
  refreshBtn.addEventListener('click', () => {
    refreshBtn.classList.add('spin');
    updateClock();
    const state = $('.sync-state');
    state.style.borderColor = 'rgba(74,168,255,.55)';
    state.style.color = '#bff6ff';
    setTimeout(() => {
      refreshBtn.classList.remove('spin');
      state.style.borderColor = '';
      state.style.color = '';
    }, 800);
    toast('数据已同步 · 下次自动刷新 60s');
  });

  $('#fullBtn').addEventListener('click', () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
    else document.exitFullscreen?.();
  });

  $('#backBtn').addEventListener('click', () => {
    if (history.length > 1) history.back(); else toast('返回外部威胁监测');
  });

  /* ------------------------------------------------------------------ */
  /* KPI                                                                */
  /* ------------------------------------------------------------------ */

  let kpiInit = false;
  const animateCount = (el, to, decimals = 0) => {
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const from = kpiInit ? (parseFloat(String(el.textContent).replace(/[^0-9.]/g, '')) || 0) : 0;
    if (reduce) {
      el.textContent = decimals ? to.toFixed(decimals) : to;
      return;
    }
    const start = performance.now();
    const dur = 720;
    const step = (now) => {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      const v = from + (to - from) * eased;
      el.textContent = decimals ? v.toFixed(decimals) : Math.round(v);
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = decimals ? to.toFixed(decimals) : to;
    };
    requestAnimationFrame(step);
  };

  const setKpis = (d) => {
    animateCount($('#kpiTotal'), d.total);
    animateCount($('#kpiUnclosed'), d.unclosed);
    animateCount($('#kpiHandled'), d.handled);
    animateCount($('#kpiRate'), d.rate, 1);
    animateCount($('#kpiIps'), d.ips);
    animateCount($('#kpiAssets'), d.assets);
    kpiInit = true;
    $('#rateFill').style.width = `${d.rate}%`;
    $('#deltaTotal').textContent = d.deltas.total;
    $('#deltaUnclosed').textContent = d.deltas.unclosed;
    $('#deltaHandled').textContent = d.deltas.handled;
    $('#sourceChip').textContent = `${d.ips} 个来源`;
    $('#ipFoot').textContent = `境外 ${d.ips - d.sources['未解析'].ips} · 未解析 ${d.sources['未解析'].ips}`;
    $('#unresolvedChip').textContent = `未解析 ${d.sources['未解析'].ips}`;
    $('#unresolvedFoot').textContent = d.sources['未解析'].ips;
    $('#unresolvedHits').textContent = d.sources['未解析'].alerts;
    $('#assetChip').textContent = `${d.assets} 个资产`;
    $('#legendUnknown').textContent = d.sources['未解析'].ips;
    $('#trendHandled').textContent = d.handled;
    $('#trendOpen').textContent = d.unclosed;
  };

  /* ------------------------------------------------------------------ */
  /* Render lists                                                       */
  /* ------------------------------------------------------------------ */

  const renderIps = (d) => {
    const max = Math.max(...d.ipsList.map((x) => x.count), 1);
    $('#ipList').innerHTML = d.ipsList.map((x, i) => {
      const rank = i + 1;
      const top = rank <= 3 ? 'top' : '';
      const top1 = rank === 1 ? 'top1' : '';
      const unresolved = x.unresolved ? 'unresolved' : '';
      const region = x.unresolved
        ? '<span class="unknown">未解析</span>'
        : `<span class="region">${esc(x.region)}</span>`;
      return `<div class="ip-row ${top} ${top1} ${unresolved}" style="--i:${i}" data-ip="${esc(x.ip)}" title="查看 ${esc(x.ip)} 详情">
        <span class="rank">${rank}</span>
        <span class="ip-addr">${esc(x.ip)}</span>
        <span class="ip-meta">${region}<span class="type">${esc(x.type)}</span></span>
        <span class="ip-count">${fmt(x.count)}</span>
        <span class="ip-bar"><i style="--w:${Math.max(5, (x.count / max) * 100)}%"></i></span>
      </div>`;
    }).join('');
    $$('#ipList .ip-row').forEach((row) => {
      row.addEventListener('click', () => {
        const ip = row.dataset.ip;
        const item = d.ipsList.find((x) => x.ip === ip);
        openIpDrawer(item);
      });
    });
  };

  const renderAssets = (d) => {
    const max = Math.max(...d.assetRows.map((x) => x.count), 1);
    $('#assetList').innerHTML = d.assetRows.map((x, i) => {
      const top = i < 2 ? 'top' : '';
      const crit = x.crit === '核心' ? 'crit' : x.crit === '重要' ? 'crit important' : 'crit low';
      return `<div class="asset-row ${top}" style="--i:${i}" data-asset="${esc(x.name)}">
        <span class="asset-rank">${i + 1}</span>
        <div class="asset-main">
          <div class="asset-name">${esc(x.name)}<span class="${crit}">${esc(x.crit)}</span></div>
          <div class="asset-meta"><span class="mono">${esc(x.ip)}</span><span>${x.count} 次告警</span></div>
          <div class="asset-line"><i style="--w:${Math.max(6, (x.count / max) * 100)}%"></i></div>
        </div>
        <div class="asset-count"><b>${x.count}</b><span>次</span></div>
      </div>`;
    }).join('');
    $$('#assetList .asset-row').forEach((row) => {
      row.addEventListener('click', () => {
        const item = d.assetRows.find((x) => x.name === row.dataset.asset);
        openAssetDrawer(item);
      });
    });
  };

  const renderTypes = (d) => {
    const total = d.types.reduce((a, b) => a + b.count, 0);
    const max = Math.max(...d.types.map((x) => x.count), 1);
    $('#typeList').innerHTML = d.types.map((x, i) => {
      const pct = (x.count / total) * 100;
      return `<div class="type-row ${x.side === 'end' ? 'terminal' : ''}" style="--i:${i}" data-type="${esc(x.name)}">
        <span class="type-label">${esc(x.name)}</span>
        <span class="type-track"><i style="--w:${Math.max(5, (x.count / max) * 100)}%"></i></span>
        <span class="type-val">${x.count}</span>
        <span class="type-pct">${pct.toFixed(1)}%</span>
      </div>`;
    }).join('');
    $$('#typeList .type-row').forEach((row) => {
      row.addEventListener('click', () => {
        const item = d.types.find((x) => x.name === row.dataset.type);
        if (item) openTypeDrawer(item);
      });
    });
    const net = d.types.filter((x) => x.side === 'net').reduce((a, b) => a + b.count, 0);
    const end = total - net;
    const legends = $$('.type-legend b');
    if (legends[0]) legends[0].textContent = net;
    if (legends[1]) legends[1].textContent = end;
    const foot = $('.type-foot b');
    if (foot) foot.textContent = `${((total / d.total) * 100).toFixed(1)}%`;
  };

  const renderHoneypots = (d) => {
    $('#hpList').innerHTML = d.honeypots.map((x, i) => `<div class="hp-card ${x.high ? 'high' : ''}" style="--i:${i}" data-hp="${esc(x.title)}">
      <div class="hp-top">
        <span class="sev ${x.sevClass}">${esc(x.sev)}</span>
        <span class="hp-title">${esc(x.title)}</span>
        <span class="hp-status ${x.statusClass}"><i></i>${esc(x.status)}</span>
      </div>
      <div class="hp-flow">${esc(x.src)} <span class="arrow">→</span> <span class="trap">诱捕</span> <span class="arrow">→</span> ${esc(x.dst)}</div>
      <div class="hp-bottom"><span class="time">${esc(x.time)}</span><span>${x.high ? '高危交互' : '蜜罐探针'}</span></div>
    </div>`).join('');
    $$('#hpList .hp-card').forEach((row) => {
      row.addEventListener('click', () => {
        const item = d.honeypots.find((x) => x.title === row.dataset.hp);
        openHoneypotDrawer(item);
      });
    });
  };

  const renderIntel = (d) => {
    const items = [...d.intel, ...d.intel];
    const intelItemsEl = $('#intelItems');
    if (intelItemsEl) intelItemsEl.innerHTML = items.map((x) => `<span class="intel-item">
      ${x.hot ? '<i class="hot"></i>' : ''}
      <span class="t">${esc(x.t)}</span>
      <span>${esc(x.title)}</span>
      <span class="src">${esc(x.src)}</span>
    </span>`).join('');
  };

  /* ------------------------------------------------------------------ */
  /* Trend chart                                                        */
  /* ------------------------------------------------------------------ */

  const renderTrend = (d) => {
    if (!trendChart) trendChart = echarts.init($('#trendChart'), null, { renderer: 'canvas' });
    const axisFont = Math.max(14, Math.min(15, Math.round(window.innerWidth / 140)));
    const t = d.trend;
    const totals = t.handled.map((v, i) => v + t.open[i]);
    const max = Math.max(...totals);
    const yMax = Math.ceil(max / 10) * 10 + 10;
    const peakIndex = totals.indexOf(max);
    const peakChip = $('#peakChip');
    if (peakChip) peakChip.textContent = `峰值 ${max} · ${t.labels[peakIndex]}`;
    const option = {
      animationDuration: 900,
      animationDurationUpdate: 650,
      animationEasing: 'cubicOut',
      animationEasingUpdate: 'cubicOut',
      grid: { left: 32, right: 14, top: 10, bottom: 20 },
      tooltip: {
        trigger: 'axis',
        confine: true,
        backgroundColor: 'rgba(3,14,26,.94)',
        borderColor: 'rgba(74,210,240,.35)',
        borderWidth: 1,
        textStyle: { color: '#dff8ff', fontSize: 14, fontFamily: 'PingFang SC' },
        axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(74,168,255,.06)' } },
        formatter: (params) => {
          const i = params[0]?.dataIndex ?? 0;
          const handled = t.handled[i] || 0;
          const open = t.open[i] || 0;
          return `<div style="font-family:Rajdhani;font-size:10px;color:#6fa3b8;letter-spacing:.5px">${t.labels[i]}</div>
            <div style="margin-top:4px;font-size:10px">已处置 <b style="color:#2ef2a6;font-family:Rajdhani">${handled}</b> · 未闭环 <b style="color:#ff5c7a;font-family:Rajdhani">${open}</b></div>
            <div style="font-size:9px;color:#7da4b7;margin-top:2px">合计 ${handled + open} 条</div>`;
        },
      },
      xAxis: {
        type: 'category',
        data: t.labels,
        axisLine: { lineStyle: { color: 'rgba(80,160,190,.2)' } },
        axisTick: { show: false },
        axisLabel: { color: '#8cb1c2', fontSize: axisFont, fontFamily: 'Rajdhani', interval: 4, margin: 7 },
      },
      yAxis: {
        type: 'value',
        max: yMax,
        splitNumber: 3,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#7fa6b8', fontSize: axisFont, fontFamily: 'Rajdhani' },
        splitLine: { lineStyle: { color: 'rgba(80,150,180,.09)' } },
      },
      series: [
        {
          name: '已处置',
          type: 'bar',
          stack: 'total',
          data: t.handled,
          barWidth: '48%',
          itemStyle: {
            borderRadius: [0, 0, 4, 4],
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(46,242,166,.95)' },
              { offset: 1, color: 'rgba(46,242,166,.18)' },
            ]),
          },
          emphasis: { itemStyle: { color: '#7dffdc' } },
        },
        {
          name: '未闭环',
          type: 'bar',
          stack: 'total',
          data: t.open,
          barWidth: '48%',
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(255,92,122,.95)' },
              { offset: 1, color: 'rgba(255,92,122,.18)' },
            ]),
            borderRadius: [4, 4, 0, 0],
          },
          emphasis: { itemStyle: { color: '#ff95a8' } },
          markLine: {
            silent: true,
            symbol: 'none',
            lineStyle: { color: 'rgba(255,180,84,.35)', type: 'dashed', width: 1 },
            label: { show: false },
            data: [{ xAxis: peakIndex }],
          },
        },
        {
          name: '峰值',
          type: 'scatter',
          data: [[peakIndex, max]],
          symbolSize: 0,
          silent: true,
          z: 6,
          label: {
            show: false,
          },
        },
      ],
    };
    trendChart.setOption(option, true);
  };

  /* ------------------------------------------------------------------ */
  /* Map                                                                */
  /* ------------------------------------------------------------------ */

  const mapTip = {
    el: $('#mapTip'),
    kicker: $('#tipKicker'),
    title: $('#tipTitle'),
    sources: $('#tipSources'),
    alerts: $('#tipAlerts'),
    assets: $('#tipAssets'),
    bars: $('#sourceBars'),
    action: $('#tipAction'),
  };

  const setSourceBars = (rows) => {
    const max = Math.max(...rows.map((r) => r[1]), 1);
    mapTip.bars.innerHTML = rows.slice(0, 5).map(([name, val]) => `<div class="source-line">
      <span>${esc(name)}</span><span class="s-track"><i style="--w:${Math.max(5, (val / max) * 100)}%"></i></span><b>${fmt(val)}</b>
    </div>`).join('');
  };

  const updateMapTip = () => {
    const d = DATA[range];
    updateChinaAttackList(d);
    $('#tipPill').textContent = range === 30 ? '近30天' : '近90天';
    $('#tipUnknown').textContent = d.sources['未解析'].ips;
    $('#tipUnknownAlerts').textContent = d.sources['未解析'].alerts;
    mapTip.kicker.textContent = mapMode === 'world' ? '全球视角' : selectedProvince ? '区域视角' : '中国视角';
    const mapNote = document.querySelector('.map-note');
    if (mapNote) mapNote.textContent = mapMode === 'china' ? '点击省份进入省域详情 · 仅展示已解析来源' : '仅展示已解析来源 · 未解析来源单独计数';
    if (mapMode === 'world') {
      mapTip.title.textContent = '全球攻击来源';
      mapTip.sources.textContent = d.ips;
      mapTip.alerts.textContent = d.total;
      mapTip.assets.textContent = d.assets;
      setSourceBars(Object.entries(d.sources).filter(([n]) => n !== '未解析').sort((a, b) => b[1].alerts - a[1].alerts).map(([n, v]) => [n, v.alerts]));
      mapTip.action.innerHTML = '查看中国态势 <span>→</span>';
      $('#mapBreadcrumb').innerHTML = '全球 <span class="sep">/</span> 中国';
      $('#mapBack').hidden = true;
    } else if (selectedProvince) {
      const val = d.provinces[selectedProvince] || 0;
      const meta = PROVINCE_META[selectedProvince] || { city: '', top: [['未解析', 1]] };
      mapTip.title.textContent = `${selectedProvince}${meta.city ? ' · ' + meta.city : ''}`;
      mapTip.sources.textContent = val ? Math.max(1, Math.round(val * 0.34)) : 0;
      mapTip.alerts.textContent = val;
      mapTip.assets.textContent = val ? Math.max(1, Math.round(val * 0.1)) : 0;
      setSourceBars(meta.top);
      mapTip.action.innerHTML = '查看该省告警 <span>→</span>';
      $('#mapBreadcrumb').innerHTML = `中国 <span class="sep">/</span> <b>${esc(selectedProvince)}</b>`;
      $('#mapBack').hidden = false;
    } else {
      mapTip.title.textContent = '中国 · 攻击目标';
      mapTip.sources.textContent = d.ips;
      mapTip.alerts.textContent = d.total;
      mapTip.assets.textContent = d.assets;
      setSourceBars(Object.entries(d.provinces).sort((a, b) => b[1] - a[1]).map(([n, v]) => [n, v]));
      mapTip.action.innerHTML = '查看辽宁省 <span>→</span>';
      $('#mapBreadcrumb').innerHTML = '全球 <span class="sep">/</span> 中国';
      $('#mapBack').hidden = true;
    }
  };

  const updateChinaAttackList = (d) => {
    const rowsEl = $('#chinaAttackRows');
    if (!rowsEl) return;
    const max = Math.max(...Object.values(d.provinces), 1);
    rowsEl.innerHTML = Object.entries(d.provinces)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => `<div class="china-attack-row" data-province="${esc(name)}">
        <span>${esc(name)}<i><em style="width:${Math.max(8, Math.round(count / max * 100))}%"></em></i></span>
        <b>${fmt(count)}</b>
      </div>`).join('');
    rowsEl.onclick = (event) => {
      const row = event.target.closest?.('.china-attack-row');
      if (row?.dataset?.province) openProvinceDrawer(row.dataset.province);
    };
  };

  const provinceColor = (val, max, selected) => {
    const t = Math.min(1, val / Math.max(max, 1));
    if (selected) return 'rgba(110,190,255,.72)';
    return `rgba(${Math.round(18 + 34 * t)},${Math.round(46 + 104 * t)},${Math.round(82 + 158 * t)},${0.26 + 0.42 * t})`;
  };

  const buildWorldOption = () => {
    const d = DATA[range];
    const sourceEntries = Object.entries(d.sources).filter(([name, v]) => name !== '未解析' && v.coord);
    const sourcePoints = sourceEntries.map(([name, v]) => ({
      name,
      value: [...v.coord, v.ips, v.alerts],
      label: { show: false },
    }));
    const compact2d = window.innerWidth < 1400;
    const targetPoints = Object.entries(d.targets).map(([name, val]) => ({
      name,
      value: [...CITIES[name].coord, val],
      label: {
        show: true,
        position: name === '北京' ? 'left' : name === '上海' ? 'bottom' : 'top',
        offset: name === '北京' ? [-28, -22] : name === '上海' ? [30, 26] : [26, -22],
        distance: 10,
        color: '#f0fbff',
        fontSize: compact2d ? 12 : 13,
        fontFamily: 'PingFang SC',
        fontWeight: 600,
        textBorderColor: 'rgba(2,10,22,.95)',
        textBorderWidth: 3,
        textShadowColor: 'rgba(47,125,255,.65)',
        textShadowBlur: 8,
      },
    }));
    const linePairs = [
      ['美国', '北京'], ['美国', '上海'], ['德国', '上海'], ['德国', '北京'],
      ['荷兰', '北京'], ['新加坡', '沈阳'], ['日本', '沈阳'], ['巴西', '上海'],
    ];
    const linePalette = ['rgba(47,125,255,.8)', 'rgba(67,180,255,.72)', 'rgba(107,140,255,.72)', 'rgba(74,168,255,.7)'];
    const lineData = linePairs.map(([a, b], i) => {
      const s = d.sources[a];
      const t = CITIES[b];
      return { coords: [s.coord, t.coord], lineStyle: { color: linePalette[i % linePalette.length] } };
    });
    return {
      animationDuration: 1000,
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        confine: true,
        backgroundColor: 'rgba(3,14,26,.94)',
        borderColor: 'rgba(74,210,240,.35)',
        borderWidth: 1,
        textStyle: { color: '#dff8ff', fontSize: 14, fontFamily: 'PingFang SC' },
        formatter: (p) => {
          if (p.seriesType === 'lines') return '';
          const name = p.name || '';
          const src = d.sources[name];
          if (src) return `<b>${esc(name)}</b><br/><span style="color:#8fb8ca">攻击源 ${src.ips} · 告警 ${src.alerts}</span>`;
          const t = d.targets[name];
          if (t) return `<b>${esc(name)}</b><br/><span style="color:#8fb8ca">受攻击 ${t} 次</span>`;
          if (name === 'China') return '<b>中国</b><br/><span style="color:#8fb8ca">点击查看中国态势</span>';
          return '';
        },
      },
      geo: {
        map: 'world',
        roam: true,
        silent: false,
        zoom: mapZoom || (window.innerWidth < 1400 ? 1.46 : window.innerWidth < 1600 ? 1.36 : 1.3),
        scaleLimit: { min: 0.8, max: 3.5 },
        center: [10, 27],
        layoutCenter: ['57%', '52%'],
        layoutSize: window.innerWidth < 1400 ? '104%' : '100%',
        boundingCoords: [[-180, 78], [180, -58]],
        itemStyle: {
          areaColor: 'rgba(10,24,46,.7)',
          borderColor: 'rgba(74,180,215,.18)',
          borderWidth: 0.8,
          shadowColor: 'rgba(0,18,55,.52)',
          shadowBlur: 18,
          shadowOffsetY: 8,
        },
        emphasis: {
          itemStyle: { areaColor: 'rgba(20,80,110,.5)' },
          label: { show: false },
        },
        regions: [
          { name: 'China', itemStyle: { areaColor: 'rgba(30,105,235,.9)', borderColor: 'rgba(190,232,255,1)', borderWidth: 1.25, shadowColor: 'rgba(130,200,255,.7)', shadowBlur: 30 } },
          { name: 'United States', itemStyle: { areaColor: 'rgba(25,42,68,.6)' } },
          { name: 'Germany', itemStyle: { areaColor: 'rgba(25,42,68,.55)' } },
          { name: 'Singapore', itemStyle: { areaColor: 'rgba(25,42,68,.55)' } },
          { name: 'Japan', itemStyle: { areaColor: 'rgba(25,42,68,.55)' } },
        ],
      },
      series: [
        {
          type: 'lines',
          coordinateSystem: 'geo',
          zlevel: 2,
          silent: true,
          lineStyle: { width: 4, opacity: 0.055, curveness: 0.3, color: '#2f7dff', shadowBlur: 12, shadowColor: 'rgba(47,125,255,.28)' },
          data: lineData,
        },
        {
          type: 'lines',
          coordinateSystem: 'geo',
          zlevel: 3,
          silent: true,
          effect: { show: !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches), period: 3.6, trailLength: 0.65, symbol: 'circle', symbolSize: 4.2, color: '#dff8ff' },
          lineStyle: { width: 1.25, opacity: 0.78, curveness: 0.3, shadowBlur: 3, shadowColor: 'rgba(47,125,255,.3)' },
          data: lineData,
        },
        {
          type: 'scatter',
          coordinateSystem: 'geo',
          zlevel: 4,
          symbol: 'diamond',
          symbolSize: 9,
          itemStyle: { color: '#ff6f8d', borderColor: 'rgba(255,190,200,.75)', borderWidth: 1, shadowColor: '#ff5c7a', shadowBlur: 10 },
          label: {
            show: true,
            distance: 7,
            formatter: (p) => `{n|${p.name}}\n{v|${p.value[2]} 个}`,
            rich: {
              n: { color: '#ffc1cc', fontSize: 13, fontFamily: 'PingFang SC', lineHeight: 15 },
              v: { color: '#ff9db0', fontSize: 14, fontFamily: 'Rajdhani', fontWeight: 600, lineHeight: 14 },
            },
          },
          labelLayout: { hideOverlap: true },
          data: sourcePoints,
        },
        {
          type: 'effectScatter',
          coordinateSystem: 'geo',
          zlevel: 4,
          symbol: 'circle',
          symbolSize: 7,
          rippleEffect: { brushType: 'stroke', scale: 2.4, period: 3.8 },
          itemStyle: { color: '#ff7a92', shadowColor: '#ff5c7a', shadowBlur: 14, borderColor: '#ffd0d8', borderWidth: 1 },
          label: { show: false },
          data: sourcePoints,
        },
        {
          id: 'china-source-points',
          type: 'effectScatter',
          coordinateSystem: 'geo',
          zlevel: 0,
          data: sourcePoints,
          symbolSize: 4,
          itemStyle: { color: '#58c8ff', shadowColor: '#58c8ff', shadowBlur: 5, borderColor: '#dffbff', borderWidth: 0.5 },
          label: { show: false },
        },
        {
          id: 'china-target-points',
          type: 'effectScatter',
          coordinateSystem: 'geo',
          zlevel: 0,
          symbol: 'circle',
          symbolSize: 10,
          rippleEffect: { brushType: 'stroke', scale: 3.4, period: 4.2 },
          itemStyle: { color: '#a5dcff', shadowColor: '#a5dcff', shadowBlur: 30, borderColor: '#eef6ff', borderWidth: 1 },
          label: {
            show: true,
            distance: 8,
            formatter: (p) => p.name,
            color: '#f0fbff',
            fontSize: 14,
            fontFamily: 'PingFang SC',
            fontWeight: 600,
            textBorderColor: 'rgba(2,10,22,.95)',
            textBorderWidth: 3,
            textShadowColor: 'rgba(47,125,255,.65)',
            textShadowBlur: 8,
          },
          labelLayout: { hideOverlap: true, moveOverlap: 'shiftY' },
          data: targetPoints,
        },
      ],
    };
  };

  const chinaLinePalettes = [
    ['rgba(35,80,255,.22)', '#3d7bff', '#47d8ff', '#e9ffff'],
    ['rgba(35,80,255,.12)', '#4f9aff', '#7feaff', '#ffffff'],
    ['rgba(55,140,255,.24)', '#6a7dff', '#56e6ff', '#ffffff'],
    ['rgba(35,80,255,.16)', '#2f8fff', '#a5f5ff', '#ffffff'],
  ];
  let chinaLineRhythmTimer = null;
  let chinaLineRhythmIndex = 0;
  const chinaLineGradient = (index = 0) => {
    const c = chinaLinePalettes[index % chinaLinePalettes.length];
    return new echarts.graphic.LinearGradient(0, 0, 1, 0, [
      { offset: 0, color: c[0] },
      { offset: 0.26, color: c[1] },
      { offset: 0.62, color: c[2] },
      { offset: 0.86, color: '#d9fbff' },
      { offset: 1, color: c[3] },
    ]);
  };
  const stopChinaLineRhythm = () => {
    if (chinaLineRhythmTimer) { window.clearInterval(chinaLineRhythmTimer); chinaLineRhythmTimer = null; }
  };
  const startChinaLineRhythm = () => {
    stopChinaLineRhythm();
    if (!mapChart) return;
    chinaLineRhythmTimer = window.setInterval(() => {
      if (!mapChart || mapMode !== 'china' || !document.body.classList.contains('map-2d')) return;
      chinaLineRhythmIndex = (chinaLineRhythmIndex + 1) % chinaLinePalettes.length;
      mapChart.setOption({
        series: [
          { id: 'china-attack-lines', lineStyle: { color: chinaLinePalettes[chinaLineRhythmIndex][1], shadowBlur: 0 }, effect: { color: chinaLinePalettes[chinaLineRhythmIndex][3] } },
          { id: 'china-attack-lines-tail', lineStyle: { color: chinaLinePalettes[chinaLineRhythmIndex][2], shadowBlur: 0 } },
        ],
      });
    }, 540);
  };

  const buildChinaOption = () => {
    const d = DATA[range];
    const maxProvince = Math.max(...Object.values(d.provinces), 1);
    const regions = Object.keys(PROVINCE_META).map((name) => {
      const val = d.provinces[name] || 0;
      const isSel = name === selectedProvince;
      return {
        name,
        itemStyle: {
          areaColor: provinceColor(val, maxProvince, isSel),
          borderColor: isSel ? 'rgba(220,255,255,.95)' : 'rgba(80,180,255,.26)',
          borderWidth: isSel ? 1.4 : 0.9,
          shadowColor: 'rgba(74,168,255,.55)',
          shadowBlur: isSel ? 22 : 9,
        },
      };
    });
    const targetPoints = Object.entries(d.targets).map(([name, val]) => ({
      name,
      value: [...CITIES[name].coord, val],
      label: {
        show: name === '沈阳',
        position: 'top',
        distance: 10,
        color: '#f0fbff',
        fontSize: 15,
        fontFamily: 'PingFang SC',
        fontWeight: 600,
        textBorderColor: 'rgba(2,10,22,.95)',
        textBorderWidth: 3,
        textShadowColor: 'rgba(47,125,255,.65)',
        textShadowBlur: 8,
      },
    }));
    const provinceCityCoords = {
      '辽宁省': [123.431, 41.805], '山东省': [117.12, 36.65], '四川省': [104.066, 30.572], '湖北省': [114.305, 30.593],
      '江苏省': [118.797, 32.06], '浙江省': [120.155, 30.274], '福建省': [119.296, 26.074],
      '广东省': [113.264, 23.129],
    };
    // 只画国内攻击链路：国内攻击方 → 北京/上海/沈阳
    const lineData = CHINA_CITY_SOURCES.map((source) => {
      const target = CITIES[source.target];
      return target ? { coords: [source.coord, target.coord], value: source.count } : null;
    }).filter(Boolean);
    const sourcePoints = CHINA_CITY_SOURCES.map((source) => ({
      name: source.name,
      value: [...source.coord, source.count],
    }));
    const lerpCoord = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    const tailLines = [];
    const headLines = [];
    CHINA_CITY_SOURCES.forEach((source) => {
      const target = CITIES[source.target];
      if (!target) return;
      tailLines.push({ coords: [lerpCoord(source.coord, target.coord, .58), target.coord] });
      headLines.push({ coords: [lerpCoord(source.coord, target.coord, .82), target.coord] });
    });
    return {
      animationDuration: 900,
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        confine: true,
        backgroundColor: 'rgba(3,14,26,.94)',
        borderColor: 'rgba(74,210,240,.35)',
        borderWidth: 1,
        textStyle: { color: '#dff8ff', fontSize: 14, fontFamily: 'PingFang SC' },
        formatter: (p) => {
          if (p.seriesType === 'effectScatter') return `<b>${esc(p.name)}</b><br/><span style="color:#8fb8ca">受攻击 ${p.value[2]} 次</span>`;
          const val = d.provinces[p.name];
          if (val) return `<b>${esc(p.name)}</b><br/><span style="color:#8fb8ca">告警 ${val} 次 · 点击下钻</span>`;
          return `<b>${esc(p.name || '')}</b>`;
        },
      },
      geo: {
        map: 'china',
        roam: true,
        zlevel: 0,
        silent: false,
        zoom: mapZoom || (window.innerWidth < 1400 ? 1.36 : window.innerWidth < 1600 ? 1.28 : 1.18),
        center: [104, 36.5],
        layoutCenter: ['50%', '52%'],
        layoutSize: window.innerWidth < 1400 ? '102%' : '96%',
        scaleLimit: { min: 0.8, max: 3.5 },
        itemStyle: {
          areaColor: 'rgba(12,42,80,.82)',
          borderColor: 'rgba(74,168,255,.45)',
          borderWidth: 1,
          shadowColor: 'rgba(0,20,60,.6)',
          shadowBlur: 18,
          shadowOffsetY: 8,
        },
        emphasis: {
          itemStyle: { areaColor: 'rgba(30,110,190,.45)' },
          label: { show: true, color: '#dff8ff', fontSize: 13, fontFamily: 'PingFang SC' },
        },
        select: { itemStyle: { areaColor: 'rgba(74,168,255,.55)' } },
        label: { show: true, color: '#dff8ff', fontSize: 14, fontFamily: 'PingFang SC', textBorderColor: 'rgba(2,10,22,.9)', textBorderWidth: 2 },
        regions,
      },
      series: [
        {
          id: 'china-attack-lines',
          type: 'lines',
          coordinateSystem: 'geo',
          zlevel: 0,
          silent: true,
          animationDuration: 900,
          animationDurationUpdate: 720,
          animationEasing: 'cubicInOut',
          animationEasingUpdate: 'cubicInOut',
          lineStyle: { width: 1.3, opacity: 0.9, curveness: 0.32, color: '#2f7dff', shadowBlur: 0, shadowColor: 'transparent', cap: 'round' },
          effect: { show: !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches), period: 4.6, trailLength: 0.55, symbol: 'circle', symbolSize: 2.8, color: '#eaffff' },
          data: lineData,
        },
        {
          id: 'china-attack-lines-tail',
          type: 'lines',
          coordinateSystem: 'geo',
          zlevel: 0,
          silent: true,
          lineStyle: { width: 0.95, opacity: 0.62, curveness: 0.32, color: '#58cfff', shadowBlur: 0, shadowColor: 'transparent', cap: 'round' },
          data: tailLines,
        },
        {
          id: 'china-attack-lines-head',
          type: 'lines',
          coordinateSystem: 'geo',
          zlevel: 0,
          silent: true,
          lineStyle: { width: 0.55, opacity: 0.7, curveness: 0.32, color: '#f0ffff', shadowBlur: 0, shadowColor: 'transparent', cap: 'round' },
          data: headLines,
        },
        {
          id: 'china-source-points',
          type: 'effectScatter',
          coordinateSystem: 'geo',
          zlevel: 0,
          data: sourcePoints,
          symbolSize: 4,
          itemStyle: { color: '#58c8ff', shadowColor: '#58c8ff', shadowBlur: 5, borderColor: '#dffbff', borderWidth: 0.5 },
          label: { show: false },
        },
        {
          id: 'china-target-points',
          type: 'effectScatter',
          coordinateSystem: 'geo',
          zlevel: 0,
          symbol: 'circle',
          symbolSize: 10,
          rippleEffect: { brushType: 'stroke', scale: 2.6, period: 4.2 },
          itemStyle: { color: '#ffb45e', shadowColor: '#ffb45e', shadowBlur: 12, borderColor: '#eef6ff', borderWidth: 1 },
          label: {
            show: true,
            distance: 8,
            formatter: (p) => p.name,
            color: '#f0fbff',
            fontSize: 14,
            fontFamily: 'PingFang SC',
            fontWeight: 600,
            textBorderColor: 'rgba(2,10,22,.95)',
            textBorderWidth: 3,
            textShadowColor: 'rgba(47,125,255,.65)',
            textShadowBlur: 8,
          },
          labelLayout: { hideOverlap: true },
          data: targetPoints,
        },
      ],
    };
  };

  const provinceCenter = (name) => {
    const f = geoChina?.features?.find((x) => x.properties.name === name);
    const c = f?.properties?.centroid || f?.properties?.center || [104, 35];
    return c;
  };

  const loadProvince2D = async (name) => {
    const f = geoChina?.features?.find((x) => x.properties.name === name);
    const code = String(f?.properties?.adcode || '');
    if (!code) return false;
    provinceAdcode = code;
    try {
      const data = await fetch(`https://geo.datav.aliyun.com/areas_v3/bound/${code}_full.json`, { cache: 'force-cache' }).then((r) => r.json());
      if (!data?.features?.length) throw new Error('empty');
      geoProvince = data;
      echarts.registerMap(`province-${code}`, data);
      return true;
    } catch {
      geoProvince = null;
      return false;
    }
  };

  const buildProvinceOption = () => {
    const d = DATA[range];
    const name = selectedProvince;
    const center = provinceCenter(name);
    const lineData = [];
    return {
      animationDuration: 700,
      backgroundColor: 'transparent',
      tooltip: { trigger: 'item', confine: true, backgroundColor: 'rgba(3,14,26,.94)', borderColor: 'rgba(74,210,240,.35)', borderWidth: 1, textStyle: { color: '#dff8ff', fontSize: 14 } },
      geo: {
        map: `province-${provinceAdcode}`,
        roam: true,
        zlevel: 0,
        zoom: 1.05,
        layoutCenter: ['50%', '51%'],
        layoutSize: '82%',
        scaleLimit: { min: 0.7, max: 3.2 },
        itemStyle: {
          areaColor: '#1768a2',
          borderColor: 'rgba(210,251,255,.9)',
          borderWidth: 1.2,
          shadowColor: 'rgba(46,194,235,.16)',
          shadowBlur: 10,
        },
        emphasis: { itemStyle: { areaColor: '#278bc8' }, label: { show: true, color: '#fff' } },
        label: { show: true, color: '#eafcff', fontSize: 14, fontFamily: 'PingFang SC', textBorderColor: 'rgba(0,10,18,.9)', textBorderWidth: 2 },
      },
      series: [
        {
          type: 'lines', coordinateSystem: 'geo', zlevel: 0, silent: true,
          data: lineData,
          lineStyle: { width: 2.1, opacity: .92, curveness: .2, color: chinaLineGradient(0), shadowBlur: 0 },
          effect: { show: !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches), period: 4.8, trailLength: .55, symbol: 'circle', symbolSize: 4, color: '#eaffff' },
        },
        {
          type: 'effectScatter', coordinateSystem: 'geo', zlevel: 0,
          data: [{ name: selectedProvince, value: [...center, d.provinces[name] || 0] }],
          symbolSize: 10,
          itemStyle: { color: '#a5dcff', shadowColor: '#73c7ff', shadowBlur: 18, borderColor: '#eef6ff', borderWidth: 1 },
          label: { show: true, position: 'right', formatter: (p) => p.name, color: '#f0fbff', fontSize: 15, fontWeight: 600, textBorderColor: 'rgba(2,10,22,.95)', textBorderWidth: 3 },
        },
      ],
    };
  };

  let attackCanvas = null;
  let attackCtx = null;
  let attackRaf = 0;
  let attackDpr = 1;

  const stopAttackCanvas = () => {
    if (attackRaf) cancelAnimationFrame(attackRaf);
    attackRaf = 0;
    if (attackCtx && attackCanvas) attackCtx.clearRect(0, 0, attackCanvas.width, attackCanvas.height);
  };

  const drawAttackCanvas = (time = performance.now()) => {
    if (!mapChart || mapMode !== 'china' || selectedProvince || !document.body.classList.contains('map-2d')) return;
    if (!attackCanvas) attackCanvas = $('#mapAttackCanvas');
    if (!attackCanvas) return;
    const w = mapChart.getWidth();
    const h = mapChart.getHeight();
    attackDpr = Math.min(2, window.devicePixelRatio || 1);
    if (attackCanvas.width !== Math.round(w * attackDpr) || attackCanvas.height !== Math.round(h * attackDpr)) {
      attackCanvas.width = Math.round(w * attackDpr);
      attackCanvas.height = Math.round(h * attackDpr);
      attackCanvas.style.width = w + 'px';
      attackCanvas.style.height = h + 'px';
    }
    attackCtx = attackCanvas.getContext('2d');
    if (!attackCtx) return;
    attackCtx.setTransform(attackDpr, 0, 0, attackDpr, 0, 0);
    attackCtx.clearRect(0, 0, w, h);
    attackCtx.lineCap = 'round';
    const t = time / 1000;
    CHINA_CITY_SOURCES.forEach((source, index) => {
      const target = CITIES[source.target];
      if (!target) return;
      const a = mapChart.convertToPixel({ geoIndex: 0 }, source.coord);
      const b = mapChart.convertToPixel({ geoIndex: 0 }, target.coord);
      if (!a || !b) return;
      const sx = a[0], sy = a[1], tx = b[0], ty = b[1];
      const dx = tx - sx, dy = ty - sy;
      const cx = (sx + tx) / 2 - dy * 0.16;
      const cy = (sy + ty) / 2 + dx * 0.16;
      const grad = attackCtx.createLinearGradient(sx, sy, tx, ty);
      grad.addColorStop(0, 'rgba(38,90,255,.72)');
      grad.addColorStop(.42, 'rgba(59,150,255,.82)');
      grad.addColorStop(.72, 'rgba(67,210,255,.88)');
      grad.addColorStop(1, 'rgba(137,244,255,.95)');
      attackCtx.strokeStyle = grad;
      attackCtx.lineWidth = 2.6;
      attackCtx.globalAlpha = .85;
      attackCtx.beginPath();
      attackCtx.moveTo(sx, sy);
      attackCtx.quadraticCurveTo(cx, cy, tx, ty);
      attackCtx.stroke();
      const tt = (t * .20 + index * .13) % 1;
      const px = (1 - tt) * (1 - tt) * sx + 2 * (1 - tt) * tt * cx + tt * tt * tx;
      const py = (1 - tt) * (1 - tt) * sy + 2 * (1 - tt) * tt * cy + tt * tt * ty;
      attackCtx.globalAlpha = .95;
      attackCtx.fillStyle = '#a8f6ff';
      attackCtx.beginPath();
      attackCtx.arc(px, py, 2.2, 0, Math.PI * 2);
      attackCtx.fill();
    });
    attackCtx.globalAlpha = 1;
  };

  const startAttackCanvas = () => {
    if (!attackCanvas) attackCanvas = $('#mapAttackCanvas');
    if (attackRaf) cancelAnimationFrame(attackRaf);
    const loop = (time) => {
      if (!document.body.classList.contains('map-2d') || mapMode !== 'china' || selectedProvince) {
        attackRaf = 0;
        return;
      }
      drawAttackCanvas(time);
      attackRaf = requestAnimationFrame(loop);
    };
    attackRaf = requestAnimationFrame(loop);
  };

  const drawSouthSeaInset = () => {
    if (!southSeaGeo) return;
    const canvas = $('#southSeaCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const cw = 292, ch = 364;
    canvas.width = cw * dpr; canvas.height = ch * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cw, ch);
    const pts = [];
    const walk = (v) => {
      if (typeof v?.[0] === 'number' && typeof v?.[1] === 'number') pts.push(v);
      else if (Array.isArray(v)) v.forEach(walk);
    };
    walk(southSeaGeo.geometry?.coordinates);
    if (!pts.length) return;
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const pad = 24;
    const sx = (cw - pad * 2) / Math.max(maxX - minX, 0.001);
    const sy = (ch - pad * 2) / Math.max(maxY - minY, 0.001);
    const scale = Math.min(sx, sy);
    const ox = (cw - (maxX - minX) * scale) / 2;
    const oy = (ch - (maxY - minY) * scale) / 2;
    const px = (lon, lat) => [ox + (lon - minX) * scale, ch - (oy + (lat - minY) * scale)];
    const raw = southSeaGeo.geometry?.type === 'Polygon' ? [southSeaGeo.geometry.coordinates] : (southSeaGeo.geometry?.coordinates || []);
    ctx.setLineDash([3, 3]);
    raw.forEach((poly) => {
      poly.forEach((ring) => {
        if (!ring?.length) return;
        ctx.beginPath();
        ring.forEach(([lon, lat], i) => {
          const [x, y] = px(lon, lat);
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        });
        ctx.closePath();
        ctx.fillStyle = 'rgba(31,103,155,.18)';
        ctx.strokeStyle = 'rgba(134,231,255,.9)';
        ctx.lineWidth = 1.25;
        ctx.fill(); ctx.stroke();
      });
    });
    ctx.setLineDash([]);
    const islands = [
      ['东沙群岛', 116.7, 20.7, 2.1],
      ['西沙群岛', 112.2, 16.4, 2.5],
      ['中沙群岛', 114.4, 15.2, 2.0],
      ['南沙群岛', 114.2, 9.8, 2.8],
      ['曾母暗沙', 112.3, 3.9, 1.6],
    ];
    islands.forEach(([, lon, lat, r]) => {
      const [x, y] = px(lon, lat);
      ctx.fillStyle = 'rgba(215,251,255,.98)';
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(76,218,248,.9)'; ctx.lineWidth = .8; ctx.stroke();
    });
    const labels = [['东沙',116.7,20.7],['西沙',112.2,16.4],['中沙',114.4,15.2],['南沙',114.2,9.8]];
    ctx.font = '14px "PingFang SC", sans-serif'; ctx.textAlign = 'center';
    labels.forEach(([name, lon, lat]) => {
      const [x, y] = px(lon, lat);
      ctx.fillStyle = 'rgba(185,235,247,.92)';
      ctx.fillText(name, x, y - 6);
    });
  };

  const renderMap = () => {
    if (!mapChart) return;
    $('.map-body').classList.toggle('china', mapMode === 'china');
    const option = mapMode === 'world' ? buildWorldOption() : (selectedProvince && geoProvince ? buildProvinceOption() : buildChinaOption());
    if (mapMode === 'china' && !selectedProvince && Array.isArray(option.series)) {
      option.series = option.series.filter((series) => series.type !== 'lines');
    }
    mapChart.setOption(option, true);
    if (mapMode === 'china' && !selectedProvince) startAttackCanvas(); else stopAttackCanvas();
    if (mapMode === 'china') startChinaLineRhythm(); else stopChinaLineRhythm();
    updateMapTip();
    drawSouthSeaInset();
    const back = $('#map2dBack');
    if (back) {
      back.textContent = '‹ 返回地球';
      back.hidden = !!selectedProvince;
      back.style.display = selectedProvince ? 'none' : '';
    }
    document.body.classList.toggle('province-2d', !!selectedProvince && document.body.classList.contains('map-2d'));
  };

  const CITY_TO_PROVINCE = { '北京': '北京市', '上海': '上海市', '沈阳': '辽宁省' };

  const selectProvince = async (name) => {
    if (!PROVINCE_META[name]) {
      toast(`${name} · 暂无重点保障数据`);
      return;
    }
    selectedProvince = name;
    mapMode = 'china';
    mapZoom = null;
    $$('.map-btn').forEach((b) => b.classList.toggle('active', b.dataset.map === 'china'));
    await loadProvince2D(name);
    renderMap();
  };

  const setMapMode = (mode) => {
    mapMode = mode;
    selectedProvince = null;
    mapZoom = null;
    $$('.map-btn').forEach((b) => b.classList.toggle('active', b.dataset.map === mode));
    renderMap();
  };

  if (mapTip.action) {
    mapTip.action.addEventListener('click', () => {
      if (mapMode === 'world') {
        setMapMode('china');
      } else if (!selectedProvince) {
        selectProvince('辽宁省');
      } else {
        openProvinceDrawer(selectedProvince);
      }
    });
  }

  const mapBackEl = $('#mapBack');
  if (mapBackEl) mapBackEl.addEventListener('click', () => {
    if (selectedProvince) {
      selectedProvince = null;
      renderMap();
    } else {
      setMapMode('world');
    }
  });

  const zoomMap = (factor) => {
    const base = mapZoom || (mapMode === 'china' ? 1.02 : 1.18);
    mapZoom = Math.min(3.5, Math.max(0.8, base * factor));
    renderMap();
  };
  const mapZoomInEl = $('#mapZoomIn');
  const mapZoomOutEl = $('#mapZoomOut');
  const mapResetEl = $('#mapReset');
  if (mapZoomInEl) mapZoomInEl.addEventListener('click', () => zoomMap(1.2));
  if (mapZoomOutEl) mapZoomOutEl.addEventListener('click', () => zoomMap(1 / 1.2));
  if (mapResetEl) mapResetEl.addEventListener('click', () => { mapZoom = null; renderMap(); });

  $$('.map-btn').forEach((b) => b.addEventListener('click', () => setMapMode(b.dataset.map)));

  const initMaps = async () => {
    try {
      const [china, world] = await Promise.all([
        window.CHINA_GEO ? Promise.resolve(window.CHINA_GEO) : fetch('assets/china.json').then((r) => r.json()),
        window.WORLD_GEO ? Promise.resolve(window.WORLD_GEO) : fetch('assets/world.json').then((r) => r.json()),
      ]);
      geoChina = china;
      geoWorld = world;
      const jd = (china.features || []).find((f) => f?.properties?.adcode === '100000_JD');
      if (jd) {
        southSeaGeo = jd;
        china.features = china.features.filter((f) => f?.properties?.adcode !== '100000_JD');
      }
      echarts.registerMap('china', china);
      echarts.registerMap('world', world);
      const mapEl = $('#mapChart');
      if (mapEl && (!mapEl.clientWidth || !mapEl.clientHeight)) {
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      }
      mapChart = echarts.init(mapEl || $('#mapChart'), null, { renderer: 'canvas' });
      mapEl?.addEventListener('wheel', (e) => e.preventDefault(), { passive: false });
      chartClick();
      $$('.map-btn').forEach((b) => b.classList.toggle('active', b.dataset.map === mapMode));
      renderMap();
      window.__SOC_2D__ = {
        show() {
          if (!mapChart) return;
          mapChart.resize();
          renderMap();
        },
        hide() { stopChinaLineRhythm(); stopAttackCanvas(); if (mapChart) mapChart.getZr().animation.stop(); },
        resize() { if (mapChart) mapChart.resize(); },
      };
      if (document.body.classList.contains('map-2d') && mapChart) {
        requestAnimationFrame(() => { mapChart.resize(); renderMap(); });
      }
    } catch (e) {
      console.error('map init failed', e);
      const el = $('#mapChart');
      el.innerHTML = '<div style="padding:80px;text-align:center;color:#5b8ba1;font-size:12px">地图数据加载失败</div>';
    }
  };

  const hideAttackPopup = () => {
    const el = $('#attackPopup');
    if (el) el.hidden = true;
  };

  const showAttackPopup = (p) => {
    const el = $('#attackPopup');
    if (!el) return;
    const kicker = $('#attackPopupKicker');
    const title = $('#attackPopupTitle');
    const body = $('#attackPopupBody');
    if (!kicker || !title || !body) return;
    const value = Array.isArray(p.value) ? p.value : [];
    if (p.seriesId === 'china-source-points') {
      const source = CHINA_CITY_SOURCES.find((x) => x.name === p.name);
      if (!source) return;
      kicker.textContent = '攻击方 · 国内来源';
      title.textContent = source.name;
      body.innerHTML = `发起攻击 <b>${source.count} 次</b><span class="path">${esc(source.name)}<i></i>${esc(source.target)}</span><span class="path" style="color:#6f9bad;margin-top:6px">点击右侧列表可查看重点区域</span>`;
    } else if (p.seriesId === 'china-target-points') {
      const hits = CHINA_CITY_SOURCES.filter((x) => x.target === p.name);
      const total = DATA[range].targets[p.name] || (value[2] || 0);
      kicker.textContent = '被攻击城市';
      title.textContent = p.name;
      body.innerHTML = `累计告警 <b>${fmt(total)} 次</b><br>国内攻击来源 <b>${hits.length}</b> 个城市<span class="path">${hits.slice(0, 4).map((x) => x.name).join(' · ') || '暂无'}</span>`;
    } else {
      return;
    }
    el.hidden = false;
    const bodyRect = $('.map-body')?.getBoundingClientRect();
    const chartRect = $('#mapChart')?.getBoundingClientRect();
    const offsetX = p.event?.offsetX ?? (chartRect ? chartRect.width / 2 : 120);
    const offsetY = p.event?.offsetY ?? (chartRect ? chartRect.height / 2 : 120);
    const left = Math.max(8, Math.min((bodyRect?.width || 600) - 226, offsetX + 12));
    const top = Math.max(8, Math.min((bodyRect?.height || 400) - 150, offsetY + 12));
    el.style.left = left + 'px';
    el.style.top = top + 'px';
  };

  $('#attackPopupClose')?.addEventListener('click', hideAttackPopup);

  const chartClick = () => {
    mapChart.on('click', (p) => {
      if (p.seriesId === 'china-source-points' || p.seriesId === 'china-target-points') {
        showAttackPopup(p);
        return;
      }
      hideAttackPopup();
      if (mapMode === 'world') {
        if (p.name === 'China' || p.name === '中国') setMapMode('china');
        else {
          const s = DATA[range].sources[p.name];
          if (s) openCountryDrawer(p.name, s);
        }
      } else {
        // 2D 中国只作为态势总览，不再进入省图
      }
    });
  };

  const map2dBackEl = $('#map2dBack');
  if (map2dBackEl) map2dBackEl.addEventListener('click', () => {
    mapZoom = null;
    if (selectedProvince) {
      selectedProvince = null;
      geoProvince = null;
      mapMode = 'china';
      renderMap();
      return;
    }
    window.__SOC_EXIT_2D__?.();
  });

  /* ------------------------------------------------------------------ */
  /* Drawer                                                             */
  /* ------------------------------------------------------------------ */

  const drawer = $('#drawer');
  const scrim = $('#scrim');
  const drawerTitle = $('#drawerTitle');
  const drawerKicker = $('#drawerKicker');
  const drawerBadges = $('#drawerBadges');
  const drawerStats = $('#drawerStats');
  const drawerTable = $('#drawerTable');
  const drawerAction = $('#drawerAction');

  const closeDrawer = () => {
    drawer.classList.remove('open');
    scrim.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
  };
  $('#drawerClose').addEventListener('click', closeDrawer);
  $('#drawerCancel').addEventListener('click', closeDrawer);
  scrim.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDrawer(); });

  const showDrawer = () => {
    drawer.classList.add('open');
    scrim.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
  };

  const drawerAlertRows = (prefix = '') => [
    { t: '10:13', name: '数据库注入 · 生产区核心网关', target: '10.48.31.73', status: '待处置', cls: '' },
    { t: '09:58', name: '暴力破解 · 上海办公网出口', target: '198.51.100.42', status: '处置中', cls: 'doing' },
    { t: '09:31', name: '网站探测 · 邮件安全网关', target: '10.48.31.26', status: '已处置', cls: 'ok' },
    { t: '09:02', name: '端口扫描 · 运维堡垒机', target: '10.48.31.9', status: '已处置', cls: 'ok' },
    { t: '08:44', name: '异常登录 · 财务系统前置机', target: '10.48.31.18', status: '待处置', cls: '' },
  ];

  const openIpDrawer = (item) => {
    if (!item) return;
    drawerKicker.textContent = '攻击源详情';
    drawerTitle.textContent = item.ip;
    drawerBadges.innerHTML = `<span class="sev ${item.unresolved ? 'mid' : 'high'}">${item.unresolved ? '未解析' : '境外来源'}</span><span class="status">${item.unresolved ? '待研判' : '待处置'}</span>`;
    drawerStats.innerHTML = `
      <div class="dstat"><span>归属地</span><b>${esc(item.region)}</b></div>
      <div class="dstat"><span>攻击类型</span><b>${esc(item.type)}</b></div>
      <div class="dstat"><span>关联告警</span><b>${item.count} 条</b></div>
      <div class="dstat"><span>最近攻击</span><b>今日 10:13:27</b></div>`;
    drawerTable.innerHTML = val ? drawerAlertRows().map((x) => `<div class="drow">
      <span class="dt">${x.t}</span><span class="dname">${esc(x.name)}</span><span class="dtarget">${esc(x.target)}</span>
      <span class="dstatus ${x.cls}"><i></i>${esc(x.status)}</span>
    </div>`).join('') : '<div class="drow"><span class="dname">暂无重点告警</span></div>';
    drawerAction.innerHTML = '查看全部告警 <span>→</span>';
    showDrawer();
  };

  const openHoneypotDrawer = (item) => {
    if (!item) return;
    drawerKicker.textContent = '蜜罐捕获详情';
    drawerTitle.textContent = '蜜罐捕获详情';
    drawerBadges.innerHTML = `<span class="sev ${item.sevClass}">${esc(item.sev)}</span><span class="status" style="color:${item.statusClass === 'ok' ? 'var(--green)' : item.statusClass === 'doing' ? 'var(--amber)' : 'var(--red)'};border-color:currentColor">${esc(item.status)}</span>`;
    drawerStats.innerHTML = `
      <div class="dstat"><span>告警名称</span><b style="font-family:var(--cn);font-size:12px">${esc(item.title)}</b></div>
      <div class="dstat"><span>捕获时间</span><b>${esc(item.time)}</b></div>
      <div class="dstat"><span>源地址</span><b>${esc(item.src)}</b></div>
      <div class="dstat"><span>诱捕目标</span><b>${esc(item.dst)}</b></div>`;
    drawerTable.innerHTML = [
      { t: '10:13', name: '远程登录弱口令探测 · 蜜罐 03', target: item.dst, status: item.status, cls: item.statusClass },
      { t: '10:11', name: '同源地址二次探测 · 蜜罐 01', target: '10.0.50.21', status: '待处置', cls: '' },
      { t: '10:08', name: '横向扫描行为 · 蜜罐 02', target: '10.0.50.22', status: '处置中', cls: 'doing' },
    ].map((x) => `<div class="drow">
      <span class="dt">${x.t}</span><span class="dname">${esc(x.name)}</span><span class="dtarget">${esc(x.target)}</span>
      <span class="dstatus ${x.cls}"><i></i>${esc(x.status)}</span>
    </div>`).join('');
    drawerAction.innerHTML = '去处置 <span>→</span>';
    showDrawer();
  };

  const openAssetDrawer = (item) => {
    if (!item) return;
    drawerKicker.textContent = '受攻击资产';
    drawerTitle.textContent = item.name;
    drawerBadges.innerHTML = `<span class="sev ${item.level === 'high' ? 'high' : item.level === 'mid' ? 'mid' : 'low'}">${esc(item.crit)}资产</span><span class="status" style="color:var(--amber);border-color:currentColor">持续受击</span>`;
    drawerStats.innerHTML = `
      <div class="dstat"><span>资产地址</span><b>${esc(item.ip)}</b></div>
      <div class="dstat"><span>告警数</span><b>${item.count} 次</b></div>
      <div class="dstat"><span>所属部门</span><b style="font-family:var(--cn);font-size:12px">信息安全部</b></div>
      <div class="dstat"><span>最近攻击</span><b>今日 10:13:27</b></div>`;
    drawerTable.innerHTML = val ? drawerAlertRows().map((x) => `<div class="drow">
      <span class="dt">${x.t}</span><span class="dname">${esc(x.name)}</span><span class="dtarget">${esc(x.target)}</span>
      <span class="dstatus ${x.cls}"><i></i>${esc(x.status)}</span>
    </div>`).join('') : '<div class="drow"><span class="dname">暂无重点告警</span></div>';
    drawerAction.innerHTML = '查看资产详情 <span>→</span>';
    showDrawer();
  };

  const openCountryDrawer = (name, src) => {
    drawerKicker.textContent = '来源国家';
    drawerTitle.textContent = name;
    drawerBadges.innerHTML = `<span class="sev high">境外来源</span><span class="status" style="color:var(--amber);border-color:currentColor">持续活跃</span>`;
    drawerStats.innerHTML = `
      <div class="dstat"><span>攻击源</span><b>${src.ips} 个</b></div>
      <div class="dstat"><span>关联告警</span><b>${src.alerts} 条</b></div>
      <div class="dstat"><span>主要类型</span><b style="font-family:var(--cn);font-size:12px">数据库注入 / 暴力破解</b></div>
      <div class="dstat"><span>最近攻击</span><b>今日 10:13:27</b></div>`;
    drawerTable.innerHTML = val ? drawerAlertRows().map((x) => `<div class="drow">
      <span class="dt">${x.t}</span><span class="dname">${esc(x.name)}</span><span class="dtarget">${esc(x.target)}</span>
      <span class="dstatus ${x.cls}"><i></i>${esc(x.status)}</span>
    </div>`).join('') : '<div class="drow"><span class="dname">暂无重点告警</span></div>';
    drawerAction.innerHTML = '查看该国告警 <span>→</span>';
    showDrawer();
  };

  const openProvinceDrawer = (name) => {
    const val = DATA[range].provinces[name] || 0;
    const meta = PROVINCE_META[name] || {};
    drawerKicker.textContent = '重点区域';
    drawerTitle.textContent = `${name}${meta.city ? ' · ' + meta.city : ''}`;
    drawerBadges.innerHTML = `<span class="sev high">重点区域</span><span class="status" style="color:var(--amber);border-color:currentColor">持续监测</span>`;
    drawerStats.innerHTML = `
      <div class="dstat"><span>告警数</span><b>${val} 次</b></div>
      <div class="dstat"><span>攻击来源</span><b>${val ? Math.max(1, Math.round(val * 0.34)) : 0} 个</b></div>
      <div class="dstat"><span>重点资产</span><b>${val ? Math.max(1, Math.round(val * 0.1)) : 0} 个</b></div>
      <div class="dstat"><span>风险等级</span><b style="color:var(--amber)">中高</b></div>`;
    drawerTable.innerHTML = val ? drawerAlertRows().map((x) => `<div class="drow">
      <span class="dt">${x.t}</span><span class="dname">${esc(x.name)}</span><span class="dtarget">${esc(x.target)}</span>
      <span class="dstatus ${x.cls}"><i></i>${esc(x.status)}</span>
    </div>`).join('') : '<div class="drow"><span class="dname">暂无重点告警</span></div>';
    drawerAction.innerHTML = '查看该省告警 <span>→</span>';
    showDrawer();
  };

  const openTypeDrawer = (item) => {
    const d = DATA[range];
    const total = d.types.reduce((a, b) => a + b.count, 0);
    const pct = total ? (item.count / total * 100).toFixed(1) : '0.0';
    drawerKicker.textContent = '攻击告警类型';
    drawerTitle.textContent = item.name;
    drawerBadges.innerHTML = `<span class="sev ${item.side === 'end' ? 'mid' : 'high'}">${item.side === 'end' ? '终端侧' : '网络侧'}</span><span class="status">近30天</span>`;
    drawerStats.innerHTML = `
      <div class="dstat"><span>告警数</span><b>${item.count} 条</b></div>
      <div class="dstat"><span>占总量</span><b>${pct}%</b></div>
      <div class="dstat"><span>关联来源</span><b>${Math.max(1, Math.round(item.count * .35))} 个</b></div>
      <div class="dstat"><span>重点资产</span><b>${Math.max(1, Math.round(item.count * .18))} 个</b></div>`;
    drawerTable.innerHTML = d.ipsList.slice(0, 5).map((x) => `<div class="drow">
      <span class="dt">${esc(x.ip)}</span><span class="dname">${esc(x.region)}</span><span class="dtarget">${esc(x.type)}</span>
      <span class="dstatus"><i></i>${x.unresolved ? '待研判' : '待处置'}</span>
    </div>`).join('');
    drawerAction.innerHTML = '查看该类型告警 <span>→</span>';
    showDrawer();
  };

  const openKpiDrawer = (key) => {
    const d = DATA[range];
    const map = {
      total: ['告警总数', `${d.total} 条`, '近30天新增告警', d.total, d.unclosed, d.handled],
      unclosed: ['未闭环告警', `${d.unclosed} 条`, '待处置 / 处置中', d.unclosed, d.handled, d.rate],
      handled: ['已处置告警', `${d.handled} 条`, '已闭环告警', d.handled, d.total, d.rate],
      rate: ['处置率', `${d.rate}%`, '目标 85%', d.rate, d.handled, d.unclosed],
      ips: ['攻击源', `${d.ips} 个`, '境外 / 未解析', d.ips, d.total, d.assets],
      assets: ['受攻击资产', `${d.assets} 个`, '核心 / 重要资产', d.assets, d.total, d.ips],
    };
    const row = map[key] || map.total;
    drawerKicker.textContent = '态势指标';
    drawerTitle.textContent = row[0];
    drawerBadges.innerHTML = `<span class="sev high">${row[2]}</span><span class="status">近30天</span>`;
    drawerStats.innerHTML = `
      <div class="dstat"><span>当前值</span><b>${row[1]}</b></div>
      <div class="dstat"><span>告警总数</span><b>${d.total} 条</b></div>
      <div class="dstat"><span>未闭环</span><b>${d.unclosed} 条</b></div>
      <div class="dstat"><span>处置率</span><b>${d.rate}%</b></div>`;
    drawerTable.innerHTML = d.ipsList.slice(0, 5).map((x) => `<div class="drow">
      <span class="dt">${esc(x.ip)}</span><span class="dname">${esc(x.region)}</span><span class="dtarget">${esc(x.type)}</span>
      <span class="dstatus"><i></i>${x.unresolved ? '待研判' : '待处置'}</span>
    </div>`).join('');
    drawerAction.innerHTML = '查看关联告警 <span>→</span>';
    showDrawer();
  };

  const openAssetAllDrawer = () => {
    const d = DATA[range];
    drawerKicker.textContent = '受攻击资产';
    drawerTitle.textContent = '资产台账 · 全员';
    drawerBadges.innerHTML = `<span class="sev high">核心 3</span><span class="status" style="color:var(--amber);border-color:currentColor">重要 4</span><span class="status">一般 3</span>`;
    drawerStats.innerHTML = `
      <div class="dstat"><span>受攻击资产</span><b>${d.assets} 个</b></div>
      <div class="dstat"><span>核心资产</span><b>3 个</b></div>
      <div class="dstat"><span>重要资产</span><b>4 个</b></div>
      <div class="dstat"><span>累计告警</span><b>${d.total} 条</b></div>`;
    drawerTable.innerHTML = d.assetRows.map((x) => `<div class="drow">
      <span class="dt">${esc(x.ip)}</span><span class="dname">${esc(x.name)}</span><span class="dtarget">${esc(x.crit)}</span>
      <span class="dstatus"><i></i>${x.count} 次</span>
    </div>`).join('');
    drawerAction.innerHTML = '查看资产台账 <span>→</span>';
    showDrawer();
  };

  const openTrendDrawer = () => {
    const d = DATA[range];
    const t = d.trend;
    const totals = t.handled.map((v, i) => v + t.open[i]);
    const peak = Math.max(...totals);
    const peakAt = totals.indexOf(peak);
    drawerKicker.textContent = '攻击告警变化';
    drawerTitle.textContent = `近${range}天趋势`;
    drawerBadges.innerHTML = `<span class="sev high">峰值 ${peak}</span><span class="status">${esc(t.labels[peakAt])}</span>`;
    drawerStats.innerHTML = `
      <div class="dstat"><span>告警总数</span><b>${d.total} 条</b></div>
      <div class="dstat"><span>已处置</span><b>${d.handled} 条</b></div>
      <div class="dstat"><span>未闭环</span><b>${d.unclosed} 条</b></div>
      <div class="dstat"><span>处置率</span><b>${d.rate}%</b></div>`;
    drawerTable.innerHTML = t.labels.slice(-6).map((label, i, arr) => {
      const idx = t.labels.length - arr.length + i;
      return `<div class="drow"><span class="dt">${esc(label)}</span><span class="dname">已处置 ${t.handled[idx]}</span><span class="dtarget">未闭环 ${t.open[idx]}</span><span class="dstatus"><i></i>${t.handled[idx] + t.open[idx]} 条</span></div>`;
    }).join('');
    drawerAction.innerHTML = '查看趋势详情 <span>→</span>';
    showDrawer();
  };

  const openIpAllDrawer = () => {
    const d = DATA[range];
    drawerKicker.textContent = '攻击源';
    drawerTitle.textContent = `全部攻击源 · ${d.ips} 个`;
    drawerBadges.innerHTML = `<span class="sev high">境外 22</span><span class="status" style="color:var(--red);border-color:currentColor">未解析 8</span>`;
    drawerStats.innerHTML = `
      <div class="dstat"><span>攻击源</span><b>${d.ips} 个</b></div>
      <div class="dstat"><span>关联告警</span><b>${d.total} 条</b></div>
      <div class="dstat"><span>重点来源</span><b>美国 / 德国</b></div>
      <div class="dstat"><span>未解析</span><b>8 个</b></div>`;
    drawerTable.innerHTML = d.ipsList.map((x) => `<div class="drow">
      <span class="dt">${esc(x.ip)}</span><span class="dname">${esc(x.region)}</span><span class="dtarget">${esc(x.type)}</span>
      <span class="dstatus"><i></i>${x.unresolved ? '待研判' : '待处置'}</span>
    </div>`).join('');
    drawerAction.innerHTML = '查看全部告警 <span>→</span>';
    showDrawer();
  };

  drawerAction.addEventListener('click', () => {
    toast('已打开完整告警列表（演示）');
    closeDrawer();
  });

  /* ------------------------------------------------------------------ */
  /* Buttons                                                            */
  /* ------------------------------------------------------------------ */

  $('#ipAllBtn').addEventListener('click', openIpAllDrawer);
  $$('.kpi').forEach((el) => el.addEventListener('click', () => openKpiDrawer(el.dataset.kpi)));
  $('#assetAllBtn').addEventListener('click', openAssetAllDrawer);
  document.querySelector('.panel-assets .panel-head')?.addEventListener('click', openAssetAllDrawer);
  document.querySelector('.panel-top10 .panel-head')?.addEventListener('click', openIpAllDrawer);
  document.querySelector('.panel-trend .panel-head')?.addEventListener('click', openTrendDrawer);
  const hpAllBtnEl = $('#hpAllBtn');
  if (hpAllBtnEl) hpAllBtnEl.addEventListener('click', () => toast('打开全部蜜罐告警（演示）'));
  const intelMoreEl = $('#intelMore');
  if (intelMoreEl) intelMoreEl.addEventListener('click', () => toast('打开威胁情报全部动态（演示）'));

  /* ------------------------------------------------------------------ */
  /* Range switch                                                       */
  /* ------------------------------------------------------------------ */

  const renderAll = () => {
    const d = DATA[range];
    setKpis(d);
    renderIps(d);
    renderAssets(d);
    renderTypes(d);
    renderHoneypots(d);
    renderIntel(d);
    renderTrend(d);
    updateChinaAttackList(d);
    if (mapChart) renderMap();
  };

  $$('.range-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const next = Number(btn.dataset.range);
      if (next === range) return;
      range = next;
      $$('.range-btn').forEach((b) => b.classList.toggle('active', b === btn));
      renderAll();
      toast(`已切换至${range === 30 ? '近30天' : '近90天'}口径`);
    });
  });

  /* ------------------------------------------------------------------ */
  /* Background canvas                                                  */
  /* ------------------------------------------------------------------ */

  const canvas = $('#bgCanvas');
  const ctx = canvas.getContext('2d');
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = 1920 * DPR;
  canvas.height = 1080 * DPR;
  ctx.scale(DPR, DPR);
  const streams = Array.from({ length: 18 }, (_, i) => ({
    x: 46 + i * 104 + Math.random() * 36,
    y: Math.random() * 1080,
    len: 55 + Math.random() * 120,
    speed: 0.22 + Math.random() * 0.45,
    a: 0.04 + Math.random() * 0.045,
    color: i % 5 === 0 ? '142,107,255' : '74,168,255',
  }));
  const particles = Array.from({ length: 62 }, () => ({
    x: Math.random() * 1920,
    y: Math.random() * 1080,
    vx: (Math.random() - 0.5) * 0.18,
    vy: (Math.random() - 0.5) * 0.14,
    r: Math.random() * 1.5 + 0.4,
    a: Math.random() * 0.5 + 0.1,
    color: Math.random() > 0.72 ? '142,107,255' : Math.random() > 0.45 ? '74,168,255' : '67,212,255',
  }));
  const drawBg = () => {
    if (!canvas || canvas.offsetParent === null || document.hidden) return;
    ctx.clearRect(0, 0, 1920, 1080);
    for (const s of streams) {
      s.y += s.speed;
      if (s.y - s.len > 1080) {
        s.y = -s.len;
        s.x = 40 + Math.random() * 1840;
      }
      const g = ctx.createLinearGradient(s.x, s.y - s.len, s.x, s.y);
      g.addColorStop(0, `rgba(${s.color},0)`);
      g.addColorStop(0.82, `rgba(${s.color},${s.a})`);
      g.addColorStop(1, `rgba(${s.color},0)`);
      ctx.strokeStyle = g;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y - s.len);
      ctx.lineTo(s.x, s.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(s.x, s.y, 1, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${s.color},${s.a * 5})`;
      ctx.fill();
    }
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < -10) p.x = 1930; if (p.x > 1930) p.x = -10;
      if (p.y < -10) p.y = 1090; if (p.y > 1090) p.y = -10;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.color},${p.a})`;
      ctx.fill();
      for (let j = i + 1; j < particles.length; j++) {
        const q = particles[j];
        const dx = p.x - q.x, dy = p.y - q.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 130) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          ctx.strokeStyle = `rgba(74,168,255,${(1 - dist / 130) * 0.055})`;
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(drawBg);
  };
  drawBg();

  /* ------------------------------------------------------------------ */
  /* Init                                                               */
  /* ------------------------------------------------------------------ */

  renderAll();
  window.__SOC_2D_NAV__ = {
    showChina() {
      mapMode = 'china';
      selectedProvince = null;
      geoProvince = null;
      mapZoom = null;
      if (mapChart) {
        mapChart.resize();
        renderMap();
      }
    },
    showProvince(name) {
      if (!PROVINCE_META[name]) return;
      mapMode = 'china';
      selectedProvince = name;
      mapZoom = null;
      if (mapChart) {
        mapChart.resize();
        renderMap();
      }
    },
  };
  window.__SOC_INIT_2D__ = initMaps;

  if (new URLSearchParams(location.search).get('map2d') === 'china') {
    document.body.classList.add('map-2d');
    const boot2d = () => {
      if (!window.__SOC_INIT_2D__) { window.setTimeout(boot2d, 100); return; }
      Promise.resolve(window.__SOC_INIT_2D__()).then(() => {
        document.body.classList.add('map-2d');
        window.__SOC_2D_NAV__?.showChina();
      }).catch(() => {});
    };
    window.setTimeout(boot2d, 150);
  }

  // Allow deterministic demo states for screenshots, e.g. ?map=china&province=辽宁省&drawer=ip
  const params = new URLSearchParams(location.search);
  setTimeout(() => {
    if (params.get('map') === 'china') setMapMode('china');
    const province = params.get('province');
    if (province) selectProvince(province);
    if (params.get('drawer') === 'ip') openIpDrawer(DATA[range].ipsList[0]);
    if (params.get('drawer') === 'hp') openHoneypotDrawer(DATA[range].honeypots[0]);
  }, 900);


/* 全站文字整体放大 15%，且不低于 13px */
(() => {
  const SCALE = 1.15;
  const MIN_FONT = 13;
  let scheduled = false;
  const apply = () => {
    const all = document.body ? document.body.querySelectorAll('*') : [];
    all.forEach((el) => {
      if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE' || el.tagName === 'CANVAS') return;
      if (el.dataset.fontScaled === '1') return;
      const directText = Array.from(el.childNodes).some((n) => n.nodeType === 3 && n.nodeValue && n.nodeValue.trim());
      if (!directText) return;
      const size = parseFloat(getComputedStyle(el).fontSize || '0');
      if (!(size > 0)) return;
      const next = Math.max(MIN_FONT, Math.round(size * SCALE * 10) / 10);
      el.style.setProperty('font-size', next + 'px', 'important');
      el.dataset.fontScaled = '1';
    });
  };
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => { scheduled = false; apply(); });
  };
  const boot = () => {
    apply();
    if (!document.body) return;
    new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style'] });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();

})();
