# Home Pruner

An interactive CLI tool to delete local git branches safely and efficiently.

## Features

- **Interactive Interface**: Easily navigate and select branches to delete.
- **Safe Deletion**: Integrated checks to prevent accidental deletion of unmerged branches.
- **Keyboard Navigation**: Supports both arrow keys and Vim-style (`j`/`k`) navigation.
- **Force Delete**: Option to forcefully delete stubborn branches.

## Installation

You can run `home-pruner` directly using `npx` without installation:

```bash
npx @user6m/home-pruner
```

Or install it globally:

```bash
npm install -g @user6m/home-pruner
# or
pnpm add -g @user6m/home-pruner
```

## Usage

Simply run the command in your git repository:

```bash
home-pruner
```

### Controls

| Key            | Action                                           |
| :------------- | :----------------------------------------------- |
| `↑` / `k`      | Move cursor up                                   |
| `↓` / `j`      | Move cursor down                                 |
| `Enter`        | **Delete** (or toggle selection)                 |
| `f`            | **Force Delete** (equivalent to `git branch -D`) |
| `t`            | Toggle header banner                             |
| `q` / `Ctrl+C` | Quit                                             |

## Contributing

We welcome contributions! If you're interested in helping develop `home-pruner`, please read our [Contributing Guide](CONTRIBUTING.md).

## License

MIT © [user6m](LICENSE)
