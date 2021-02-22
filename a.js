/** @type {import('./src')} */
const tish = require('./dist')

const { $, Command, stdout, stderr, stdouterr, CommandError } = tish

main()

async function main() {
    try {
        await $('git a')
    } catch (err) {
        console.error(err)

        const { status, command } = err
        console.error(await stderr(command))
    }

    try {
        // console.log(await stdout($('git log --oneline').pipe($('grep fix'))))
        // for await (const log of $('git log --oneline').pipe($('head'))) {
        //     const hash = log.slice(0, 7)
        //     const message = log.slice(8)
        //     console.log({ hash, message })
        // }
        // const out = await stdout($('git log --').pipe($('head')))
        // console.log(out)
        // const out = await stdout(
        //     $('echo hello, world.').pipe($('grep -o world.')).pipe($('xargs echo hello,'))
        // )
        // console.log(out)
    } catch (err) {
        if (err instanceof CommandError) {
            const { status, command } = err

            console.log('catched: status=%s', command._id)

            await stdouterr(command)
                .then((str) => {
                    console.log('done')
                    console.log('==========')
                    console.log(str)
                })
                .catch((err) => {
                    console.log('err')
                    console.log('==========')
                    console.log(err)
                })
        }
    }
}
