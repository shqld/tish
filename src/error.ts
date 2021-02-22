import { Command } from './command'
import type { CommandResult } from './result'

export class CommandError extends Error {
    status!: number
    command!: Command

    constructor({ status, command }: CommandResult) {
        super()

        Error.captureStackTrace?.(this, CommandError)

        const message = `Command "${command.argv}" failed with exit code ${status}`

        Object.defineProperties(this, {
            message: {
                get() {
                    return message
                },
            },
            status: {
                get() {
                    return status
                },
            },
            command: {
                get() {
                    return command
                },
            },
        })
    }
}

// Avoid mangling for the error name
Object.defineProperty(CommandError, 'name', { value: 'CommmandError' })
