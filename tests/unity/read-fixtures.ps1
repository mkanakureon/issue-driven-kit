#Requires -Version 7
# read-fixtures.ps1 — Unity 版の issue-run.ps1 の読み取りの関数（Get-PassCriteria・Get-Prerequisites）を構文木で取り出し、
# shared/fixtures/<Fixtures> の見本を答えどおりに読むかを見る（仕様の正 shared/spec/issue-run-spec.md の 2 章・9 章・K-3 の Unity 側）。
#   -Fixtures issues       Unity 版の見本（確認コマンドは pwsh）。答えどおりに読む
#   -Fixtures issues-node  Node 版の見本（確認コマンドは js）。js の塊を確認コマンドにせず（空）、条件の行と前提は答えどおりに読む
# 守るファイル（2.3）は、git の管理と実在に依るので、見本を作ったリポジトリでしか同じにならない。ここでは見ない。
param([string]$Fixtures = 'issues')
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
$kit = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$ast = [System.Management.Automation.Language.Parser]::ParseFile((Join-Path $kit 'editions/unity/files/Scripts/issue-run.ps1'), [ref]$null, [ref]$null)
foreach ($fn in $ast.FindAll({ param($n) $n -is [System.Management.Automation.Language.FunctionDefinitionAst] -and $n.Name -in 'Get-PassCriteria', 'Get-Prerequisites' }, $true)) {
    . ([scriptblock]::Create($fn.Extent.Text))
}
$bad = 0
$n = 0
foreach ($e in Get-ChildItem (Join-Path $kit "shared/fixtures/$Fixtures") -Filter '*.expected.json') {
    $exp = Get-Content $e.FullName -Raw -Encoding utf8 | ConvertFrom-Json
    # 自分の版（pwsh）の塊だけが確認コマンド。ほかの版の見本では、確認コマンドは無い（空）のが答え
    $wantCheck = if ($exp.checkLang -eq 'pwsh') { $exp.check } else { '' }
    $n++
    $body = Get-Content ($e.FullName -replace '\.expected\.json$', '.md') -Raw -Encoding utf8
    $c = Get-PassCriteria $body
    $why = @()
    if ((@($c.Items) -join "`n") -ne (@($exp.items) -join "`n")) { $why += 'items' }
    if ([string]$c.Check -ne $wantCheck) { $why += 'check' }
    if ((@(Get-Prerequisites $body) -join ',') -ne (@($exp.prerequisites) -join ',')) { $why += 'prerequisites' }
    if ($why.Count) { $bad++; Write-Host "NG $($e.Name): $($why -join ', ')" }
}
if ($n -eq 0) { Write-Host 'Result: FAIL (見本が 0 件)'; exit 1 }
if ($bad) { Write-Host "Result: FAIL ($bad/$n)"; exit 1 }
Write-Host "Result: PASS ($n/$n)"
exit 0
