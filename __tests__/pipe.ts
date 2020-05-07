import { $ } from '../src'
import { execSync } from 'child_process'
import { createMockOutput } from './lib/create-mock-output'

process.on('unhandledRejection', console.error)

describe('pipe', () => {
    it('basic', async () => {
        const { res, mock } = createMockOutput()

        await $('echo aaa').pipe($('cat', { output: mock }))

        expect(res.join('')).toStrictEqual(execSync('echo aaa | cat', { encoding: 'utf8' }))
    })

    it('sed', async () => {
        const { res, mock } = createMockOutput()

        await $('echo hello').pipe($('sed "s/hello/こんにちは/"', { output: mock }))

        expect(res.join('')).toStrictEqual(
            execSync("echo hello | sed 's/hello/こんにちは/'", { encoding: 'utf8' })
        )
    })

    it('chained', async () => {
        const { res, mock } = createMockOutput()

        const status = await $('echo aaa')
            .pipe($('cat -n'))
            .pipe($('cat', { output: mock }))

        expect(status).toEqual(0)
        expect(res.join('')).toStrictEqual(
            execSync('echo aaa | cat -n | cat', { encoding: 'utf8' })
        )
    })
})
