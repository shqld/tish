import { $ } from '../../src'
import { MockProcess } from '../../__mock__/process'
import { MockWritable } from '../lib/mock-stream'

process.on('unhandledRejection', console.error)

describe('pipe', () => {
    describe('stdout', () => {
        it('to stream', () => {
            const destination = new MockWritable()

            const proc = new MockProcess({
                status: 0,
                stdout: 'Hello, world.',
            })

            const command = $(proc)

            const spies = {
                command: {
                    push: jest.spyOn(command, 'push'),
                },
                proc: {
                    stdout: {
                        push: jest.spyOn(proc.stdout, 'push'),
                    },
                },
                destination: {
                    write: jest.spyOn(destination, 'write'),
                },
            }

            command.pipe(destination)

            setTimeout(() => destination.emit('finish'), 1)

            return Promise.all([
                new Promise((resolve, reject) =>
                    proc.stdout.once('end', resolve).once('error', reject)
                ),
                new Promise((resolve, reject) =>
                    command.once('end', resolve).once('error', reject)
                ),
                new Promise((resolve, reject) =>
                    destination.once('finish', resolve).once('error', reject)
                ),
            ]).then(() => {
                expect(
                    Buffer.concat(
                        spies.proc.stdout.push.mock.calls.map(([buf]) => buf).filter(Boolean)
                    ).toString()
                ).toBe('Hello, world.')

                expect(
                    Buffer.concat(
                        spies.command.push.mock.calls.map(([buf]) => buf).filter(Boolean)
                    ).toString()
                ).toBe('Hello, world.')

                expect(
                    Buffer.concat(
                        spies.destination.write.mock.calls.map(([buf]) => buf).filter(Boolean)
                    ).toString()
                ).toBe('Hello, world.')
            })
        })

        it.todo('to child_process stdin')
        it.todo('to command stdin')
    })
})
