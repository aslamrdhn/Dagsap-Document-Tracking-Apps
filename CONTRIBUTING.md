# Contributing to Dagsap Document Tracking Apps

First off, thank you for considering contributing to the Dagsap Document Tracking Apps! It's people like you that make this system robust and reliable.

## 🛠️ How to Contribute

### 1. Fork and Clone
- Fork the repository on GitHub.
- Clone your fork locally:
  ```bash
  git clone https://github.com/YOUR_USERNAME/Dagsap-Document-Tracking-Apps.git
  cd Dagsap-Document-Tracking-Apps
  ```

### 2. Create a Branch
We follow a structured branching model. Please create a branch using one of the following prefixes:
- `feat/`: For new features (e.g., `feat/add-new-dashboard-chart`)
- `fix/`: For bug fixes (e.g., `fix/login-crash`)
- `chore/`: For maintenance, dependency updates, or refactoring (e.g., `chore/update-react`)

```bash
git checkout -b feat/your-feature-name
```

### 3. Commit Messages (Conventional Commits)
We strictly follow [Conventional Commits](https://www.conventionalcommits.org/). Your commit messages must be structured as follows:

```
<type>[optional scope]: <description>

[optional body]
```
**Examples:**
- `feat(auth): add rate limiting to login endpoint`
- `fix(ui): resolve modal overflow on mobile`
- `chore(deps): update prisma to v5`

### 4. Running Tests Locally
Before submitting a pull request, you **must** ensure all tests pass. We use Vitest and React Testing Library.

```bash
# Run all tests
bun run test

# Run tests in watch mode (useful during development)
bun run test:watch

# Generate coverage report
bun run test:coverage
```
*Note: Ensure your `.env` is configured correctly, though the test script will automatically set `NODE_ENV=test` to bypass strict startup validations.*

### 5. Open a Pull Request
- Push your branch to your fork.
- Open a Pull Request against the `main` branch of the original repository.
- Describe your changes clearly in the PR description, linking any relevant issues.

## 🔒 Code Standards
- **TypeScript**: We use strict TypeScript. `any` types are heavily discouraged.
- **Formatting**: We use Prettier and ESLint. Run `bun run format` before committing.
- **Security**: Never commit secrets (e.g., `.env` files, API keys).
- **Validation**: All incoming API data must be validated using Zod schemas via `validateRequest`.

Thank you for your contributions!
