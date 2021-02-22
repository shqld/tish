import type { Command } from './command'

export interface CommandResult {
    status: number
    command: Command
}
