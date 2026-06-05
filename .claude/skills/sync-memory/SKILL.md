# Sync Memory

換電腦後，把 repo 內的記憶檔同步到本機 Claude Code 記憶資料夾。

## 步驟

1. 確認目標資料夾存在（不存在則建立）
2. 把 `.claude/memory/` 的所有 `.md` 檔案複製過去
3. 告知用戶完成

## 指令（PowerShell）

```powershell
$dest = "$env:USERPROFILE\.claude\projects\d--Projects-Other-GraduationProject\memory"
New-Item -ItemType Directory -Force -Path $dest | Out-Null
Copy-Item -Path ".claude\memory\*" -Destination $dest -Force
Write-Host "Memory synced to $dest"
```

## 完成後

告知用戶：「記憶已同步，重開 Claude Code 後生效。」

## 注意

- 每次從新電腦開始工作前跑一次
- 有新記憶想帶走時，先在舊電腦 commit `.claude/memory/`，新電腦 `git pull` 後再執行此 skill
