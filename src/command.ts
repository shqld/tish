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
    input?: Readable
    output?: Writable
}

export type Options = Partial<Config>

const defaultConfig: Config = Object.freeze({
    input: undefined,
    output: undefined,
})

const initialChain = () => Promise.resolve()

export interface Result {}
export interface Success extends Result {
    status: 0
    proc: cp.ChildProcess
}
export interface Failure extends Result {
    status: number
    proc: cp.ChildProcess
}

abstract class LazyPromise<T, C> implements PromiseLike<T> {
    protected chain: () => Promise<any>

    constructor() {
        this.chain = initialChain
    }

    abstract run(): Promise<any>

    then<TResult1 = T, TResult2 = C>(
        onFulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null,
        onRejected?:
            | ((
                  reason: C | Error
              ) => TResult1 | PromiseLike<TResult1> | TResult2 | PromiseLike<TResult2>)
            | null
    ): Promise<TResult1 | TResult2> {
        // this.debug('then')

        return this.chain()
            .then(() => this.run())
            .then(onFulfilled)
            .catch(onRejected)
    }

    catch<T>(onRejected: (result: Failure) => T): Promise<any> {
        // this.debug('catch')

        return this.chain().then(null, onRejected)
    }
}

export class Command extends LazyPromise<Success, Failure> {
    public readonly name: string
    public readonly args: Array<string>
    public readonly config: Config
    public [Symbol.toStringTag] = 'Command'

    private id: string
    private debug: (...args: Array<any>) => void

    constructor(name: string, args: Array<string>, options?: Options) {
        super()

        this.id = getId()

        this.name = name
        this.args = args

        // needed for extend
        const Class = this.constructor as typeof Command

        this.config = {
            ...Class.defaultConfig,
            ...options,
        }

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

    run(): Promise<Result> {
        this.debug('run')

        const proc = spawn(this.name, this.args, {
            stdio: 'pipe',
            shell: true,
        })

        if (this.config.output && proc.stdout) proc.stdout.pipe(this.config.output)
        // TODO(@shqld)
        proc.stderr?.pipe(process.stderr)

        if (this.config.input && proc.stdin) this.config.input.pipe(proc.stdin)

        return new Promise((resolve, reject) => {
            proc.on('exit', (status) => {
                this.debug('exit', { status })

                proc.on('close', () => {
                    this.debug('close')

                    if (typeof status !== 'number') {
                        // TODO(@shqld): a dedicated error
                        throw new Error()
                    }

                    if (status !== 0) {
                        const result: Failure = { status, proc }
                        reject(result)
                    } else {
                        const result: Success = { status, proc }
                        resolve(result)
                    }
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
        next.config.input = passThrough

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

    // @ts-ignore suppress
    // > Property 'toString' in type 'Command<T>' is not assignable to the same property in base type 'LazyPromise<T>'.
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
        mock.on('data', (chunk) => buf.push(...chunk.trim().split('\n')))

        this.config.output = mock

        return this.then(() => buf)
    }

    toNumber(): Promise<number> {
        return this.then(({ status }) => status).catch(({ status }) => status)
    }

    toBoolean(): Promise<boolean> {
        return this.then(
            () => true,
            () => false
        )
    }
}
