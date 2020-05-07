import { Command, Options } from './command'

declare function create(command: string, options?: Options): Command

export const $: typeof create = Command.create.bind(Command)

export * from './command'
