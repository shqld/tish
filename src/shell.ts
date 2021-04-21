import { Command } from './command'
import type { Options } from './options'
import type { Process } from './process'

const kOptions = Symbol('tish.internal.commandFactoryOptions')

export interface CommandFactory {
    (command: string, options?: Options): Command
    (command: string, args: Array<string>, options?: Options): Command
    (command: Process, options?: Options): Command
    [kOptions]?: Options
}

export function shell(shellOptions: Partial<Options>, extend?: CommandFactory): CommandFactory {
    if (extend?.[kOptions]) {
        const originalOptions = extend[kOptions]!

        Object.keys(originalOptions).forEach((key as keyof Options) => {
            if (key in shellOptions) {
                shellOptions[key] = { ...originalOptions[key], ...shellOptions[key] }
            } else {
                shellOptions[key] = originalOptions[key]
            }
        })
    }

    const $: CommandFactory = (
        command: string | Process,
        ...args: [Options?] | [Array<string>, Options?]
    ) => {
        const userOptions = args.pop() as Options
        const commandArgs = args.pop() as Array<string>

        const options = { ...shellOptions, ...userOptions }

        if (commandArgs && typeof command === 'string') {
            for (const arg of commandArgs) {
                command += ' ' + arg
            }
        }

        return new Command(command, options)
    }

    $[kOptions] = shellOptions

    return $ as CommandFactory
}
