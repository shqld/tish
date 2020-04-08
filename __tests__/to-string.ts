import { $ } from '../src'
import { execSync } from 'child_process'
import { createMockOutput } from './lib/create-mock-output'

describe('toString', () => {
    it('asdf', async () => {
        const b = await $('echo bbb').toString()
        expect(b).toStrictEqual(execSync('echo bbb', { encoding: 'utf8' }))
    })

    it('', async () => {
        const { res, mock } = createMockOutput()

        await $('echo bbb')
            .toString()
            .then(() => $('echo ccc', { overrideOutput: mock }))

        expect(res.join()).toStrictEqual(execSync('echo ccc', { encoding: 'utf8' }))
    })
})
