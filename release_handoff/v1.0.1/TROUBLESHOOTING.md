# Troubleshooting Guide - HyperSnatch v1.0.1

## PowerShell vs Git Bash Notes

### Command Differences

| Git Bash | PowerShell | Purpose |
|-----------|-------------|---------|
| `grep` | `Select-String` | Search files for patterns |
| `ls -la` | `Get-ChildItem` | List directory contents |
| `find . -name "*.js"` | `Get-ChildItem -Recurse -Include "*.js"` | Find files by pattern |
| `sha256sum` | `Get-FileHash -Algorithm SHA256` | Compute file hashes |
| `cat` | `Get-Content` | Read file contents |
| `mkdir -p` | `New-Item -ItemType Directory -Force` | Create directories |
| `rm -rf` | `Remove-Item -Recurse -Force` | Delete files/directories |

### Common Issues

#### 1. Command Not Found
**Problem**: `grep: command not found`
**Solution**: Use `Select-String` in PowerShell
```powershell
# Instead of:
grep -r "pattern" .

# Use:
Select-String -Path (Get-ChildItem -Recurse -File).FullName -Pattern "pattern"
```

#### 2. Path Separators
**Problem**: Mixed path separators causing issues
**Solution**: Use PowerShell native paths
```powershell
# Instead of:
cd ./folder

# Use:
Set-Location .\folder
```

#### 3. Execution Policy
**Problem**: Scripts won't run due to execution policy
**Solution**: Set execution policy for current session
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process
```

## Build Issues

### 1. "No JSON content found in output"

**Symptoms**:
- Build fails with electron-builder error
- No clear error message

**Solutions**:
```bash
# Clean and reinstall dependencies
rm -rf node_modules
npm ci

# Clear npm cache
npm cache clean --force
npm install

# Check Node.js version
node --version  # Should be 18.x or higher
```

### 2. Large File Warnings

**Symptoms**:
- Git warnings about large files
- Push failures due to file size limits

**Solutions**:
```bash
# Check what's tracked
git ls-files | Select-String -Pattern ".exe"

# Remove from tracking if needed
git rm --cached filename.exe

# Ensure .gitignore covers it
echo "*.exe" >> .gitignore
git add .gitignore
git commit -m "chore: ignore exe files"
```

### 3. Test Failures

**Symptoms**:
- Tests failing after security changes
- Missing test files

**Solutions**:
```bash
# Run tests with verbose output
npm test -- --verbose

# Check individual test files
node scripts/test_basic.js

# Verify test dependencies
npm list
```

## Security Validation Issues

### 1. Select-String Pattern Matching

**Problem**: Complex regex patterns not working
**Solution**: Use proper escaping and syntax
```powershell
# Correct syntax for security checks
Select-String -Path (Get-ChildItem -Recurse -File -Include "*.js").FullName -Pattern "nodeIntegration\s*:\s*true"

# Alternative: Use simple patterns
Select-String -Path (Get-ChildItem -Recurse -File -Include "*.js").FullName -Pattern "nodeIntegration.*true"
```

### 2. File Encoding Issues

**Problem**: Special characters in file paths
**Solution**: Use proper encoding
```powershell
# Read files with proper encoding
Get-Content -Path "file.js" -Encoding UTF8

# Write files with proper encoding
Set-Content -Path "file.js" -Value $content -Encoding UTF8
```

## Git Issues

### 1. Push Failures

**Symptoms**:
- Authentication errors
- Large file rejections
- Branch protection errors

**Solutions**:
```bash
# Check remote configuration
git remote -v

# Verify authentication
git config --get remote.origin.url

# Force push (use carefully)
git push --force-with-lease origin main
```

### 2. Tag Issues

**Problem**: Tag points to wrong commit
**Solution**: Recreate tag correctly
```bash
# Delete incorrect tag
git tag -d v1.0.1

# Create new tag on correct commit
git tag -a v1.0.1 -m "Release message" HEAD

# Push tag
git push origin v1.0.1
```

### 3. Merge Conflicts

**Symptoms**:
- Merge conflicts during pull/push
- Unresolved merge markers

**Solutions**:
```bash
# Stash changes
git stash

# Pull latest changes
git pull origin main

# Apply stashed changes
git stash pop

# Or reset to clean state
git reset --hard origin/main
```

## Environment Issues

### 1. Node.js Version

**Problem**: Incompatible Node.js version
**Solution**: Use correct version
```bash
# Check current version
node --version

# Use nvm to switch versions
nvm use 18
nvm install 18
```

### 2. npm Permissions

**Problem**: Permission denied during npm operations
**Solution**: Fix npm permissions
```bash
# Clear npm cache
npm cache clean --force

# Fix permissions (Linux/Mac)
sudo chown -R $(whoami) ~/.npm

# Use npm with correct prefix
npm config set prefix ~/.npm-global
```

## Release Issues

### 1. Hash Mismatches

**Problem**: Computed hashes don't match expected
**Solutions**:
```powershell
# Verify file integrity
Get-FileHash -Path "HyperSnatch-Setup-1.0.1.exe" -Algorithm SHA256

# Check file corruption
Test-Path -Path "HyperSnatch-Setup-1.0.1.exe"

# Re-download if corrupted
```

### 2. GitHub Release Upload

**Problem**: File upload failures
**Solutions**:
- Check file size limits (GitHub: 2GB per file)
- Verify internet connection
- Use smaller files if needed
- Try different browser

## Performance Issues

### 1. Slow Build Times

**Solutions**:
```bash
# Use npm ci instead of npm install
npm ci

# Clear build cache
npm run clean

# Use faster disk (SSD if available)
```

### 2. Memory Issues

**Solutions**:
```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"

# Close other applications
# Use 64-bit Node.js
```

## Getting Help

### 1. Check Logs

```bash
# npm logs
npm config get loglevel

# Git logs
git log --oneline -10

# Build logs
# Check dist/ directory for build logs
```

### 2. Verify Environment

```bash
# Check all versions
node --version
npm --version
git --version

# Check environment variables
env | grep -E "(NODE|npm|PATH)"
```

### 3. Reset to Clean State

```bash
# Reset to clean repository state
git clean -fd
git reset --hard HEAD

# Reinstall dependencies
rm -rf node_modules
npm ci
```

## Contact Support

If issues persist:

1. **Check Documentation**: Review all relevant documentation
2. **Search Issues**: Check GitHub issues for similar problems
3. **Create Issue**: Include:
   - Operating system and version
   - Node.js and npm versions
   - Error messages (full output)
   - Steps to reproduce
   - Expected vs actual behavior

---

*For specific issues not covered here, refer to project documentation or create a GitHub issue.*
