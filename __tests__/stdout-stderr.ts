import { $, stderr, stdout, stdouterr } from '../src'
import { MockProcess } from '../__mock__/process'

describe('stdout', () => {
    beforeEach(() => {
        // ensure there's at least one assertion run for every test case
        expect.hasAssertions()
    })

    test('stdout', () => {
        const proc = new MockProcess({
            status: 0,
            stdout: 'hello',
        })

        const command = $(proc)

        const onResolved = (stdout: string | null) => {
            expect(stdout).toBe('hello')
        }

        return Promise.all([stdout(command)?.then(onResolved), stdout(command)?.then(onResolved)])
    })

    test('stderr', () => {
        const proc = new MockProcess({
            status: 0,
            stderr: 'world',
        })

        const command = $(proc)

        const onResolved = (stderr: string | null) => {
            expect(stderr).toBe('world')
        }

        return Promise.all([stderr(command)?.then(onResolved), stderr(command)?.then(onResolved)])
    })

    test('stdouterr', () => {
        const proc = new MockProcess({
            status: 0,
            stdout: 'hello, ',
            stderr: 'world',
        })

        const command = $(proc)

        const onResolved = (stdouterr: string) => {
            expect(stdouterr).toBe('hello, world')
        }

        return Promise.all([
            stdouterr(command)?.then(onResolved),
            stdouterr(command)?.then(onResolved),
        ])
    })
})
