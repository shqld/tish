import { $ } from '../src'
import { execSync } from 'child_process'
import { createMockOutput } from './lib/create-mock-output'

process.on('unhandledRejection', console.error)

describe('then', () => {
    describe('then/catch', () => {
        it('single', () => {
            const { res, mock } = createMockOutput()

            return $('echo string', { overrideOutput: mock }).then((status) => {
                expect(status).toEqual(0)
                expect(res.join()).toStrictEqual(execSync('echo string', { encoding: 'utf8' }))
            })
        })

        it('with chain', () => {
            const first = createMockOutput()
            const second = createMockOutput()

            return $('echo first', { overrideOutput: first.mock })
                .then((status) => {
                    expect(status).toEqual(0)
                    expect(first.res.join()).toStrictEqual(
                        execSync('echo first', { encoding: 'utf8' })
                    )

                    return $('echo second', { overrideOutput: second.mock })
                })
                .then((status) => {
                    expect(status).toEqual(0)
                    expect(second.res.join()).toStrictEqual(
                        execSync('echo second', { encoding: 'utf8' })
                    )
                })
        })

        it('with sleep', () => {
            const { res, mock } = createMockOutput()

            return $('sleep 0.001')
                .then((status) => {
                    expect(status).toEqual(0)
                    return $('echo string', { overrideOutput: mock })
                })
                .then((status) => {
                    expect(status).toEqual(0)
                    expect(res.join()).toStrictEqual(execSync('echo string', { encoding: 'utf8' }))
                })
        })

        it('with sleep async', () => {
            const { res, mock } = createMockOutput()

            const c1 = $('sleep 0.1')
            const c2 = $('echo string', { overrideOutput: mock })

            c1.then(() => c2).then((status) => {
                expect(status).toEqual(0)
                expect(res.join()).toStrictEqual(execSync('echo string', { encoding: 'utf8' }))
            })
        })

        it('async/await', async () => {
            const { res, mock } = createMockOutput()

            const status = await $('echo string', { overrideOutput: mock })

            expect(status).toEqual(0)
            expect(res.join()).toStrictEqual(execSync('echo string', { encoding: 'utf8' }))
        })

        it('async/await chained', async () => {
            const { res, mock } = createMockOutput()

            await $('sleep 0.001')
            const status = await $('echo string', { overrideOutput: mock })

            expect(status).toEqual(0)
            expect(res.join()).toStrictEqual(execSync('echo string', { encoding: 'utf8' }))
        })
    })
})
