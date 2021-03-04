# Tish

> Auf den Tisch machen wir alles 😎

Tish stands for `Tisch`, `(Java)TypeScript` and `ShellScript`, yay.

NOTE: still _under active development_ for now.

## Install

```sh
$ npm install -D tish
$ yarn add -D tish
```

## Usage

```ts
import { $ } from 'tish'

// $ echo hello && echo world | sed 's/world/世界/'

$('echo hello').and('echo world').pipe('sed "s/world/世界/"')
// nothing happens

await $('echo hello').and('echo world').pipe('sed "s/world/世界/"')
// child processes are actually run
```

## Points

### Totally Promise

You can do anything such as `then/catch` or `async/await/catch`.

### Multi-platform

Support for e.g. Windows, POSIX

### Optimized

Handling large data is optimized with `streams`, so that large data.

### Lazy

No child process are run unless called with `await` keyword or `then` method, even if they are chained.

## Usage

```ts
// call simply
const result = await $('echo hello')
// or
$('echo hello')
    .then(result => {})

// run sequencially
$('git add .')
    .then($('git commit -m "commit"')

// run parallel
await Promise.allSettled(
    $('git add file_a'),
    $('git add file_b'),
)

// read lines async
for await (const log of $('git log --oneline')) {
    console.log(log)
}

// pipe to/from
fs.createReadStream('file_a')
    .pipe($('gzip'))
    .pipe(fs.createWriteStream('file_b'))
```

## Roadmap

-   [ ] Enriching options, e.g. watermark, etc...
-   [ ] Support `&` operator
-   [ ] Support auto escaping for quotes, regex etc.
-   [x] Optimization with generators for large array
-   [ ] Handling stderr
-   [ ] Handling shell variable
-   [ ] Creating child instances set options by default
-   [ ] Support `set` command for shell configuration
-   [ ] Wrap thrown error by ChildProcess with a dedicated Error
-   [x] Trim output string by default when `toString`
-   [x] Implement `toNumber` and `toBoolean`

## Usecases

```sh
$ echo hello | sed 's/hello/こんにちは/' && echo world
```

```js
await $('echo hello').pipe("sed 's/hello/こんにちは/'").and('echo world')
```

### `>` and `||`

```sh
$ [ -s $file_path ] || echo "hello, world" > $file_path
```

```js
await $('[ -s $file_path ]').or('echo "hello, world"').toFile('$file_path')

// ----- You can make code more readable ------

const doesFileExist = $('[ -s $file_path ]')
const createFile = $('echo "hello, world"').toFile('$file_path')

await doesFileExist.or(createFile)
```

### `for` iteration

```sh
$ for log in `git log --oneline HEAD~2..`; do
  # some operations...
done
```

```js
for await (const log of $('git log --oneline HEAD~2..')) {
    // some operations...
}
```

### `if` control

```sh
$ if (git diff --quiet); then
  # no change
else
  # changed
fi
```

```js
if (await $('git diff --quiet').toBoolean()) {
    // no change
} else {
    // changed
}
```
