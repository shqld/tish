import createDebug from 'debug'
import * as cp from 'child_process'
import * as fs from 'fs'
import { Writable, PassThrough, Readable } from 'stream'
import spawn from 'cross-spawn'

const debug = createDebug('tish')

const getId = () => {
    const d = new Date()
    return `${d.getUTCMilliseconds()}${Math.floor(Math.random() * 100)}`
}

export interface Config {
    output?: Writable
}

export type Options = Partial<Config>

const defaultConfig: Config = Object.freeze({
    output: process.stdout,
})

// @ts-ignore
export class Command extends Promise {
    id: string
    name: string
    args: Array<string>
    config: Config
    status?: number
    promise: () => Promise<any>
    input?: Readable
    private chain: () => Promise<any>
    private debug: (...args: Array<any>) => void;
    // private resolve: Function
    // private reject: Function

    [Symbol.toStringTag] = 'Command'

    constructor(name: string, args: Array<string>, options: Options) {
        // let _resolve, _reject

        super((resolve, reject) => {
            // _resolve = resolve
            // _reject = reject
        })

        // this.resolve = _resolve
        // this.reject = _reject

        this.id = getId()

        this.name = name
        this.args = args

        // needed for extend
        const Class = this.constructor as typeof Command

        this.config = {
            ...Class.defaultConfig,
            ...options,
        }

        this.chain = () => Promise.resolve()

        const scopedDebug = debug.extend(this.id)
        this.debug = (...args) => scopedDebug(`(${[this.name, ...this.args].join(' ')})`, ...args)
    }

    static defaultConfig = defaultConfig

    static create<T extends typeof Command>(
        this: T,
        command: string,
        options?: Options
    ): InstanceType<T> {
        // needed for extend
        const Class: T = this
        const [name, ...args] = command.split(' ')

        return new Class(name, args, options) as InstanceType<T>
    }

    static extend<T extends typeof Command>(this: T, options: Options): T {
        // needed for extend
        const Class = this

        const defaultConfig = {
            ...Class.defaultConfig,
            ...options,
        }

        // @ts-ignore suppress
        // > A mixin class must have a constructor with a single rest parameter of type 'any[]'.ts(2545)
        class ExtendedClass extends Class {
            static defaultConfig = defaultConfig
        }

        return ExtendedClass
    }

    then<T, C>(
        onFulfilled?: (status: number, proc: cp.ChildProcess) => T,
        onRejected?: (status: number, proc: cp.ChildProcess) => C
    ): Promise<any> {
        this.debug('then')

        return this.chain().then(() => {
            this.debug('run')

            const proc = spawn(this.name, this.args, {
                stdio: 'pipe',
                shell: true,
            })

            proc.stdout.pipe(this.config.output)
            proc.stderr.pipe(process.stderr)

            if (this.input) this.input.pipe(proc.stdin)

            return new Promise((resolve, reject) => {
                proc.on('exit', (status) => {
                    proc.on('close', () => {
                        this.debug('exit & close', { status })

                        if (status !== 0) {
                            if (onRejected) reject(onRejected(status, proc))

                            reject(status)
                        } else {
                            if (onFulfilled) resolve(onFulfilled(status, proc))

                            resolve(status)
                        }
                    })
                })
            })
        })
    }

    catch<T>(onRejected: (status: number, proc: cp.ChildProcess) => T): Promise<any> {
        this.debug('catch')

        return this.chain().then(() => {
            this.debug('run')

            const proc = spawn(this.name, this.args)

            proc.stdout.pipe(this.config.output)

            if (this.input) this.input.pipe(proc.stdin)

            return new Promise((resolve) => {
                proc.on('exit', (status) => {
                    proc.on('close', () => {
                        this.debug('exit & close', { status })

                        if (status !== 0) {
                            resolve(onRejected(status, proc))
                        }
                    })
                })
            })
        })
    }

    async *[Symbol.asyncIterator]() {
        const passThrough = new PassThrough()
        passThrough.setEncoding('utf8')

        this.config.output = passThrough

        await this

        yield passThrough.read()
    }

    pipe(command: Command | string): Command {
        this.debug('pipe')

        const next = command instanceof Command ? command : Command.create(command)

        const passThrough = new PassThrough()
        this.config.output = passThrough
        next.input = passThrough

        const chain = next.chain
        next.chain = () => this.then(chain)

        return next
    }

    and(command: Command | string): Command {
        this.debug('and')

        const next = command instanceof Command ? command : Command.create(command)

        const chain = next.chain
        next.chain = () => this.then(chain)

        return next
    }

    or(command: Command | string): Command {
        this.debug('or')

        const next = command instanceof Command ? command : Command.create(command)

        const chain = next.chain
        next.chain = () => this.catch(chain)

        return next
    }

    toString(): Promise<string> {
        const buf: Array<Buffer> = []

        const mock = new PassThrough()
        mock.on('data', (chunk) => buf.push(chunk))

        this.config.output = mock

        return this.then(() => Buffer.concat(buf).toString().trim())
    }

    toFile(filePath: string): Promise<void> {
        this.debug('to')

        this.config.output = fs.createWriteStream(filePath)

        return this.then()
    }

    toArray(): Promise<Array<string>> {
        const buf: Array<string> = []

        const mock = new PassThrough()
        mock.setEncoding('utf8')
        mock.on('data', (chunk) => {
            buf.push(...chunk.trim().split('\n'))
        })

        this.config.output = mock

        return this.then(() => buf)
    }

    toNumber() {
        return this.then((status) => status).catch((status) => status)
    }

    toBoolean() {
        return this.then(() => true).catch(() => false)
    }
}
