import { PassThrough, Readable, Writable } from 'stream'
import spawn from 'cross-spawn'
import createDebug from 'debug'
import { LazyPromise } from './lazy-promise'
import { Output } from './output'
import { CommandResult } from './result'

const debug = createDebug('tish')

const getId = () => {
    const d = new Date()
    return `${d.getUTCMilliseconds()}${Math.floor(Math.random() * 100)}`
}

export type Options = Partial<{
    cwd: string
    env: Record<string, string>
    timeout: number
}>

const defaultOptions: Readonly<Options> = Object.freeze({
    env: undefined,
    cwd: undefined,
    timeout: undefined,
})

export class CommandError extends Error {
    result: CommandResult

    constructor(result: CommandResult) {
        super('Command Failed')

        this.result = result
    }
}

CommandError.prototype.name = 'CommandError'

export class Command extends LazyPromise<CommandResult> {
    public readonly options: Readonly<Options>
    public [Symbol.toStringTag] = 'Command'

    private id: string
    private readonly command: string
    private result?: CommandResult
    private debug: (...args: Array<any>) => void
    private stdio: Partial<{ stdin: Readable; stdout: Writable; stderr: Writable }> = {
        stdin: undefined,
        stdout: undefined,
        stderr: undefined,
    }

    static create = (command: string, options?: Options): Command => {
        return new Command(command, options)
    }

    static context(options: Options): typeof Command.create
    static context<T, Callback extends ($: typeof Command.create) => Promise<T>>(
        options: Options,
        callback: Callback
    ): Promise<T | void>

    static context(
        context: Options,
        callback?: Function
    ): typeof Command.create | Promise<unknown> {
        const create = (command: string, options?: Options) =>
            Command.create(command, { ...context, ...options })

        return callback ? callback(create) : create
    }

    constructor(command: string, options?: Options) {
        super()

        this.id = getId()
        this.command = command
        this.options = { ...defaultOptions, ...options }

        const scopedDebug = debug.extend(this.id)
        this.debug = (...args) => scopedDebug(`(${this.command})`, ...args)

        this.chain = this.exec
    }

    private exec = (): Promise<CommandResult> => {
        this.debug('run')

        if (this.result) {
            const { status } = this.result

            if (status === 0) {
                Promise.resolve(this.result)
            } else {
                Promise.reject(new CommandError(this.result))
            }
        }

        const [name, ...args] = this.command.split(' ')

        const proc = spawn(name, args, {
            stdio: [this.stdio.stdin, this.stdio.stdout, this.stdio.stderr],
            cwd: this.options.cwd,
            env: this.options.env,
            timeout: this.options.timeout,
            shell: true,
        })

        return new Promise((resolve, reject) => {
            proc.on('exit', (status) => {
                this.debug('exit', { status })

                proc.on('close', () => {
                    this.debug('close')

                    if (typeof status !== 'number') {
                        // TODO(@shqld): a dedicated error
                        throw new Error()
                    }

                    const result: CommandResult = {
                        command: this.command,
                        status,
                        stdout: proc.stdout ? new Output(proc.stdout) : undefined,
                        stderr: proc.stderr ? new Output(proc.stderr) : undefined,
                    }

                    this.result = result

                    if (status === 0) {
                        resolve(result)
                    } else {
                        reject(new CommandError(result))
                    }
                })
            })
        })
    }

    toString(source: 'stdout' | 'stderr' | 'both' = 'stdout'): Output {
        const stream = new PassThrough()

        if (source === 'both' || source === 'stdout') this.stdio.stdout = stream
        if (source === 'both' || source === 'stdout') this.stdio.stderr = stream

        return new Output(stream)
    }

    pipe(command: Command | string): Command {
        const next = command instanceof Command ? command : Command.create(command)

        const passThrough = new PassThrough()

        this.stdio.stdout = passThrough
        next.stdio.stdin = passThrough

        const chain = next.chain
        next.chain = () => this.then(chain)

        return next
    }

    async quiet(): Promise<boolean> {
        try {
            await this
            return true
        } catch (err) {
            if (err instanceof CommandError && err.result.status === 1) {
                return false
            }

            throw err
        }
    }
}
