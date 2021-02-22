import * as rl from 'readline'
import { Duplex, DuplexOptions, Readable, Writable } from 'stream'
import { ChildProcess } from 'child_process'
import { inherits } from 'util'

import spawn from 'cross-spawn'
import _debug, { Debugger } from 'debug'

import { Process } from './process'
import type { CommandResult } from './result'
import { CommandError } from './error'
import { cloneReadable } from './util'

const debug = _debug('tish')

export type Options = Partial<{
    cwd: string
    env: Record<string, string>
    timeout: number
    stream: DuplexOptions
}>

type OnFulfilled<T> = (result: CommandResult) => T
type OnRejected<T> = (error: unknown | CommandError) => T

const defaultOptions: Options = Object.freeze({
    env: undefined,
    cwd: undefined,
    timeout: undefined,
})

type CommandArgs = [args: Array<string>, options?: Options] | [options?: Options]

export interface Command extends Duplex {}

export class Command implements Duplex, Promise<CommandResult> {
    public [Symbol.toStringTag] = 'Command'

    public readonly _id: number
    public readonly _name: string
    public readonly _args: Array<string>
    public _stdout: Readable | null
    public _stderr: Readable | null

    private _proc: Process
    private readonly _debug: Debugger

    static create(command: string | Process, ...args: CommandArgs): Command {
        return new Command(command, ...args)
    }

    constructor(command: string | Process, ...args: CommandArgs) {
        const [commandArgs, userOptions] = args.length === 2 ? args : [, args[0]]
        const options = { ...defaultOptions, ...userOptions }

        Duplex.call(this, options.stream)

        if (typeof command === 'string') {
            if (commandArgs) {
                command += ' '
            }

            const [name, ...args] = command.split(' ')

            this._proc = spawn(name, args, {
                stdio: 'pipe',
                cwd: options.cwd,
                env: options.env,
                timeout: options.timeout,
            })
            this._name = name
            this._args = args
        } else {
            this._proc = command
            this._name = this._proc.spawnfile
            this._args = this._proc.spawnargs
        }

        this._id = this._proc.pid
        this._debug = debug.extend(this._name).extend((this._id as unknown) as string)

        this._debug('spawn (pid: %s)', this._id)

        if (this._proc.stdin) {
            this.once('unpipe', () => {
                this._proc.stdin!.end()
            })
            this.once('end', () => {
                this._proc.stdin!.end()
            })
        }

        this._stdout = this._proc.stdout
        this._stderr = this._proc.stderr

        if (this._proc.stdout) {
            let backpressured = false

            this._proc.stdout.on('data', (data) => {
                if (backpressured) {
                    this.once('drain', () => {
                        backpressured = false
                        this.push(data)
                    })
                } else if (!this.push(data)) {
                    backpressured = true
                    this._debug('backpressure')
                }
            })

            this._proc.stdout.once('end', () => {
                process.nextTick(() => this.push(null))
            })
        }
    }

    get argv(): string {
        return [this._name, this._args].join(' ')
    }

    get process(): Readonly<ChildProcess> {
        return this._proc as ChildProcess
    }

    public [Symbol.asyncIterator](): AsyncIterableIterator<string> {
        return rl
            .createInterface({
                input: this,
                crlfDelay: Infinity,
            })
            [Symbol.asyncIterator]()
    }

    public then(): Promise<void>
    public then<T>(onFulfilled: OnFulfilled<T>): Promise<T>
    public then<T, C>(onFulfilled: OnFulfilled<T>, onRejected: OnRejected<C>): Promise<T | C>
    public then(onFulfilled?: OnFulfilled<any>, onRejected?: OnRejected<any>): Promise<any> {
        return this._chain.then(onFulfilled, onRejected)
    }

    public catch(): Promise<void>
    public catch<C>(onRejected: OnRejected<C>): Promise<C>
    public catch(onRejected?: OnRejected<any>): Promise<any> {
        return this._chain.catch(onRejected)
    }

    public finally(onFinally?: () => void) {
        return this._chain.finally(onFinally)
    }

    public _read(_size: number): void {}
    public _write(
        chunk: any,
        encoding: BufferEncoding,
        done: (error: Error | null | undefined) => void
    ): void {
        this._proc.stdin?.write(chunk, encoding, done)
    }

    private _promise: Promise<unknown> = Promise.resolve()
    private get _chain(): Promise<CommandResult> {
        return this._promise.then(
            () =>
                new Promise((resolve, reject) => {
                    this._proc.on('exit', (status) => {
                        if (typeof status !== 'number') {
                            throw new Error('Command exited unsuccessfully')
                        }

                        const result = { status, command: this }

                        if (status === 0) {
                            resolve(result)
                        } else {
                            if (this._proc.stdout) {
                                this._stdout = cloneReadable(this._proc.stdout)
                            }
                            if (this._proc.stderr) {
                                this._stderr = cloneReadable(this._proc.stderr)
                            }

                            reject(new CommandError(result))
                        }
                    })
                })
        )
    }
}

inherits(Command, Duplex)
