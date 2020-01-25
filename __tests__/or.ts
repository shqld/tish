import { $ } from '../src'
import { execSync } from 'child_process'
import { createMockOutput } from './lib/create-mock-output'

process.on('unhandledRejection', console.error)

describe('or', () => {
    {
        const shell = 'false || echo string'

        it(shell, async () => {
            const { res, mock } = createMockOutput()

            await $('false').or($('echo string', { overrideOutput: mock }))

            expect(res.join('')).toStrictEqual(
                execSync(shell, {
                    encoding: 'utf8'
                })
            )
        })
    }
})
