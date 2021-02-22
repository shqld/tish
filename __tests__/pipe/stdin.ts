import { Readable } from 'stream'

import { $ } from '../../src'
import { MockProcess } from '../../__mock__/process'
import { MockReadable } from '../lib/mock-stream'

process.on('unhandledRejection', console.error)

const FIXTURE_TEXT = 'Hello, world.'

function fromString(source: Array<string>): Readable {
    return new Readable({
        read() {
            for (const chunk of source) {
                this.push(chunk, 'utf8')
            }
            this.push(null)
        },
    })
}

function toString(readable: Readable): Promise<string> {
    return new Promise((resolve, reject) => {
        const buf: Array<Buffer> = []
        readable.on('data', (chunk) => buf.push(chunk))
        readable.on('end', () => resolve(Buffer.concat(buf).toString()))
        readable.on('error', reject)
    })
}

describe.skip('command samples', () => {
    test('cat', async () => {
        expect(await toString(fromString(['hello']).pipe($('cat')))).toBe('hello')
    })
    test('grep', async () => {
        expect(await toString(fromString(['hello']).pipe($('grep hello')))).toBe('hello\n')
    })
    test('grep -o', async () => {
        expect(await toString(fromString(['hello']).pipe($('grep -o he')))).toBe('he\n')
    })
    test('sed', async () => {
        expect(await toString(fromString(['hello']).pipe($('sed "s/hello/こんにちは/"')))).toBe(
            'こんにちは\n'
        )
    })
})

describe('pipe', () => {
    describe('stdin', () => {
        it('from stream', () => {
            const source = new MockReadable(FIXTURE_TEXT.split(''))

            const proc = new MockProcess({ status: 0 })

            const command = $(proc)

            const spies = {
                source: {
                    push: jest.spyOn(source, 'push'),
                },
                command: {
                    write: jest.spyOn(command, 'write'),
                },
                proc: {
                    stdin: {
                        write: jest.spyOn(proc.stdin, 'write'),
                    },
                },
            }

            source.pipe(command)

            return Promise.all([
                new Promise((resolve, reject) => source.once('end', resolve).once('error', reject)),
                new Promise((resolve, reject) =>
                    command.once('finish', resolve).once('error', reject)
                ),
                new Promise((resolve, reject) =>
                    proc.stdin.once('finish', resolve).once('error', reject)
                ),
            ]).then(() => {
                expect(
                    Buffer.concat(
                        spies.source.push.mock.calls.map(([buf]) => buf).filter(Boolean)
                    ).toString()
                ).toBe('Hello, world.')

                expect(
                    Buffer.concat(
                        spies.command.write.mock.calls.map(([buf]) => buf).filter(Boolean)
                    ).toString()
                ).toBe('Hello, world.')

                expect(
                    Buffer.concat(
                        spies.proc.stdin.write.mock.calls.map(([buf]) => buf).filter(Boolean)
                    ).toString()
                ).toBe('Hello, world.')
            })
        })

        it.todo('from command stdout')
        it.todo('from child_process stdin')
    })
})
