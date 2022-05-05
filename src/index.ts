import { Command } from './command'
import { defaultOptions } from './options'
import { shell, CommandFactory } from './shell'
import { isNonNullable } from './util'

export * from './command'
export { CommandError } from './error'
export { shell } from './shell'

export const $: CommandFactory = shell(defaultOptions)

export function isSuccessful(command: Command): Promise<boolean> {
    return command.then(
        () => true,
        () => false
    )
}

export function stdout(command: Command): Promise<string | null> {
    if (!command._stdout) return Promise.resolve(null)

    const stream = command._stdout
    const buf: Array<Buffer> = []
    const push = (chunk: Buffer) => buf.push(chunk)

    // FIXME: clone readable
    return new Promise((resolve, reject) =>
        stream
            .on('data', push)
            .once('end', () => {
                stream.off('data', push)
                resolve(Buffer.concat(buf).toString().trim())
            })
            .once('error', (err) => {
                stream.off('data', push)
                reject(err)
            })
            .once('close', () => {
                reject(new Error('Stream already closed'))
            })
    )
}

export function stderr(command: Command): Promise<string | null> {
    if (!command._stderr) return Promise.resolve(null)

    const stream = command._stderr
    const buf: Array<Buffer> = []
    const push = (chunk: Buffer) => buf.push(chunk)

    if (stream.destroyed) {
        throw new Error('stderr has already been destroyed')
    }

    // FIXME: clone readable
    return new Promise((resolve, reject) =>
        stream
            .on('data', push)
            .once('end', () => {
                stream.off('data', push)
                resolve(Buffer.concat(buf).toString().trim())
            })
            .once('error', (err) => {
                stream.off('data', push)
                reject(err)
            })
            .once('close', () => {
                reject(new Error('Stream already closed'))
            })
    )
}

export function stdouterr(command: Command): Promise<string> {
    const { _stdout, _stderr } = command

    const streams = [_stdout, _stderr].filter(isNonNullable)
    const buf: Array<Buffer> = []
    const push = (chunk: Buffer) => buf.push(chunk)

    return new Promise((resolve, reject) =>
        streams.map((stream) =>
            stream
                .on('data', push)
                .once('end', () => {
                    stream.off('data', push)
                    resolve(Buffer.concat(buf).toString().trim())
                })
                .once('error', (err) => {
                    stream.off('data', push)
                    reject(err)
                })
        )
    )
}

type Falsy = null | undefined

export function args(args: Record<string, string | number | boolean | Falsy>): Array<string> {
    const _args = []

    for (const key in args) {
        const val = args[key]

        if (typeof val === 'string') {
            _args.push(key, val)
        } else if (typeof val === 'number') {
            _args.push(key, val.toString())
        } else if (val) {
            _args.push(key)
        }
    }

    return _args
}
