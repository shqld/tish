import { Command } from '../src'
import { PassThrough, Writable } from 'stream'

process.on('unhandledRejection', console.error)

describe('Command.extend', () => {
    it('should set prototype of Command', () => {
        const extended = Command.extend({})
        expect(Object.getPrototypeOf(extended)).toBe(Command)
    })

    it('should override Command.defaultOptions', () => {
        const output = new Writable()
        const extended = Command.extend({ output })

        expect(extended).toHaveProperty('defaultConfig.output', output)
    })

    it('adf', async () => {
        const func = jest.fn()

        const output = new PassThrough()
        output.on('data', func)

        const extended = Command.extend({ output })

        const command = extended.create('echo deadbeef')

        expect(command.config.output).toBe(output)

        await command

        expect(func).toHaveBeenCalled()
    })
})
