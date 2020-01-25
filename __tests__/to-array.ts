import { $ } from '../src'
import { execSync } from 'child_process'
import { createMockOutput } from './lib/create-mock-output'

process.on('unhandledRejection', console.error)

describe('toArray', () => {
    {
        it('renders', async () => {
            const logs = await $('git log HEAD~2.. --format=%s').toArray()

            expect(logs).toStrictEqual(
                execSync('git log HEAD~2.. --format=%s', {
                    encoding: 'utf8',
                })
                    .trim()
                    .split('\n')
            )
        })
    }
})
