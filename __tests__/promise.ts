import { $ } from '../src'
import { CommandError } from '../src/error'
import { CommandResult } from '../src/result'
import { MockProcess } from '../__mock__/process'

process.on('unhandledRejection', () => process.exit(1))

describe('promise', () => {
    beforeEach(() => {
        // ensure there's at least one assertion run for every test case
        expect.hasAssertions()
    })

    describe('then', () => {
        test('resolve CommandResult when command exit successfully', () => {
            const proc = new MockProcess({
                status: 0,
            })

            const command = $(proc)

            const procOnExit = jest.fn().mockImplementation((status: number) => {
                expect(status).toBe(0)
            })

            proc.once('exit', procOnExit)

            const onResolved = jest.fn().mockImplementation((result: CommandResult) => {
                expect(result.status).toBe(0)
                expect(result.command).toBe(command)
            })
            const onRejected = jest.fn()

            return command.then(onResolved, onRejected).finally(() => {
                expect(procOnExit).toHaveBeenCalled()
                expect(onResolved).toHaveBeenCalled()
                expect(onRejected).not.toHaveBeenCalled()
            })
        })

        test('reject CommandError when command fails', () => {
            const proc = new MockProcess({
                status: 1,
            })

            const command = $(proc)

            const procOnExit = jest.fn().mockImplementation((status: number) => {
                expect(status).toBe(1)
            })

            proc.once('exit', procOnExit)

            const onResolved = jest.fn()
            const onRejected = jest.fn().mockImplementation((error: unknown) => {
                expect(error).toBeInstanceOf(CommandError)
                expect((error as CommandError).status).toBe(1)
                expect((error as CommandError).command).toBe(command)
            })

            return command.then(onResolved, onRejected).finally(() => {
                expect(procOnExit).toHaveBeenCalled()
                expect(onResolved).not.toHaveBeenCalled()
                expect(onRejected).toHaveBeenCalled()
            })
        })
    })

    describe('catch', () => {
        test('reject CommandError when command fails', () => {
            const proc = new MockProcess({
                status: 1,
            })

            const command = $(proc)

            const procOnExit = jest.fn().mockImplementation((status: number) => {
                expect(status).toBe(1)
            })

            proc.once('exit', procOnExit)

            const onRejected = jest.fn().mockImplementation((error: unknown) => {
                expect(error).toBeInstanceOf(CommandError)
                expect((error as CommandError).status).toBe(1)
                expect((error as CommandError).command).toBe(command)
            })

            return command.catch(onRejected).finally(() => {
                expect(procOnExit).toHaveBeenCalled()
                expect(onRejected).toHaveBeenCalled()
            })
        })
    })
})
