<?php
/**
 * fetch.php
 * 拉取云端加密资源站，转换输出完整配置JSON
 * curl https://xxx/fetch.php > config.json
 * 同时本地 output/ 目录按category生成拆分的独立json文件
 */

// ==========配置常量==========
define('CLOUD_API_URL', 'https://api.maccms.ai/sites.json');
define('CLOUD_ENCRYPT_KEY', 'maccms_rh_2024_s3cr3t_k3y!@#$%^&'); // AES‑256‑CBC 32字节密钥
header("Content-Type: application/json; charset=utf-8");

/**
 * 通用远程请求函数：兼容cURL和file_get_contents，无扩展依赖
 * @param string $url 请求地址
 * @param int $timeout 超时时间
 * @return string|false
 */
function fetchRemoteContent(string $url, int $timeout = 15) {
    // 优先使用cURL（功能更强大）
    if (function_exists('curl_init')) {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, $timeout);
        $result = curl_exec($ch);
        curl_close($ch);
        return $result;
    }

    // cURL不可用时，降级使用file_get_contents（PHP原生，无扩展依赖）
    $context = stream_context_create([
        'http' => [
            'timeout' => $timeout,
            'follow_location' => true,
            'max_redirects' => 5
        ]
    ]);
    return @file_get_contents($url, false, $context);
}

/**
 * 生成key：中文符号过滤，只保留字母数字小写
 */
function generateSiteKey(string $name): string
{
    $str = preg_replace('/[^\da-zA-Z]/', '', $name);
    $str = strtolower(trim($str));
    if (empty($str)) {
        $str = 'site_' . mt_rand(1000,9999);
    }
    return $str;
}

/**
 * 校验解密后的源数据格式
 */
function validateCloudSitesFormat($data): bool
{
    if (!is_array($data)) return false;
    foreach ($data as $item) {
        if (!isset($item['name']) || !isset($item['url']) || !isset($item['category'])) {
            return false;
        }
    }
    return true;
}

// 基础模板（完全保留你提供的原样，仅sites数组动态替换）
$baseTemplate = [
    "spider" => "",
    "wallpaper" => "https://www.dmoe.cc/random.php",
    "sites" => [],
    "parses" => [
        [
            "name" => "Json并发",
            "type" => 2,
            "url" => "Parallel"
        ],
        [
            "name" => "pangujiexi解析",
            "type" => 2,
            "url" => "shturl.cc/AzImUezun2WZxD8qCVcBBBXKBsSY",
            "ext" => [
                "flag" => ["qiyi","qq","letv","sohu","youku","mgtv","bilibili","wasu","xigua","1905"]
            ]
        ],
        [
            "name" => "ckplayer解析",
            "type" => 1,
            "url" => "https://www.ckplayer.vip/jiexi/?url=",
            "ext" => [
                "flag" => ["qiyi","qq","letv","sohu","youku","mgtv","bilibili","wasu","xigua","1905"]
            ]
        ]
    ],
    "flags" => [
        "youku","qq","iqiyi","qiyi","letv","sohu","tudou","pptv","mgtv","wasu","bilibili","le","duoduozy","renrenmi","xigua",
        "优酷","腾讯","爱奇艺","奇艺","乐视","搜狐","土豆","PPTV","芒果","华数","哔哩","1905"
    ],
    "lives" => [
        [
            "name" => "咪咕直播",
            "type" => 0,
            "url" => "https://gh-proxy.com/https://raw.githubusercontent.com/develop202/migu_video/refs/heads/main/interface.txt",
            "epg" => "http://epg.51zmt.top:8000/api/diyp/?ch={name}&date={date}",
            "logo" => "https://live.fanmingming.com/tv/{name}.png"
        ],
        [
            "name" => "直播二",
            "type" => 0,
            "url" => "https://gh-proxy.org/https:/raw.githubusercontent.com/cqshushu/tvjk/main/all.txt",
            "epg" => "http://epg.51zmt.top:8000/api/diyp/?ch={name}&date={date}",
            "logo" => "https://live.fanmingming.com/tv/{name}.png"
        ],
        [
            "name" => "直播三",
            "type" => 0,
            "url" => "https://live.zbds.top/tv/iptv4.txt",
            "epg" => "http://epg.51zmt.top:8000/api/diyp/?ch={name}&date={date}",
            "logo" => "https://live.fanmingming.com/tv/{name}.png"
        ]
    ],
    "ads" => [
        "mimg.0c1q0l.cn","www.googletagmanager.com","www.google-analytics.com","mc.usihnbcq.cn","mg.g1mm3d.cn","mscs.svaeuzh.cn","cnzz.hhurm.com","tp.vinuxhome.com","cnzz.mmstat.com","shturl.cc/0PuzZba","s23.cnzz.com","z3.cnzz.com","c.cnzz.com","stj.v1vo.top","z12.cnzz.com","img.mosflower.cn","tips.gamevvip.com","ehwe.yhdtns.com","xdn.cqqc3.com","www.jixunkyy.cn","sp.chemacid.cn","hm.baidu.com","s9.cnzz.com","z6.cnzz.com","um.cavuc.com","mav.mavuz.com","wofwk.aoidf3.com","z5.cnzz.com","xc.hubeijieshikj.cn","tj.tianwenhu.com","xg.gars57.cn","k.jinxiuzhilv.com","cdn.bootcss.com","ppl.xunzhuo123.com","xomk.jiangjunmh.top","img.xunzhuo123.com","z1.cnzz.com","s13.cnzz.com","xg.huataisangao.cn","z7.cnzz.com","xg.huataisangao.cn","z2.cnzz.com","s96.cnzz.com","q11.cnzz.com","thy.dacedsfa.cn","xg.whsbpw.cn","s19.cnzz.com","z8.cnzz.com","s4.cnzz.com","f5w.as12df.top","ae01.alicdn.com","www.92424.cn","k.wudejia.com","vivovip.mmszxc.top","qiu.xixiqiu.com","cdnjs.hnfenxun.com","cms.qdwght.com"
    ]
];

try {
    // 使用兼容函数获取远程内容，替代原生cURL调用
    $raw = fetchRemoteContent(CLOUD_API_URL, 15);

    if (empty($raw)) {
        echo json_encode(["error" => "远端API无响应"], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $payload = json_decode($raw, true);
    if (!$payload || empty($payload['data']) || empty($payload['iv'])) {
        echo json_encode(["error" => "远端数据格式错误"], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // AES‑256‑CBC解密
    $decrypted = openssl_decrypt(
        base64_decode($payload['data']),
        'AES-256-CBC',
        CLOUD_ENCRYPT_KEY,
        OPENSSL_RAW_DATA,
        base64_decode($payload['iv'])
    );

    if ($decrypted === false) {
        echo json_encode(["error" => "AES解密失败"], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $sourceSites = json_decode($decrypted, true);
    if (!validateCloudSitesFormat($sourceSites)) {
        echo json_encode(["error" => "源数据校验失败"], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // 转换映射 sites
    $outSites = [];
    $groupByCategory = [];
    foreach ($sourceSites as $item) {
        $row = [
            "key"         => generateSiteKey($item['name']),
            "name"        => $item['name'],
            "type"        => 1,
            "api"         => $item['url'],
            "searchable"  => 1,
            "quickSearch" => 1,
            "filterable"  => 1,
            "ext"         => "",
            "timeout"     => 10,
            "categories"  => [] // 修改：categories置空
        ];
        $outSites[] = $row;

        // 用于生成分组文件
        $cat = $item['category'] ?? 'default';
        if (!isset($groupByCategory[$cat])) {
            $groupByCategory[$cat] = [];
        }
        $groupByCategory[$cat][] = $row;
    }

    // 填充到模板
    $baseTemplate['sites'] = $outSites;

    // ==========额外：本地生成分组json文件==========
    $outputDir = __DIR__ . DIRECTORY_SEPARATOR . 'output';
    if (!is_dir($outputDir)) {
        mkdir($outputDir, 0755, true);
    }
    foreach ($groupByCategory as $categoryName => $siteList) {
        $safeFileName = preg_replace('/[\/\\:*?"<>|]/', '_', $categoryName);
        $filePath = $outputDir . DIRECTORY_SEPARATOR . "{$safeFileName}.json";
        file_put_contents($filePath, json_encode($siteList, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
    }

    // 输出完整JSON（http响应输出，原有功能不变）
    echo json_encode($baseTemplate, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

} catch (\Exception $e) {
    echo json_encode(["error" => $e->getMessage()], JSON_UNESCAPED_UNICODE);
}
