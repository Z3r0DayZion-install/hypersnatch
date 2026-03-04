# Contributing to HyperSnatch

First off, thank you for considering contributing! Every contribution helps make HyperSnatch better and more secure for everyone.

## 📋 Table of Contents
- [Code of Conduct](#code-of-conduct)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Verification Requirements](#verification-requirements)
- [Testing](#testing)
- [Documentation](#documentation)

## 📜 Code of Conduct

This project is committed to providing a welcoming, professional environment. 

**Expected behavior**:
- Be respectful and inclusive of all contributors.
- Focus on constructive feedback and collaboration.
- Help others learn and grow within the project.

**Unacceptable behavior**:
- Harassment or discrimination of any kind.
- Trolling, insulting, or derogatory comments.
- Publishing others' private information or "doxing".

## 🛠 Development Setup

### Prerequisites
- **Node.js**: 20.17.0+
- **Rust Toolchain**: Stable (for native forensic modules)
- **PowerShell**: 5.1+ (for verification scripts)
- **Git**: Latest

### Setup Steps
```bash
# Clone the repository
git clone https://github.com/Z3r0DayZion-install/hypersnatch
cd hypersnatch

# Install dependencies
npm install

# Build the project
npm run build
```

## 🔄 Pull Request Process

1. **Create an Issue**: Before starting work, please open an issue to discuss the proposed change.
2. **Branching**: Work on a descriptive feature branch (e.g., `feat/new-decoder` or `fix/memory-leak`).
3. **Coding Standards**: Follow the existing JavaScript and Rust style guides.
4. **Testing**: Ensure all tests pass (`npm run test:ci`). Add new tests for any new functionality.
5. **Verification**: If your changes affect the core logic, you MUST verify that the verifier itself still works (`.\scripts\verify.ps1 -SelfTest`).
6. **Documentation**: Update the `README.md` or other docs if you've added new features.

## 🔐 Verification Requirements

All PRs MUST meet the following criteria before being merged:

- **Offline Integrity**: Changes must not introduce calls to external servers (unless explicitly required and approved).
- **Determinism**: The build process must remain deterministic.
- **Security Audit**: All new dependencies will be strictly audited using `npm audit`.
- **Pass Verification**: The `verify.ps1` script must successfully verify the build.

## 🧪 Testing Guidelines

We use a combination of unit tests for decoders and integration tests for the forensic core.

```bash
# Run the full test suite
npm run test:ci

# Run only host decoder tests
npm run proof
```

### Writing New Tests
- Keep tests isolated and fast.
- Mock all network requests.
- Use clear, descriptive test names.

## 📜 License
By contributing, you agree that your contributions will be licensed under the project's **MIT License**.
