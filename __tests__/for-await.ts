import { $ } from '../src'
import { MockProcess } from '../__mock__/process'

process.on('unhandledRejection', () => process.exit(1))

describe('for...await', () => {
    test('read stdout by line', async () => {
        const proc = new MockProcess({
            status: 0,
            stdout: 'line1\nline2\n',
        })

        const command = $(proc)

        const buf = []

        for await (const line of command) {
            buf.push(line)
        }

        expect(buf).toStrictEqual(['line1', 'line2'])
    })

    test('read stdout by line of chunked output', async () => {
        const proc = new MockProcess({
            status: 0,
            stdout: ['lin', 'e1\nli', 'ne2\n'],
        })

        const command = $(proc)

        const buf = []

        for await (const line of command) {
            buf.push(line)
        }

        expect(buf).toStrictEqual(['line1', 'line2'])
    })

    test('read stdout by line even if error', async () => {
        const proc = new MockProcess({
            status: 1,
            stdout: 'line1\nline2\n',
        })

        const command = $(proc)

        const buf = []

        for await (const line of command) {
            buf.push(line)
        }

        expect(buf).toStrictEqual(['line1', 'line2'])
    })
})
