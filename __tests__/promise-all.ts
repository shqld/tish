import { $ } from '../src'
import { execSync } from 'child_process'
import { createMockOutput } from './lib/create-mock-output'

process.on('unhandledRejection', console.error)

describe('Promise.all', () => {
    it('asdf', async () => {
        const output1 = createMockOutput()
        const output2 = createMockOutput()

        await Promise.all([
            $('echo aaa', { output: output1.mock }),
            $('echo bbb', { output: output2.mock }),
        ])

        const res = output1.res.concat(output2.res).join('')
        expect(res).toStrictEqual(execSync('echo aaa; echo bbb', { encoding: 'utf8' }))
    })

    it('bbb', async () => {
        const output1 = createMockOutput()
        const output2 = createMockOutput()

        await Promise.all([
            $('sleep 0.1').then(() => $('echo slept', { output: output1.mock })),
            $('echo bbb', { output: output2.mock }),
        ])

        const res = output1.res.concat(output2.res)
        expect(res.join()).toContain('slept')
        expect(res.join()).toContain('bbb')
    })
})
