import EventEmitter from 'events'
import { write } from 'fs'
import { emit } from 'process'
import { Duplex, PassThrough, Readable, Writable } from 'stream'
import { MockReadable, MockWritable } from '../__tests__/lib/mock-stream'
import { Process } from '../src/process'

export class MockProcess extends EventEmitter implements Process {
    private static pid = 0
    private status: number

    pid = MockProcess.pid++
    spawnfile = 'mock'
    spawnargs = []

    // @ts-expect-error
    on: Process['on']

    stdin: Writable
    stdout: Readable
    stderr: Readable

    private mock: Record<string, Array<Buffer>> = {
        stdin: [],
        stdout: [],
        stderr: [],
    }

    constructor({
        status,
        stdin = [],
        stdout = [],
        stderr = [],
    }: {
        status: number
        stdin?: string | Array<string>
        stdout?: string | Array<string>
        stderr?: string | Array<string>
    }) {
        super()

        this.status = status

        stdin = typeof stdin === 'string' ? [stdin] : stdin

        this.stdin = new MockWritable()
        this.stdout = new MockReadable(typeof stdout === 'string' ? [stdout] : stdout)
        this.stderr = new MockReadable(typeof stderr === 'string' ? [stderr] : stderr)

        process.nextTick(() => this.emit('exit', this.status))
    }
}
