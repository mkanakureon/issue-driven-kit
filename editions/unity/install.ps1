#Requires -Version 7
# install.ps1 — Issue 駆動キットの Unity 版を、利用先のリポジトリに写す（Windows・PowerShell 7）。
# 約束の正: docs/design/issue-driven-kit-basic-design.md の 3.4。導入の手順: shared/manuals/issue-driven-kit-install-guide.md
#   pwsh editions\unity\install.ps1 -Target <リポジトリ> -DryRun   # 写すファイルとぶつかるファイルを出すだけ
#   pwsh editions\unity\install.ps1 -Target <リポジトリ>           # 初めて入れる（既にあるファイルは上書きしない）
#   pwsh editions\unity\install.ps1 -Target <リポジトリ> -Update   # 入っている版を上げる（利用先が手を入れるファイルは上書きしない）
# 写すだけ。コミット・push・パッケージの追加はしない。最後の行が Result: PASS／FAIL。
param(
    [Parameter(Mandatory)][string]$Target,
    [switch]$DryRun,
    [switch]$Update
)
$ErrorActionPreference = 'Stop'
$Utf8NoBom = [System.Text.UTF8Encoding]::new($false)
[Console]::OutputEncoding = $Utf8NoBom

$Edition = 'unity'
$KitRoot = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$FilesRoot = Join-Path $PSScriptRoot 'files'
# 利用先が中身を書き足すファイル。-Update でも上書きせず、差があれば知らせる
$UserOwned = @('CLAUDE.md', '.gitignore', '.gitattributes')
# 写した後に作る空の置き場（.gitkeep を置く）
$EmptyDirs = @('Docs/InSpecs', 'Docs/Reports')

function Fail([string]$Why) { Write-Host "Result: FAIL ($Why)"; exit 1 }

if (-not (Test-Path -LiteralPath $Target -PathType Container)) { Fail "入れる先のフォルダーが無い: $Target" }
$top = & git -C $Target rev-parse --show-toplevel 2>$null
if ($LASTEXITCODE -ne 0 -or -not $top) { Fail "入れる先が git の作業場所でない: $Target" }
$TargetRoot = [System.IO.Path]::GetFullPath(([string]$top).Trim())
if ([System.IO.Path]::GetFullPath($Target).TrimEnd('\', '/') -ne $TargetRoot.TrimEnd('\', '/')) { Fail "入れる先は git の作業場所の直下にする（直下は $TargetRoot）" }

$files = @(Get-ChildItem -LiteralPath $FilesRoot -Recurse -File -Force | ForEach-Object {
        $_.FullName.Substring($FilesRoot.Length + 1).Replace([char]92, [char]47)
    } | Sort-Object)

$plan = foreach ($rel in $files) {
    $from = Join-Path $FilesRoot $rel
    $to = Join-Path $TargetRoot $rel
    $state = if (-not (Test-Path -LiteralPath $to)) { 'new' }
    elseif ((Get-FileHash -LiteralPath $from).Hash -eq (Get-FileHash -LiteralPath $to).Hash) { 'same' }
    elseif ($Update -and -not ($UserOwned -contains $rel)) { 'update' }
    elseif ($Update) { 'keep' }
    else { 'conflict' }
    [pscustomobject]@{ Rel = $rel; From = $from; To = $to; State = $state }
}

$label = @{ new = '写す'; same = '同じ'; update = '上げる'; keep = '残す（利用先が手を入れる物。差あり）'; conflict = 'ぶつかる（既にあって中身が違う）' }
foreach ($p in $plan) { Write-Host ('{0,-6} {1}' -f $p.State, $p.Rel) }
$count = @{}; foreach ($p in $plan) { $count[$p.State] = 1 + [int]$count[$p.State] }
Write-Host ('合計 {0} 件: {1}' -f $plan.Count, (($count.GetEnumerator() | Sort-Object Name | ForEach-Object { "$($label[$_.Name]) $($_.Value)" }) -join '・'))

$conflicts = @($plan | Where-Object State -eq 'conflict')
if ($conflicts.Count) {
    Write-Host '既にあって中身が違うファイルがある。上書きしない。中身を足す形にするか、-Update で入れ直す:'
    $conflicts | ForEach-Object { Write-Host "  $($_.Rel)" }
    Fail "ぶつかる $($conflicts.Count) 件"
}
if ($DryRun) { Write-Host "Result: PASS (DryRun・何も書いていない)"; exit 0 }

foreach ($p in $plan | Where-Object { $_.State -in 'new', 'update' }) {
    New-Item -ItemType Directory -Force -Path (Split-Path $p.To) | Out-Null
    Copy-Item -LiteralPath $p.From -Destination $p.To -Force
}
foreach ($d in $EmptyDirs) {
    $full = Join-Path $TargetRoot $d
    if (-not (Test-Path -LiteralPath $full)) { New-Item -ItemType Directory -Force -Path $full | Out-Null; Set-Content -LiteralPath (Join-Path $full '.gitkeep') -Value '' -NoNewline }
}

$commit = (& git -C $KitRoot rev-parse HEAD 2>$null)
$dirty = [bool](& git -C $KitRoot status --porcelain 2>$null)
$version = [ordered]@{
    kit         = 'issue-driven-kit'
    edition     = $Edition
    commit      = if ($commit) { ([string]$commit).Trim() } else { '' }
    dirty       = $dirty
    installedAt = (Get-Date).ToString('yyyy-MM-ddTHH:mm:sszzz')
    files       = $files
}
$vdir = Join-Path $TargetRoot '.issue-kit'
New-Item -ItemType Directory -Force -Path $vdir | Out-Null
[System.IO.File]::WriteAllText((Join-Path $vdir 'version'), ($version | ConvertTo-Json -Depth 4) + "`n", $Utf8NoBom)

$written = @($plan | Where-Object { $_.State -in 'new', 'update' }).Count
Write-Host "Result: PASS ($written 件を写した・版 $Edition・キット $($version.commit.Substring(0, [Math]::Min(8, $version.commit.Length)))$(if ($dirty) { '（未コミットの変更あり）' }))"
exit 0
