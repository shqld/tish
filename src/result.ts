import { ChildProcess } from 'child_process'
import { Readable } from 'stream'
import { Command } from './command'
import { Output } from './output'

export interface CommandResult {
    command: string
    status: number
    stdout?: Output
    stderr?: Output
}
