import { $ } from '../src'
import { execSync } from 'child_process'
import { createMockOutput } from './lib/create-mock-output'

describe('toString', () => {
    it('should work with command: echo bbb', async () => {
        const b = await $('echo bbb').toString()
        expect(b).toStrictEqual(execSync('echo bbb', { encoding: 'utf8' }).trim())
    })

    it('should work with command: echo bbb && echo ccc', async () => {
        const { res, mock } = createMockOutput()

        await $('echo bbb')
            .toString()
            .then(() => $('echo ccc', { output: mock }))

        expect(res.join()).toStrictEqual(execSync('echo ccc', { encoding: 'utf8' }))
    })

    it('should trim output string', async () => {
        expect(
            await $(`echo "

            aaa bbb

            "`).toString()
        ).toStrictEqual('aaa bbb')
    })
})
