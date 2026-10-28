# SMARTBUY AI - DIAGNOSTIC SCRIPT (check_smartai.ps1)

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "         SMARTBUY AI - KIEM TRA HE THONG DOMAIN smartai.test" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host ""

$errorsFound = @()

# 1. KIEM TRA WINDOWS HOSTS
Write-Host "[1/6] Kiem tra phan giai ten mien smartai.test..." -NoNewline
try {
    $hostsEntry = Get-Content "$env:SystemRoot\System32\drivers\etc\hosts" | Select-String -Pattern "smartai\.test"
    $dnsResolve = [System.Net.Dns]::GetHostAddresses("smartai.test") | Select-Object -ExpandProperty IPAddressToString
    if ($dnsResolve -contains "127.0.0.1") {
        Write-Host " [OK]" -ForegroundColor Green
        Write-Host "      IP anh xa: 127.0.0.1" -ForegroundColor Gray
    } else {
        Write-Host " [LOI]" -ForegroundColor Red
        $errorsFound += "Domain smartai.test khong tro ve 127.0.0.1. Hay kiem tra lai file hosts."
    }
} catch {
    Write-Host " [LOI]" -ForegroundColor Red
    $errorsFound += "Khong the phan giai smartai.test: $($_.Exception.Message)"
}

# 2. KIEM TRA VITE DEV SERVER (PORT 5173)
Write-Host "[2/6] Kiem tra Vite Frontend Server (Port 5173)..." -NoNewline
$viteConn = Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue
if ($viteConn) {
    try {
        $req = [System.Net.WebRequest]::Create("http://127.0.0.1:5173/")
        $req.Timeout = 2000
        $res = $req.GetResponse()
        Write-Host " [OK]" -ForegroundColor Green
        Write-Host "      Vite dang lang nghe tai 127.0.0.1:5173 (Status: $($res.StatusCode))" -ForegroundColor Gray
        $res.Close()
    } catch {
        Write-Host " [CANH BAO]" -ForegroundColor Yellow
        Write-Host "      Cong 5173 mo nhung chua phan hoi HTTP dung." -ForegroundColor Gray
    }
} else {
    Write-Host " [CHUA CHAY]" -ForegroundColor Red
    $errorsFound += "Vite Dev Server chua chay tren cong 5173."
}

# 3. KIEM TRA CADDY EXECUTABLE VA PATH
Write-Host "[3/6] Kiem tra cai dat va duong dan caddy.exe..." -NoNewline
$caddyCmd = Get-Command caddy -ErrorAction SilentlyContinue
$caddyPath = $null
if ($caddyCmd) {
    $caddyPath = $caddyCmd.Source
} else {
    $altPaths = @(
        "$env:LOCALAPPDATA\Microsoft\WindowsApps\caddy.exe",
        "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\CaddyServer.Caddy_Microsoft.Winget.Source_8wekyb3d8bbwe\caddy.exe"
    )
    foreach ($p in $altPaths) {
        if (Test-Path $p) {
            $caddyPath = $p
            break
        }
    }
}

if ($caddyPath) {
    $versionOutput = (& $caddyPath version 2>&1) | Out-String
    Write-Host " [OK]" -ForegroundColor Green
    Write-Host "      Duong dan caddy.exe: $caddyPath" -ForegroundColor Gray
    Write-Host "      Phien ban          : $($versionOutput.Trim())" -ForegroundColor Gray
} else {
    Write-Host " [LOI]" -ForegroundColor Red
    $errorsFound += "Khong tim thay file caddy.exe."
}

# 4. KIEM TRA CADDY REVERSE PROXY TREN CONG 80
Write-Host "[4/6] Kiem tra Caddy Reverse Proxy tren Cong 80..." -NoNewline
$port80Conn = Get-NetTCPConnection -LocalPort 80 -State Listen -ErrorAction SilentlyContinue
if ($port80Conn) {
    Write-Host " [OK]" -ForegroundColor Green
    Write-Host "      Cong 80 dang lang nghe ket noi" -ForegroundColor Gray
} else {
    Write-Host " [CHUA CHAY]" -ForegroundColor Red
    $errorsFound += "Cong 80 chua duoc mo. Caddy chua chay."
}

# 5. KIEM TRA BACKEND JAVA (PORT 8080)
Write-Host "[5/6] Kiem tra Backend Java Spring Boot (Port 8080)..." -NoNewline
$javaConn = Get-NetTCPConnection -LocalPort 8080 -State Listen -ErrorAction SilentlyContinue
if ($javaConn) {
    Write-Host " [OK]" -ForegroundColor Green
    Write-Host "      Java Spring Boot dang chay tren cong 8080" -ForegroundColor Gray
} else {
    Write-Host " [TAM DUNG]" -ForegroundColor Yellow
    Write-Host "      (Luu y: Backend 8080 chua chay. Frontend van hoat dong voi mock data)" -ForegroundColor Gray
}

# 6. KIEM TRA HTTP TRUC TIEP TREN DOMAIN smartai.test
Write-Host "[6/6] Kiem tra truy cap thuc te http://smartai.test/..." -NoNewline
try {
    $webReq = [System.Net.HttpWebRequest]::Create("http://smartai.test/")
    $webReq.Timeout = 3000
    $webRes = $webReq.GetResponse()
    $stream = $webRes.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    $content = $reader.ReadToEnd()
    
    $titleMatch = [regex]::Match($content, "<title>(.*?)</title>")
    $titleText = if ($titleMatch.Success) { $titleMatch.Groups[1].Value } else { "N/A" }
    
    Write-Host " [THANH CONG 200 OK]" -ForegroundColor Green
    Write-Host "      Trang chu tra ve ma HTTP: $($webRes.StatusCode)" -ForegroundColor Gray
    Write-Host "      Tieu de trang (Title)   : $titleText" -ForegroundColor Gray
    Write-Host "      Reverse Proxy Server    : $($webRes.Headers['Via'])" -ForegroundColor Gray
    
    $prodReq = [System.Net.HttpWebRequest]::Create("http://smartai.test/products")
    $prodReq.Timeout = 3000
    $prodRes = $prodReq.GetResponse()
    Write-Host "      SPA Route /products     : $($prodRes.StatusCode) OK" -ForegroundColor Gray
    $prodRes.Close()
    
    $reader.Close()
    $stream.Close()
    $webRes.Close()
} catch {
    Write-Host " [THAT BAI]" -ForegroundColor Red
    $errorsFound += "Khong the ket noi toi http://smartai.test/: $($_.Exception.Message)"
}

Write-Host ""
Write-Host "======================================================================" -ForegroundColor Cyan
if ($errorsFound.Count -eq 0) {
    Write-Host "  KET QUA: HE THONG HOAT DONG HOAN HAO 100%!" -ForegroundColor Green
    Write-Host "  Ban co the mo trinh duyet va truy cap: http://smartai.test/" -ForegroundColor Green
} else {
    Write-Host "  CAC VAN DE CAN XU LY ($($errorsFound.Count)):" -ForegroundColor Red
    foreach ($err in $errorsFound) {
        Write-Host "  - $err" -ForegroundColor Yellow
    }
}
Write-Host "======================================================================" -ForegroundColor Cyan
