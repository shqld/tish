import { $ } from '../src'
import { execSync } from 'child_process'

process.on('unhandledRejection', console.error)

describe('or', () => {
    {
        const shell = 'git log HEAD~3'

        it(shell, async () => {
            const res = []

            for await (const log of $('git log HEAD~3')) {
                res.push(log)
            }

            expect(res.join('')).toStrictEqual(
                execSync(shell, {
                    encoding: 'utf8',
                })
            )
        })
    }
})
