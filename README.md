# Home Pruner

An interactive CLI tool to delete local git branches safely and efficiently.

## Features

- **Interactive Interface**: Easily navigate and select branches to delete.
- **Safe Deletion**: Integrated checks to prevent accidental deletion of unmerged branches.
- **Keyboard Navigation**: Supports both arrow keys and Vim-style (`j`/`k`) navigation.
- **Force Delete**: Option to forcefully delete stubborn branches.
- **Update Notifications**: Lets you know when a newer version is published (no forced or automatic updates).

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

Run the tool in your terminal:

```bash
home-pruner
# or
npx @user6m/home-pruner
```

### Options

- `--help`, `-h`: Show help message.
- `--version`, `-v`: Show current version.

### Controls

| Key            | Action                                           |
| :------------- | :----------------------------------------------- |
| `↑` / `k`      | Move cursor up                                   |
| `↓` / `j`      | Move cursor down                                 |
| `Enter`        | **Delete** (or toggle selection)                 |
| `f`            | **Force Delete** (equivalent to `git branch -D`) |
| `t`            | Toggle header banner                             |
| `q` / `Ctrl+C` | Quit                                             |

### Update Notifications

home-pruner checks the npm registry in the background (at most once every 24 hours, with a short timeout so it never blocks the app) for a newer release, and shows a notice in the header when one is available. It never updates automatically — you decide when to update `@user6m/home-pruner` using whichever package manager you installed it with (npm, pnpm, yarn, etc.).

To disable the check, add `"checkForUpdates": false` to `~/.home-pruner.json`:

```json
{
	"checkForUpdates": false
}
```

## Development

For contributors: `pnpm start:mock` lets you try out home-pruner (including branch deletion and force deletion) against a disposable, fixture-filled git repository instead of your own, so you don't have to manage test branches in your real repo. See [docs/dev.md](docs/dev.md) for details.

## License

MIT © [user6m](LICENSE)
