import fs from 'fs'
import { $, args, isSuccessful, stderr, stdout, stdouterr } from './src'

async function main() {
    $('echo hello').pipe($('asdf'))

    $('echo hello').pipe(fs.createWriteStream('aaa'))

    fs.createReadStream('a').pipe($('cat'))

    if (await $('echo 111')) {
    }

    for await (const a of $('aaa')) {
    }

    $('adsf')
        .then(() => $('asdf'))
        .catch(() => $('adsf'))

    if (await isSuccessful($('asdf'))) {
        console.log('========')
    }

    const out = await stdout($('asdf'))
    const err = await stderr($('asdf'))
    const outerr = await stdouterr($('asdf'))

    console.log({
        out,
        err,
        outerr,
    })

    // const shell = new Shell()
    // const { $ } = shell({
    //     env: {},
    //     cwd: {},
    // })

    // Subshell?
    // $.sub({})

    const something = 1

    // Conditional args
    $(
        'asdf',
        args({
            '--asdf': !something,
            '-n': something && 2,
        })
    )
}
