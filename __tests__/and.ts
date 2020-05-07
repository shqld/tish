import { $ } from '../src'
import { execSync } from 'child_process'
import { createMockOutput } from './lib/create-mock-output'

process.on('unhandledRejection', console.error)

describe('and', () => {
    {
        const shell = 'echo first && echo second'

        it(shell, async () => {
            const first = createMockOutput()
            const second = createMockOutput()

            await $('echo first', { output: first.mock }).and(
                $('echo second', { output: second.mock })
            )

            expect([...first.res, ...second.res].join('')).toStrictEqual(
                execSync(shell, {
                    encoding: 'utf8',
                })
            )
        })
    }

    {
        const shell = 'sleep 0.1 && echo string'

        it(shell, async () => {
            const { res, mock } = createMockOutput()

            await $('sleep 0.1').and($('echo string', { output: mock }))

            expect(res.join('')).toStrictEqual(
                execSync(shell, {
                    encoding: 'utf8',
                })
            )
        })
    }
})
