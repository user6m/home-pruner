# Contributing to Home Pruner

Thank you for your interest in contributing to Home Pruner! We welcome contributions from the community.

## Tech Stack

- **Language**: TypeScript
- **Runtime**: Node.js (>=20)
- **Package Manager**: pnpm
- **Bundler**: esbuild
- **Testing**: Vitest
- **Linting**: ESLint

## Project Structure

```
.
├── src/                # Source code
│   ├── main.ts         # Entry point
│   ├── modules/        # Core business logic
│   ├── const/          # Constants
│   ├── type/           # TypeScript type definitions
│   └── errors/         # Custom error classes
├── .github/            # GitHub workflows and templates
└── scripts/            # Helper scripts
```

## Getting Started

1.  Fork the repository.
2.  Clone your fork: `git clone https://github.com/your-username/home-pruner.git`
3.  Install dependencies: `pnpm install`
4.  Create a new branch: `git checkout -b feature/your-feature-name`

## Development

- Run tests: `pnpm test`
- Lint code: `pnpm lint`
- Build project: `pnpm build`

## Release Process

(For Maintainers)

This project uses [Semantic Versioning](https://semver.org/) and [release-it](https://github.com/release-it/release-it) for release automation.

To create a new release:

1.  Run `pnpm run release` on the `main` branch.
2.  Follow the interactive prompts to select the version bump.
3.  The script will automatically:
    - Update `package.json`
    - Generate a git tag
    - Push changes to GitHub
    - Create a GitHub Release
4.  The GitHub Action will then trigger to publish the package to npm (requires approval).

## Pull Requests

1.  Ensure your code passes all tests and linting checks.
2.  Push your changes to your fork.
3.  Submit a pull request to the `main` branch.
4.  Provide a clear description of your changes and the problem they solve.

## Code of Conduct

Please be respectful and considerate of other contributors.
