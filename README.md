# tish

An easy, performant, portable and safe replacement of shell script with TypeScript, aiming to emulate shell in TypeScript instead of calling `child_process` in fragments.

For those who love TypeScript and are tired of writing shell script.

## Examples

```ts
import { $ } from 'tish'

try {
    await $('git add .')
} catch (err) {
    console.error(err)
}
```

```ts
import * as stream from 'stream'
import * as util from 'util'
import { dir, stderr } from 'tish'

const pipeline = util.promisify(stream.pipeline)

await dir('~/github.com/shqld/tish', async ($) => {
    console.log(await stdout($('git log --oneline').pipe($('head 5'))))

    try {
        await $('git checkout', { '-b': branch })
    } catch ({ status, command }) {
        console.error(err)
        console.error(await stderr(command))
    }

    await pipeline($("echo console.log('tish')"), fs.createWriteStream('./index.js'))

    await $('git add .')
        .then(() => $('git commit', { '-m': message }))
        .catch(
            (err) =>
                console.error(err) ||
                $('echo Rollbacking...').then(() => $('git reset --hard HEAD'))
        )
})
```

<details>
<summary>An advanced example</summary>

```ts
if (await isFileChanged()) {
    await addAndCommit({
        path: '.',
        message: 'Fix a bug',
        opts: { fixup: 'HEAD~1' },
    })

    console.log(await getCommitLogs(3))
}

async function isFileChanged(): Promise<boolean> {
    const isLocalClean = isSuccessfully($('git diff --exit-code'))
    return !isLocalClean
}

interface Log {
    hash: string
    message: string
}

async function getCommitLogs({ lines = 5 }): Promise<Array<Log>> {
    const rawLogs = await stdout($(`git log --oneline ..HEAD~${lines}`))

    return rawLogs.map((log) => ({
        hash: log.slice(0, 7),
        message: log.slice(8),
    }))
}

async function addAndCommit({
    path,
    message,
    opts,
}: {
    path: string
    message: string
    opts: Partial<{ squash: string; fixup: string }>
}): Command {
    return $('git add', [path]).then(
        $('git commit'),
        args({
            '--message': message,
            '--squash': opts.squash,
            '--fixup': opts.fixup,
        })
    )
}
```

</details>

## Why tish

-   Efficient

    Highly optimized with such as Promise, stream, etc. for e.g. piping large stream data.

-   JavaScript-way

    Every command is a pure **promise** and a What's not. You can _await_ it or _catch_ it, and _pipe_ it for optimized operations.

-   Multi-platform

-   Strongly-typed

## Usage

```ts
import { $, stdout, stderr, stdouterr, isSuccessful, shell } from 'tish'

// call simply
// -----------
const result = await $('echo hello') // { status = 0, command: Command }

// or
$('echo hello').then((result) => {
    /*...*/
})

// run sequencially
// ----------------
$('git add .')
    .then(() => $('git commit -m "my commit"'))
    .then(() => {
        /*...*/
    })

// run parallel
// ------------
await Promise.allSettled($('git add file_a'), $('git add file_b')).then((results) => {
    /*...*/
})

// read lines async
// ----------------
for await (const log of $('git log --oneline')) {
    console.log(log)
}

// pipe to/from stream
// -------------------
fs.createReadStream('file_a').pipe($('gzip')).pipe(fs.createWriteStream('file_b'))

// pipe to/from command
// --------------------
$('echo hello, world.').pipe($('grep -o world.')).pipe($('xargs echo hello,')) // hello, world.

// get outputs
// -----------
const out = await stdout($('echo hello'))
const err = await stderr($('git non-existent-command'))
const outerr = await stdouterr($('echo hello'))

// error catch
// -----------
try {
    await $('non-existent-command')
} catch ({ status, command }) {
    console.error(status)
    console.error(await stderr(command))
}

// run conditionally
// -----------------
$('git diff --exit-code') // if no diff
    .then(() => console.log('no file changes'))
    .catch(() => $('git commit .'))

// or
if (await isSuccessful($('git diff --exit-code'))) {
    console.log('no file changes')
} else {
    await $('git commit .')
}

// extend shell
// ------------
const { $ } = shell({
    cwd: path.resolve('projects'),
    env: {
        NODE_ENV: 'development',
    },
})
```

## Install

```sh
$ npm install -D tish
$ yarn add -D tish
```

## What's not

-   NOT a replacement/enhancement of `child_process.*`

## Motivation

Writing shell script is simply hard. Sometimes we’d like to write some operations in JavaScript(TypeScript).

However it's also tough to write a script in JavaScript with `child_process` of Node.js and since since a single Node.js process takes ~30ms at least for the startup and consumes a lot of memory, it's not suitable for iterations such as inside of `xargs` or something.

Also, when it comes to write everything in JavaScript then, still there would be a problem: performance. Even using great libraries that wraps `child_process` such as https://github.com/sindresorhus/execa, still it’s hard to write a performant script for multiple related operations.

We need a library that entirely replace shell script with JavaScript keeping performance.
