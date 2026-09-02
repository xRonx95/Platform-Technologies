import json, base64, hashlib
from pathlib import Path

OUT = Path('/mnt/data/linux-challenge-arena/data/challenges.json')
challenges=[]

def add(level, category, title, description, objective, setup, check, hints, points, flag=None, command_hint=None):
    idx=len(challenges)+1
    slug=f"LNX-{idx:03d}"
    if flag is None:
        flag=f"FLAG{{STACKFORGE_{idx:03d}}}"
    challenges.append({
        "id":slug,
        "number":idx,
        "level":level,
        "category":category,
        "title":title,
        "description":description,
        "objective":objective,
        "setup":setup,
        "check":check,
        "hints":hints,
        "points":points,
        "flag":flag,
        "commandHint":command_hint or ""
    })

# BASIC 1-50
names=[('alpha','notes'),('bravo','report'),('charlie','draft'),('delta','backup'),('echo','config')]
for i,(d,f) in enumerate(names,1):
    add('Basic','Navigation',f'Create the {d} workspace',
        'Practice directory creation and navigation in a clean Linux workspace.',
        f'Create a directory named `{d}` inside `/root/lab` and enter it.',
        'cd /root/lab', f'[ -d /root/lab/{d} ] && [ "$PWD" = "/root/lab/{d}" ]',
        ['Use mkdir to create a directory.','Use cd to move into a directory.'],10, command_hint=f'mkdir {d} && cd {d}')
for i,(d,f) in enumerate(names,1):
    add('Basic','Files',f'Create {f}.txt',
        'Create an empty file using standard shell utilities.',
        f'Create an empty file named `{f}.txt` in `/root/lab`.',
        'cd /root/lab', f'[ -f /root/lab/{f}.txt ]',
        ['touch creates an empty file.'],10, command_hint=f'touch {f}.txt')
texts=['Linux powers servers','permissions matter','logs tell stories','backups reduce risk','shells automate work']
for i,text in enumerate(texts,1):
    fn=f'message{i}.txt'
    add('Basic','Redirection',f'Write message {i}',
        'Use output redirection to place text into a file.',
        f'Create `{fn}` containing exactly: `{text}`',
        'cd /root/lab', f'printf %s "{text}" | cmp -s - /root/lab/{fn}',
        ['echo can print text.','Use > to write output to a file.'],10, command_hint=f'echo "{text}" > {fn}')
for i in range(1,6):
    src=f'source{i}.txt'; dst=f'copy{i}.txt'; content=f'asset-{i}-stackforge'
    add('Basic','Copy & Move',f'Copy file #{i}',
        'Practice copying files without changing the source.',
        f'Copy `{src}` to `{dst}`.',
        f'cd /root/lab; printf %s "{content}" > {src}',
        f'[ -f /root/lab/{dst} ] && cmp -s /root/lab/{src} /root/lab/{dst}',
        ['Use cp SOURCE DESTINATION.'],10, command_hint=f'cp {src} {dst}')
for i in range(1,6):
    src=f'old{i}.log'; dst=f'archive{i}.log'; content=f'log-entry-{i}'
    add('Basic','Copy & Move',f'Rename log #{i}',
        'Use mv to rename a file.',
        f'Rename `{src}` to `{dst}`.',
        f'cd /root/lab; printf %s "{content}" > {src}',
        f'[ ! -e /root/lab/{src} ] && [ -f /root/lab/{dst} ] && grep -qx "{content}" /root/lab/{dst}',
        ['mv can rename files in the same directory.'],10, command_hint=f'mv {src} {dst}')
for i in range(1,6):
    fn=f'temp{i}.tmp'
    add('Basic','Cleanup',f'Remove temporary file #{i}',
        'Remove a file that is no longer needed.',
        f'Delete `{fn}`.',
        f'cd /root/lab; echo temporary > {fn}',
        f'[ ! -e /root/lab/{fn} ]',
        ['Use rm FILE.'],10, command_hint=f'rm {fn}')
for i in range(1,6):
    lines=[f'item-{i}-{j}' for j in range(1, i+4)]
    data='\\n'.join(lines)+'\\n'; count=len(lines)
    add('Basic','Text Inspection',f'Count lines #{i}',
        'Use wc to count lines in a text file.',
        f'Write the number of lines in `inventory{i}.txt` to `answer.txt`.',
        f"cd /root/lab; printf '{data}' > inventory{i}.txt",
        f'[ "$(cat /root/lab/answer.txt 2>/dev/null | tr -d " \\n\\r")" = "{count}" ]',
        ['wc -l FILE prints the line count.','Redirect only the number into answer.txt, e.g. with awk.'],15, command_hint=f'wc -l inventory{i}.txt')
for i in range(1,6):
    token=f'needle{i}'
    add('Basic','Search',f'Find the matching line #{i}',
        'Search text using grep.',
        f'Find the line containing `{token}` in `search{i}.log` and save the full matching line to `answer.txt`.',
        f"cd /root/lab; printf 'noise-a\\nservice={token} status=ok\\nnoise-b\\n' > search{i}.log",
        f'grep -qx "service={token} status=ok" /root/lab/answer.txt 2>/dev/null',
        ['Use grep PATTERN FILE.','Redirect grep output with > answer.txt.'],15, command_hint=f'grep {token} search{i}.log > answer.txt')
for i in range(1,6):
    vals=[i+3, i, i+7, i+1]
    sortedvals='\\n'.join(str(x) for x in sorted(vals))+'\\n'
    setupvals='\\n'.join(str(x) for x in vals)+'\\n'
    add('Basic','Pipelines',f'Sort numeric data #{i}',
        'Practice sorting numerical text data.',
        f'Sort `numbers{i}.txt` numerically and save the result to `answer.txt`.',
        f"cd /root/lab; printf '{setupvals}' > numbers{i}.txt",
        f"printf '{sortedvals}' | cmp -s - /root/lab/answer.txt",
        ['Use sort -n for numeric sorting.'],15, command_hint=f'sort -n numbers{i}.txt > answer.txt')
for i in range(1,6):
    files=[f'doc{i}_{j}.txt' for j in range(1,4)]
    target=files[1]
    setup='cd /root/lab; mkdir -p docs; ' + '; '.join([f'echo file{j} > docs/{name}' for j,name in enumerate(files,1)])
    add('Basic','Find',f'Locate a file #{i}',
        'Use find to locate a file within a directory tree.',
        f'Find `{target}` under `/root/lab/docs` and save its full path to `answer.txt`.',
        setup,
        f'grep -qx "/root/lab/docs/{target}" /root/lab/answer.txt 2>/dev/null',
        ['Use find START -name FILENAME.'],15, command_hint=f'find /root/lab/docs -name {target} > answer.txt')

# INTERMEDIATE 51-100
modes=[('640','rw-r-----'),('600','rw-------'),('644','rw-r--r--'),('750','rwxr-x---'),('700','rwx------')]
for i,(mode,desc) in enumerate(modes,1):
    fn=f'secure{i}.dat'
    add('Intermediate','Permissions',f'Set permission mode {mode}',
        'Apply precise POSIX permissions to a file.',
        f'Set `{fn}` to mode `{mode}`.',
        f'cd /root/lab; echo secret > {fn}; chmod 666 {fn}',
        f'[ "$(stat -c %a /root/lab/{fn})" = "{mode}" ]',
        ['chmod accepts octal modes such as 640.'],25, command_hint=f'chmod {mode} {fn}')
for i in range(1,6):
    add('Intermediate','Permissions',f'Make script executable #{i}',
        'Add execute permission while preserving the script.',
        f'Make `job{i}.sh` executable by the owner.',
        f"cd /root/lab; printf '#!/bin/sh\\necho job-{i}\\n' > job{i}.sh; chmod 600 job{i}.sh",
        f'[ -x /root/lab/job{i}.sh ]',
        ['Use chmod u+x FILE.'],25, command_hint=f'chmod u+x job{i}.sh')
for i in range(1,6):
    add('Intermediate','Links',f'Create symbolic link #{i}',
        'Use symbolic links to reference a canonical file.',
        f'Create a symbolic link `current{i}.conf` pointing to `releases/config{i}.conf`.',
        f'cd /root/lab; mkdir -p releases; echo version={i} > releases/config{i}.conf',
        f'[ -L /root/lab/current{i}.conf ] && [ "$(readlink /root/lab/current{i}.conf)" = "releases/config{i}.conf" ]',
        ['Use ln -s TARGET LINKNAME.'],25, command_hint=f'ln -s releases/config{i}.conf current{i}.conf')
for i in range(1,6):
    add('Intermediate','Archives',f'Create tar archive #{i}',
        'Bundle a directory tree into a tar archive.',
        f'Create `backup{i}.tar` containing the `project{i}` directory.',
        f'cd /root/lab; mkdir -p project{i}; echo a > project{i}/a.txt; echo b > project{i}/b.txt',
        f'[ -f /root/lab/backup{i}.tar ] && tar tf /root/lab/backup{i}.tar | grep -q "project{i}/a.txt" && tar tf /root/lab/backup{i}.tar | grep -q "project{i}/b.txt"',
        ['Use tar cf ARCHIVE DIRECTORY.'],30, command_hint=f'tar cf backup{i}.tar project{i}')
for i in range(1,6):
    add('Intermediate','Archives',f'Compress a file #{i}',
        'Use gzip compression and preserve the compressed artifact.',
        f'Compress `dataset{i}.txt` so `dataset{i}.txt.gz` exists.',
        f'cd /root/lab; yes "row-{i}" | head -n 20 > dataset{i}.txt',
        f'[ -f /root/lab/dataset{i}.txt.gz ]',
        ['Use gzip FILE.'],30, command_hint=f'gzip dataset{i}.txt')
for i in range(1,6):
    users=[('ana',10+i),('ben',20+i),('cara',15+i)]
    data='\\n'.join(f'{u},{v}' for u,v in users)+'\\n'
    best=max(users,key=lambda x:x[1])[0]
    add('Intermediate','AWK',f'Find highest value #{i}',
        'Extract and compare CSV-style values using awk or shell pipelines.',
        f'From `usage{i}.csv`, write only the username with the highest numeric value to `answer.txt`.',
        f"cd /root/lab; printf '{data}' > usage{i}.csv",
        f'grep -qx "{best}" /root/lab/answer.txt 2>/dev/null',
        ['The file uses comma as the field separator.','awk -F, can parse comma-separated fields.'],35, command_hint=f"awk -F, 'NR==1{{m=$2;u=$1}} $2>m{{m=$2;u=$1}} END{{print u}}' usage{i}.csv > answer.txt")
for i in range(1,6):
    old=f'10.0.{i}.1'; new=f'10.10.{i}.1'
    add('Intermediate','SED',f'Replace configuration value #{i}',
        'Edit a configuration file non-interactively.',
        f'Replace `{old}` with `{new}` in `app{i}.conf`.',
        f"cd /root/lab; printf 'host={old}\\nport=8080\\n' > app{i}.conf",
        f'grep -qx "host={new}" /root/lab/app{i}.conf && ! grep -q "{old}" /root/lab/app{i}.conf',
        ['sed -i can edit a file in place.'],35, command_hint=f"sed -i 's/{old}/{new}/' app{i}.conf")
for i in range(1,6):
    add('Intermediate','Shell Scripts',f'Write a backup script #{i}',
        'Create a small executable shell script with predictable output.',
        f'Create executable `check{i}.sh` that prints exactly `READY-{i}` when run.',
        'cd /root/lab',
        f'[ -x /root/lab/check{i}.sh ] && [ "$(/root/lab/check{i}.sh)" = "READY-{i}" ]',
        ['Start with #!/bin/sh.','Use echo to print the required text, then chmod +x.'],40, command_hint=f"printf '#!/bin/sh\\necho READY-{i}\\n' > check{i}.sh && chmod +x check{i}.sh")
for i in range(1,6):
    values=['ERROR','INFO','ERROR','WARN','ERROR'][:i+1]
    count=values.count('ERROR')
    data='\\n'.join(f'{v} event-{j}' for j,v in enumerate(values,1))+'\\n'
    add('Intermediate','Logs',f'Count error records #{i}',
        'Combine grep and wc to summarize log data.',
        f'Count lines beginning with `ERROR` in `service{i}.log`; save only the number to `answer.txt`.',
        f"cd /root/lab; printf '{data}' > service{i}.log",
        f'[ "$(cat /root/lab/answer.txt 2>/dev/null | tr -d " \\n\\r")" = "{count}" ]',
        ['grep can select matching lines.','Pipe into wc -l.'],35, command_hint=f"grep '^ERROR' service{i}.log | wc -l > answer.txt")
for i in range(1,6):
    expected=f"alpha{i}\\nbeta{i}\\ngamma{i}\\n"
    raw=f"gamma{i}\\nalpha{i}\\nbeta{i}\\nalpha{i}\\n"
    add('Intermediate','Pipelines',f'Sort and deduplicate #{i}',
        'Build a pipeline that sorts text and removes duplicates.',
        f'Sort `names{i}.txt`, remove duplicates, and save the result in `answer.txt`.',
        f"cd /root/lab; printf '{raw}' > names{i}.txt",
        f"printf '{expected}' | cmp -s - /root/lab/answer.txt",
        ['sort first, then uniq.'],35, command_hint=f'sort names{i}.txt | uniq > answer.txt')

# ADVANCED 101-150: safe forensic/admin simulations
for i in range(1,6):
    flag=f'FLAG{{LOG_{i}_ANOMALY}}'
    add('Advanced','Incident Response',f'Locate suspicious login #{i}',
        'Analyze a simulated authentication log and extract a local training flag.',
        'Find the flag on the line with a failed root login and write only the flag to `answer.txt`.',
        f"cd /root/lab; printf 'INFO user=ana login=ok\\nWARN user=root login=failed src=lab{i} flag={flag}\\nINFO user=ben login=ok\\n' > auth.log",
        f'grep -qx "{flag}" /root/lab/answer.txt 2>/dev/null',
        ['Search for root and failed.','Extract the flag= field with awk/cut.'],50, flag=flag)
for i in range(1,6):
    bad=f'/root/lab/audit/secret{i}.key'
    add('Advanced','Hardening',f'Find world-writable sensitive file #{i}',
        'Audit a local directory tree for unsafe permissions.',
        'Find the `.key` file that is world-writable and save its full path to `answer.txt`.',
        f'cd /root/lab; mkdir -p audit; echo safe > audit/normal{i}.txt; echo key > audit/secret{i}.key; chmod 644 audit/normal{i}.txt; chmod 666 audit/secret{i}.key',
        f'grep -qx "{bad}" /root/lab/answer.txt 2>/dev/null',
        ['Use find with a permission test.','World-writable means the other-write bit is set.'],55)
for i in range(1,6):
    content=f'stackforge-integrity-{i}'
    digest=hashlib.sha256(content.encode()).hexdigest()
    add('Advanced','Integrity',f'Verify SHA-256 #{i}',
        'Use a cryptographic checksum for local integrity verification.',
        f'Compute the SHA-256 of `artifact{i}.bin` and write only the hex digest to `answer.txt`.',
        f"cd /root/lab; printf %s '{content}' > artifact{i}.bin",
        f'grep -qx "{digest}" /root/lab/answer.txt 2>/dev/null',
        ['Use sha256sum FILE.','Keep only the first field.'],55, flag=f'FLAG{{SHA256_{i}}}')
for i in range(1,6):
    plain=f'forensics-message-{i}'
    enc=base64.b64encode(plain.encode()).decode()
    add('Advanced','Encoding',f'Decode evidence #{i}',
        'Decode a Base64-encoded training artifact.',
        f'Decode `evidence{i}.b64` and save the plaintext to `answer.txt`.',
        f"cd /root/lab; printf %s '{enc}' > evidence{i}.b64",
        f'grep -qx "{plain}" /root/lab/answer.txt 2>/dev/null',
        ['Use base64 -d.'],50, command_hint=f'base64 -d evidence{i}.b64 > answer.txt')
for i in range(1,6):
    ip=f'192.0.2.{10+i}'
    add('Advanced','Log Analysis',f'Top source IP #{i}',
        'Analyze a simulated web log to identify the most frequent source.',
        'Write the most frequent source IP in `access.log` to `answer.txt`.',
        f"cd /root/lab; printf '{ip} GET /\\n198.51.100.7 GET /a\\n{ip} POST /login\\n203.0.113.9 GET /b\\n{ip} GET /c\\n' > access.log",
        f'grep -qx "{ip}" /root/lab/answer.txt 2>/dev/null',
        ['Extract field 1, sort, count duplicates, then sort by count.'],60)
for i in range(1,6):
    flag=f'FLAG{{HIDDEN_FILE_{i}}}'
    add('Advanced','Forensics',f'Hidden configuration artifact #{i}',
        'Inspect hidden files in a local directory.',
        'Locate the hidden file under `case/` containing a flag and write only the flag to `answer.txt`.',
        f"cd /root/lab; mkdir -p case; echo ordinary > case/readme.txt; echo '{flag}' > case/.trace{i}; echo other > case/.cache",
        f'grep -qx "{flag}" /root/lab/answer.txt 2>/dev/null',
        ['Use ls -la or find to include dotfiles.','grep -R can search file contents.'],55, flag=flag)
for i in range(1,6):
    flag=f'FLAG{{ARCHIVE_{i}_FOUND}}'
    add('Advanced','Forensics',f'Inspect archive #{i}',
        'Extract a local tar.gz evidence bundle and recover a training flag.',
        'Extract `evidence.tar.gz`, locate `flag.txt`, and copy its flag into `answer.txt`.',
        f"cd /root/lab; mkdir -p src/nested; echo note > src/note.txt; echo '{flag}' > src/nested/flag.txt; tar czf evidence.tar.gz src; rm -rf src",
        f'grep -qx "{flag}" /root/lab/answer.txt 2>/dev/null',
        ['Use tar xzf evidence.tar.gz.','Then find flag.txt.'],60, flag=flag)
for i in range(1,6):
    target=f'config{i}.ini'
    add('Advanced','Recovery',f'Restore configuration #{i}',
        'Recover the newest valid local backup using timestamps embedded in filenames.',
        f'Copy `backups/{target}.v3` to `{target}`.',
        f"cd /root/lab; mkdir -p backups; echo old > backups/{target}.v1; echo middle > backups/{target}.v2; echo current-{i} > backups/{target}.v3",
        f'grep -qx "current-{i}" /root/lab/{target} 2>/dev/null',
        ['The required source is explicitly the v3 backup.','Use cp.'],50)
for i in range(1,6):
    flag=f'FLAG{{PERMISSION_REPAIR_{i}}}'
    add('Advanced','Hardening',f'Repair exposed secret #{i}',
        'Reduce permissions on a local secret and prove the correction.',
        f'Change `vault{i}.txt` from mode 666 to mode 600, then write `{flag}` into `answer.txt`.',
        f"cd /root/lab; echo secret > vault{i}.txt; chmod 666 vault{i}.txt",
        f'[ "$(stat -c %a /root/lab/vault{i}.txt)" = "600" ] && grep -qx "{flag}" /root/lab/answer.txt 2>/dev/null',
        ['chmod 600 removes group/other access.','Then echo the provided flag into answer.txt.'],60, flag=flag)
for i in range(1,6):
    wanted=f'PIDLESS-SVC-{i}'
    add('Advanced','Automation',f'Write log triage script #{i}',
        'Create a shell script that extracts critical records from a local log.',
        f'Create executable `triage.sh` that reads `events.log` and prints only lines containing `CRITICAL`; its output must be saved to `answer.txt` when you run it.',
        f"cd /root/lab; printf 'INFO one\\nCRITICAL {wanted}\\nWARN two\\nCRITICAL disk-{i}\\n' > events.log",
        f'[ -x /root/lab/triage.sh ] && /root/lab/triage.sh | cmp -s - /root/lab/answer.txt && grep -q "CRITICAL {wanted}" /root/lab/answer.txt',
        ['Your script can use grep CRITICAL events.log.','Remember chmod +x triage.sh and run it with > answer.txt.'],65)

# PRO 151-200: multi-step local CTF scenarios
for i in range(1,11):
    flag=f'FLAG{{OPS_CHAIN_{i:02d}}}'
    token=base64.b64encode(flag.encode()).decode()
    add('Pro','CTF Chain',f'Operation Breadcrumb #{i}',
        'Follow multiple local clues: hidden file → Base64 decode → flag.',
        'A hidden clue under `mission/` contains Base64 text. Recover the decoded flag into `answer.txt`.',
        f"cd /root/lab; mkdir -p mission/docs; echo manual > mission/docs/readme; printf %s '{token}' > mission/.breadcrumb{i}",
        f'grep -qx "{flag}" /root/lab/answer.txt 2>/dev/null',
        ['List hidden files.','Base64-decode the clue.'],80, flag=flag)
for i in range(1,11):
    flag=f'FLAG{{LOG_HUNT_{i:02d}}}'
    encoded=base64.b64encode(flag.encode()).decode()
    add('Pro','Incident Response',f'Compromised Service Hunt #{i}',
        'Correlate simulated process and service logs without touching external systems.',
        'Find the service marked `COMPROMISED`, use its name to locate the matching file under `services/`, decode its token, and save the flag to `answer.txt`.',
        f"cd /root/lab; mkdir -p services; printf 'web OK\\nworker COMPROMISED\\ndb OK\\n' > status.log; echo harmless > services/web; printf %s '{encoded}' > services/worker; echo harmless > services/db",
        f'grep -qx "{flag}" /root/lab/answer.txt 2>/dev/null',
        ['Start with status.log.','The second field identifies the compromised service.','Decode the matching services/<name> file.'],90, flag=flag)
for i in range(1,11):
    flag=f'FLAG{{BACKUP_FORENSICS_{i:02d}}}'
    add('Pro','Forensics',f'Backup Forensics #{i}',
        'Recover a training flag from a nested compressed backup.',
        'Extract `case.tgz`; the flag is inside the newest snapshot directory. Save only the flag to `answer.txt`.',
        f"cd /root/lab; mkdir -p pack/snap-1 pack/snap-2 pack/snap-3; echo old > pack/snap-1/data; echo older > pack/snap-2/data; echo '{flag}' > pack/snap-3/flag.txt; tar czf case.tgz pack; rm -rf pack",
        f'grep -qx "{flag}" /root/lab/answer.txt 2>/dev/null',
        ['Extract the tgz archive.','Inspect snap-3.'],90, flag=flag)
for i in range(1,11):
    flag=f'FLAG{{AUDIT_FIX_{i:02d}}}'
    add('Pro','Hardening',f'Permission Audit & Repair #{i}',
        'Audit several local files, identify the exposed secret, and fix its mode.',
        f'Under `audit/`, exactly one `.key` file is mode 666. Change only that file to 600, then place `{flag}` in `answer.txt`.',
        f"cd /root/lab; mkdir -p audit; echo a > audit/a.key; echo b > audit/b.key; echo c > audit/c.key; chmod 600 audit/a.key audit/c.key; chmod 666 audit/b.key",
        f'[ "$(stat -c %a /root/lab/audit/b.key)" = "600" ] && [ "$(stat -c %a /root/lab/audit/a.key)" = "600" ] && [ "$(stat -c %a /root/lab/audit/c.key)" = "600" ] && grep -qx "{flag}" /root/lab/answer.txt 2>/dev/null',
        ['Use find/stat/ls -l to inspect permissions.','Repair the unsafe file with chmod 600.'],95, flag=flag)
for i in range(1,11):
    flag=f'FLAG{{SHELL_AUTOMATION_{i:02d}}}'
    add('Pro','Shell Automation',f'Automated Evidence Report #{i}',
        'Write a script that transforms local log data into a required report.',
        f'Create executable `report.sh` that reads `events.log` and prints `CRITICAL=<count>` on one line. Run it and save output to `answer.txt`. Then append `{flag}` as the second line.',
        f"cd /root/lab; printf 'INFO a\\nCRITICAL x\\nWARN b\\nCRITICAL y\\nCRITICAL z\\n' > events.log",
        f'[ -x /root/lab/report.sh ] && [ "$(sed -n "1p" /root/lab/answer.txt 2>/dev/null)" = "CRITICAL=3" ] && [ "$(sed -n "2p" /root/lab/answer.txt 2>/dev/null)" = "{flag}" ]',
        ['Use grep -c CRITICAL events.log inside the script.','Print CRITICAL=<number>.','Append the provided flag after running the script.'],100, flag=flag)

assert len(challenges)==200, len(challenges)
OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(json.dumps(challenges, indent=2))
print(f'wrote {len(challenges)} challenges to {OUT}')
