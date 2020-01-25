import { $ } from '../src'
import { existsSync, readFileSync, fstat } from 'fs'

process.on('unhandledRejection', console.error)

it('to', async () => {
    await $('echo aaa').toFile('a')

    expect(existsSync('a')).toBeTruthy()
    expect(readFileSync('a', 'utf8')).toContain('aaa')

    await $('rm a')

    expect(existsSync('a')).toBeFalsy()
})
