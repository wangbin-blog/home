# 输出文件夹
$outDir = "HarmonyOS_Font"
if (-not (Test-Path $outDir)) {
    New-Item -ItemType Directory -Path $outDir | Out-Null
}

# 请求头
$headers = @{
    "accept" = "*/*"
    "accept-language" = "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6"
    "cache-control" = "no-cache"
    "origin" = "http://192.168.94.162:3000"
    "pragma" = "no-cache"
    "priority" = "u=0"
    "referer" = "https://s1.hdslb.com/bfs/static/jinkela/long/font/regular.css"
    "sec-ch-ua" = "`"Not;A=Brand`";v=`"8`", `"Chromium`";v=`"150`", `"Microsoft Edge`";v=`"150`""
    "sec-ch-ua-mobile" = "?0"
    "sec-ch-ua-platform" = "`"Windows`""
    "sec-fetch-dest" = "font"
    "sec-fetch-mode" = "cors"
    "sec-fetch-site" = "cross-site"
    "user-agent" = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0"
}

# 全部字体链接
$urlList = @(
"https://s1.hdslb.com/bfs/static/jinkela/long/font/HarmonyOS_Regular.i.woff2",
"https://s1.hdslb.com/bfs/static/jinkela/long/font/HarmonyOS_Regular.b.woff2"
)

Write-Host "=============================="
Write-Host "Start download fonts, output dir: $outDir"
Write-Host "=============================="

# 循环下载
foreach ($url in $urlList) {
    $fileName = Split-Path $url -Leaf
    $savePath = Join-Path $outDir $fileName
    Write-Host "Downloading: $fileName"
    try {
        Invoke-WebRequest -Uri $url -Headers $headers -OutFile $savePath -UseBasicParsing
    }
    catch {
        Write-Host "Failed to download $fileName : $_" -ForegroundColor Red
    }
}

Write-Host "`nDownload complete, folder: $(Resolve-Path $outDir)" -ForegroundColor Green
Read-Host "Press Enter to exit"