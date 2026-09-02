param(
  [string]$ProjectRoot = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = 'Stop'
$capstoneDir = Join-Path $ProjectRoot 'capstone'
$imageDir = Join-Path $ProjectRoot 'images\capstone'
New-Item -ItemType Directory -Force -Path $imageDir | Out-Null

$modules = @{
  deployment = @{ Name = 'Deployment Planning'; Accent = '#175cd3'; Soft = '#eaf2ff' }
  migration  = @{ Name = 'Migration & Integration'; Accent = '#0f766e'; Soft = '#e7f7f4' }
  technical  = @{ Name = 'Technical Documentation'; Accent = '#6d28d9'; Soft = '#f1ebff' }
  project    = @{ Name = 'Project Defense'; Accent = '#b54708'; Soft = '#fff0e5' }
}

function Encode-Xml([string]$Value) {
  return [System.Security.SecurityElement]::Escape([System.Net.WebUtility]::HtmlDecode($Value).Trim())
}

function Split-Lines([string]$Text, [int]$Limit) {
  $words = [System.Net.WebUtility]::HtmlDecode($Text).Trim() -split '\s+'
  $lines = [System.Collections.Generic.List[string]]::new()
  $line = ''
  foreach ($word in $words) {
    $candidate = if ($line) { "$line $word" } else { $word }
    if ($candidate.Length -gt $Limit -and $line) {
      $lines.Add($line)
      $line = $word
    } else {
      $line = $candidate
    }
  }
  if ($line) { $lines.Add($line) }
  return $lines
}

function Get-TopicKind([string]$Title, [string]$Target, [int]$Step) {
  $topic = "$Title $Target".ToLowerInvariant()
  if ($Title -match 'Environment Architecture') {
    if ($Step -eq 0) { return 'server' }
    if ($Step -eq 1) { return 'checklist' }
    return 'shield'
  }
  if ($Title -match 'Deployment Models') {
    if ($Step -eq 0) { return 'server' }
    if ($Step -eq 1) { return 'cloud' }
    return 'hybrid'
  }
  if ($topic -match 'backup|rollback|restore|recovery') { return 'backup' }
  if ($topic -match 'security|secure|authentication|authorization|secret|ssl|tls|firewall|privacy') { return 'shield' }
  if ($topic -match 'database|data |schema|etl|mapping|reconciliation|file') { return 'database' }
  if ($topic -match 'cloud|hosting|edge') { return 'cloud' }
  if ($topic -match 'document|manual|guide|requirement|traceability|report|evidence') { return 'document' }
  if ($topic -match 'user|stakeholder|team|panel|training|communication|audience') { return 'users' }
  if ($topic -match 'test|validation|evaluation|quality|checklist|acceptance') { return 'checklist' }
  if ($topic -match 'monitor|metric|performance|capacity|result|measure') { return 'chart' }
  if ($topic -match 'api|integration|sync|network|dns|connect') { return 'network' }
  if ($topic -match 'pipeline|ci/cd|automation|deploy|release|cutover|migration') { return 'pipeline' }
  if ($topic -match 'server|infrastructure|environment|architecture|system') { return 'server' }
  return 'process'
}

function Get-LessonPath([string]$ModuleKey, [string]$Title) {
  $topic = $Title.ToLowerInvariant()
  if ($topic -match 'environment architecture') { return 'DEVELOPMENT  ->  TESTING  ->  STAGING  ->  PRODUCTION' }
  if ($topic -match 'deployment models') { return 'ON-PREMISES  <->  CLOUD  ->  HYBRID / EDGE' }
  if ($topic -match 'domain.*dns.*ssl|secure connectivity') { return 'DOMAIN  ->  DNS  ->  HTTPS / TLS  ->  APPLICATION' }
  if ($topic -match 'ci/cd|automation') { return 'COMMIT  ->  BUILD & TEST  ->  DEPLOY  ->  VERIFY' }
  if ($topic -match 'backup|restore|rollback|recovery') { return 'BACK UP  ->  VERIFY  ->  RESTORE / ROLL BACK' }
  if ($topic -match 'etl|extract.*transform.*load') { return 'EXTRACT  ->  TRANSFORM  ->  LOAD  ->  VALIDATE' }
  if ($topic -match 'migration|cutover') { return 'ASSESS  ->  PREPARE  ->  MIGRATE  ->  VALIDATE' }
  if ($topic -match 'monitor|logging|health|performance') { return 'OBSERVE  ->  ALERT  ->  RESPOND  ->  IMPROVE' }
  if ($topic -match 'security|authentication|authorization|secret|hardening') { return 'IDENTIFY RISK  ->  APPLY CONTROL  ->  TEST  ->  MONITOR' }
  if ($topic -match 'test|validation|evaluation|quality|reconciliation') { return 'PLAN  ->  TEST  ->  RECORD EVIDENCE  ->  CORRECT' }
  if ($topic -match 'documentation|manual|guide|requirements|architecture|api') { return 'ANALYZE  ->  DOCUMENT  ->  REVIEW  ->  MAINTAIN' }
  if ($topic -match 'defense|demonstration|panel|presentation') { return 'PROBLEM  ->  SOLUTION  ->  EVIDENCE  ->  DEFEND' }
  switch ($ModuleKey) {
    'deployment' { return 'PLAN  ->  CONFIGURE  ->  RELEASE  ->  VERIFY' }
    'migration' { return 'ASSESS  ->  MAP  ->  MOVE  ->  VALIDATE' }
    'technical' { return 'CAPTURE  ->  ORGANIZE  ->  REVIEW  ->  MAINTAIN' }
    'project' { return 'EXPLAIN  ->  DEMONSTRATE  ->  SUPPORT WITH EVIDENCE' }
  }
}

foreach ($moduleKey in $modules.Keys) {
  $htmlPath = Join-Path $capstoneDir "$moduleKey.html"
  $html = Get-Content -LiteralPath $htmlPath -Raw
  $lessonMatches = [regex]::Matches($html, '(?s)<section class="lesson"[^>]*>(.*?)</section>')
  if ($lessonMatches.Count -ne 15) {
    throw "Expected 15 lessons in $htmlPath; found $($lessonMatches.Count)."
  }

  $lessonNumber = 0
  foreach ($lessonMatch in $lessonMatches) {
    $lessonNumber++
    $body = $lessonMatch.Groups[1].Value
    $titleMatch = [regex]::Match($body, '(?s)<h2>(.*?)</h2>')
    $targetsMatch = [regex]::Match($body, '(?s)<h3>Learning targets</h3>\s*<ul>(.*?)</ul>')
    if (-not $titleMatch.Success -or -not $targetsMatch.Success) {
      throw "Missing title or learning targets in $moduleKey lesson $lessonNumber."
    }

    $title = [regex]::Replace($titleMatch.Groups[1].Value, '<[^>]+>', '')
    $targetMatches = [regex]::Matches($targetsMatch.Groups[1].Value, '(?s)<li>(.*?)</li>')
    $targets = @($targetMatches | ForEach-Object {
      Encode-Xml ([regex]::Replace($_.Groups[1].Value, '<[^>]+>', ''))
    })
    if ($targets.Count -lt 3) { throw "Expected 3 learning targets in $moduleKey lesson $lessonNumber." }

    $titleLines = @(Split-Lines $title 48 | Select-Object -First 2)
    $titleMarkup = for ($i = 0; $i -lt $titleLines.Count; $i++) {
      $y = 102 + ($i * 39)
      "  <text x=`"640`" y=`"$y`" text-anchor=`"middle`" class=`"title`">$(Encode-Xml $titleLines[$i])</text>"
    }

    $lessonPath = Encode-Xml (Get-LessonPath $moduleKey ([System.Net.WebUtility]::HtmlDecode($title)))
    $cards = for ($i = 0; $i -lt 3; $i++) {
      $x = 85 + ($i * 395)
      $textX = $x + 30
      $targetText = [System.Net.WebUtility]::HtmlDecode($targets[$i])
      $topicKind = Get-TopicKind $title $targetText $i
      $targetLines = @(Split-Lines $targetText 32 | Select-Object -First 3)
      $lineMarkup = for ($j = 0; $j -lt $targetLines.Count; $j++) {
        $y = 430 + ($j * 27)
        "    <text x=`"$textX`" y=`"$y`" class=`"target`">$(Encode-Xml $targetLines[$j])</text>"
      }
      $arrow = if ($i -lt 2) { "  <path d=`"M$($x + 350) 377h31`" class=`"arrow`"/><path d=`"m$($x + 376) 368 10 9-10 9`" class=`"arrow`"/>" } else { '' }
      @"
  <g>
    <rect x="$x" y="245" width="340" height="265" rx="22" class="card"/>
    <use href="#icon-$topicKind" x="$($x + 110)" y="270" width="120" height="110" class="topic-icon"/>
    <text x="$textX" y="405" class="label">WHAT TO DO</text>
$($lineMarkup -join "`n")
  </g>
$arrow
"@
    }

    $module = $modules[$moduleKey]
    $moduleLabel = Encode-Xml $module.Name.ToUpper()
    $lessonPadded = $lessonNumber.ToString('00')
    $svg = @"
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720" role="img" aria-labelledby="title desc">
  <title id="title">$(Encode-Xml $title)</title>
  <desc id="desc">Three-step learning diagram for $(Encode-Xml $title).</desc>
  <defs>
    <symbol id="icon-cloud" viewBox="0 0 120 110"><path d="M18 78h80c14 0 22-10 22-22s-9-21-22-22C93 15 77 5 61 10 47 13 38 23 35 38 15 36 2 47 2 61c0 10 6 17 16 17z"/><path d="M35 94h52M45 105h32"/></symbol>
    <symbol id="icon-server" viewBox="0 0 120 110"><rect x="17" y="4" width="86" height="98" rx="8"/><path d="M17 36h86M17 69h86M50 20h36M50 53h36M50 86h36"/><circle cx="34" cy="20" r="5"/><circle cx="34" cy="53" r="5"/><circle cx="34" cy="86" r="5"/></symbol>
    <symbol id="icon-hybrid" viewBox="0 0 120 110"><rect x="2" y="57" width="42" height="43" rx="4"/><path d="M11 69h8m7 0h8M11 82h8m7 0h8M66 55h37c10 0 16-7 16-15s-6-14-14-15c-4-12-14-16-24-12-8 3-13 9-15 18-10-1-18 5-18 13 0 7 6 11 18 11zM44 78h32m-8-8 9 8-9 8"/></symbol>
    <symbol id="icon-database" viewBox="0 0 120 110"><ellipse cx="60" cy="17" rx="43" ry="14"/><path d="M17 17v73c0 9 19 15 43 15s43-6 43-15V17M17 51c0 9 19 15 43 15s43-6 43-15M17 84c0 9 19 15 43 15s43-6 43-15"/></symbol>
    <symbol id="icon-shield" viewBox="0 0 120 110"><path d="M60 2 105 19v31c0 30-18 49-45 58C33 99 15 80 15 50V19z"/><path d="m38 54 15 15 30-36"/></symbol>
    <symbol id="icon-document" viewBox="0 0 120 110"><path d="M24 3h54l23 24v79H24zM78 3v25h23M41 49h43M41 67h43M41 85h31"/></symbol>
    <symbol id="icon-users" viewBox="0 0 120 110"><circle cx="60" cy="25" r="19"/><circle cx="20" cy="43" r="12"/><circle cx="100" cy="43" r="12"/><path d="M25 106c1-29 14-46 35-46s34 17 35 46M2 101c1-20 8-32 23-37M118 101c-1-20-8-32-23-37"/></symbol>
    <symbol id="icon-checklist" viewBox="0 0 120 110"><rect x="14" y="3" width="92" height="103" rx="9"/><path d="m29 32 7 7 14-17m-21 42 7 7 14-17M60 32h31M60 64h31M29 89h62"/></symbol>
    <symbol id="icon-chart" viewBox="0 0 120 110"><path d="M9 4v99h106M27 83V63h19v20M56 83V41h19v42M86 83V17h19v66M25 48l29-22 22 7 31-26"/></symbol>
    <symbol id="icon-network" viewBox="0 0 120 110"><circle cx="60" cy="55" r="18"/><circle cx="16" cy="17" r="13"/><circle cx="104" cy="17" r="13"/><circle cx="16" cy="96" r="13"/><circle cx="104" cy="96" r="13"/><path d="m29 27 18 16m26 0 18-16M47 68 29 86m44-18 18 18"/></symbol>
    <symbol id="icon-backup" viewBox="0 0 120 110"><path d="M29 32A40 40 0 1 1 20 70M29 32H5m24 0V8"/><rect x="40" y="47" width="52" height="40" rx="5"/><path d="M50 61h31M50 74h21"/></symbol>
    <symbol id="icon-pipeline" viewBox="0 0 120 110"><rect x="1" y="31" width="32" height="49" rx="6"/><rect x="44" y="31" width="32" height="49" rx="6"/><rect x="87" y="31" width="32" height="49" rx="6"/><path d="M33 55h11m32 0h11m-49-8 8 8-8 8m43-16 8 8-8 8"/></symbol>
    <symbol id="icon-process" viewBox="0 0 120 110"><circle cx="60" cy="55" r="34"/><circle cx="60" cy="55" r="12"/><path d="M60 3v18m0 68v18M8 55h18m68 0h18M23 18l14 14m46 46 14 14M97 18 83 32M37 78 23 92"/></symbol>
  </defs>
  <style>
    .title{font:800 32px Arial,sans-serif;fill:#102a43}.module{font:700 16px Arial,sans-serif;letter-spacing:2px;fill:$($module.Accent)}
    .card{fill:#fff;stroke:#d7e1ec;stroke-width:2}.step{fill:$($module.Accent)}.number{font:800 22px Arial,sans-serif;fill:#fff}
    .label{font:800 14px Arial,sans-serif;letter-spacing:1.4px;fill:$($module.Accent)}.target{font:600 20px Arial,sans-serif;fill:#243b53}
    .arrow{fill:none;stroke:$($module.Accent);stroke-width:5;stroke-linecap:round;stroke-linejoin:round}.footer{font:600 17px Arial,sans-serif;fill:#52667a}
    .topic-icon{fill:$($module.Soft);stroke:$($module.Accent);stroke-width:5;stroke-linecap:round;stroke-linejoin:round}
    .path-label{font:800 16px Arial,sans-serif;letter-spacing:1.2px;fill:$($module.Accent)}
  </style>
  <rect width="1280" height="720" fill="#f6f9fc"/>
  <rect x="35" y="35" width="1210" height="650" rx="30" fill="$($module.Soft)" stroke="#d7e1ec" stroke-width="2"/>
  <text x="640" y="67" text-anchor="middle" class="module">$moduleLabel - LESSON $lessonPadded</text>
$($titleMarkup -join "`n")
  <line x1="85" y1="180" x2="1195" y2="180" stroke="#cad6e2" stroke-width="2"/>
  <text x="640" y="222" text-anchor="middle" class="path-label">$lessonPath</text>
$($cards -join "`n")
  <rect x="85" y="535" width="1110" height="90" rx="18" fill="#fff" stroke="#d7e1ec" stroke-width="2"/>
  <text x="115" y="573" class="label">STUDENT CHECK</text>
  <text x="115" y="603" class="footer">Explain each step, apply it to your capstone, and show evidence that you followed it.</text>
</svg>
"@
    $svgPath = Join-Path $imageDir "$moduleKey-$lessonPadded.svg"
    Set-Content -LiteralPath $svgPath -Value $svg -Encoding utf8 -NoNewline
  }

  $imageIndex = 0
  $html = [regex]::Replace($html, '(?s)<img\b(?=[^>]*class="auto-topic-image")[^>]*>', {
    param($match)
    $script:imageIndex++
    $altMatch = [regex]::Match($match.Value, 'alt="([^"]*)"')
    $alt = if ($altMatch.Success) { $altMatch.Groups[1].Value } else { "Lesson $script:imageIndex instructional diagram" }
    $padded = $script:imageIndex.ToString('00')
    return "<img class=`"auto-topic-image`" src=`"../images/capstone/$moduleKey-$padded.svg`" alt=`"$alt`" loading=`"lazy`" width=`"1280`" height=`"720`">"
  })
  $html = [regex]::Replace($html, '\s*<figcaption class="image-badge">.*?</figcaption>', '')
  $html = [regex]::Replace($html, 'Every lesson includes a longer explanation, learning targets, an applied capstone example, and an automatically loaded topic image\. When an online image is unavailable, the page keeps the built-in illustrated fallback so the layout never shows a broken image\.', 'Every lesson includes a longer explanation, learning targets, an applied capstone example, and a local instructional diagram that shows the lesson rules in a clear three-step sequence.')
  $html = [regex]::Replace($html, '(?s)  // Automatic lesson images:.*?(?=  // Highlight the current lesson in the sidebar\.)', "  // Lesson diagrams are local, deterministic assets that match each topic.`r`n`r`n")
  Set-Content -LiteralPath $htmlPath -Value $html -Encoding utf8 -NoNewline
}

Write-Output "Generated 60 instructional SVGs and updated 4 capstone pages."
