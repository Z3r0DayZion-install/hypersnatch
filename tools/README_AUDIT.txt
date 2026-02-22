HS Audit Pack (drop into HyperSnatch_Work\tools)

1) Copy HS_FullAuditClean.ps1 and RunAudit.ps1 into .\tools\
2) From PowerShell (in repo root) run:
   .\tools\RunAudit.ps1 -Root .

Optional cleanup (moves known garbage to _TRASH\timestamp):
   .\tools\RunAudit.ps1 -Root . -Apply

Hard delete the trash after review:
   .\tools\RunAudit.ps1 -Root . -Apply -PurgeTrash

Outputs:
   ops\reports\<timestamp>\REPORT.txt
   ops\reports\<timestamp>\TREE.txt
   ops\reports\<timestamp>\BANNED_TERM_HITS.txt (if fail)
   ops\reports\<timestamp>\DEMO_MANIFEST_MISMATCH.txt (if fail)

If node/npm is blocked by EPERM, that will be reported as BLOCKED instead of FAIL.
