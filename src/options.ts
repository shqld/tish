import { DuplexOptions } from 'stream'
import { CommandFactory } from './shell'

export type Options = Partial<{
    cwd: string
    env: Record<string, string>
    extends: CommandFactory
    timeout: number
    stream: DuplexOptions
}>

export const defaultOptions: Options = Object.freeze({
    env: undefined,
    cwd: undefined,
    timeout: undefined,
})
