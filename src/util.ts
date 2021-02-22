import { Readable, PassThrough } from 'stream'
import pump from 'pump'

export function isNonNullable<T>(value: T | null | undefined): value is T {
    return value !== null && value !== undefined
}

export function cloneReadable(readable: Readable): Readable {
    return pump(readable, new PassThrough()) as Readable
}
