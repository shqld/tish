import { CommandFactory, shell } from '../src/shell'
import { MockProcess } from '../__mock__/process'

process.on('unhandledRejection', console.error)

describe('shell', () => {
    beforeEach(() => {
        // ensure there's at least one assertion run for every test case
        expect.hasAssertions()
    })

    test('creates a new factory', () => {
        const proc = new MockProcess({
            status: 0,
        })

        const options = Object.freeze({
            env: { SHELL_TEST: 'true' },
            cwd: 'my_dir',
            stream: { allowHalfOpen: true },
            timeout: 10,
        })

        const $ = shell(options)

        expect($(proc).options).toStrictEqual({ ...options })
    })

    test('extends a factory', () => {
        const proc = new MockProcess({
            status: 0,
        })

        const options = Object.freeze({
            env: { SHELL_TEST_1: 'true' },
            cwd: 'my_dir_1',
            stream: { allowHalfOpen: true },
            timeout: 10,
        })

        let $: CommandFactory

        $ = shell(options)

        $ = shell(
            Object.freeze({
                env: {
                    SHELL_TEST_2: 'true',
                },
                cwd: 'my_dir_2',
                stream: {
                    autoDestroy: true,
                },
                timeout: 20,
            }),
            $
        )

        const command = $(proc)

        expect(command.options).not.toStrictEqual({ ...options })
        expect(command.options).toStrictEqual({
            env: {
                SHELL_TEST_1: 'true',
                SHELL_TEST_2: 'true',
            },
            cwd: 'my_dir_2',
            stream: {
                allowHalfOpen: true,
                autoDestroy: true,
            },
            timeout: 20,
        })
    })
})
