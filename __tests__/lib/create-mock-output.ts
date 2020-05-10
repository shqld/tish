import { Writable, PassThrough } from 'stream'

export const createMockOutput = (): { res: Array<string>; mock: Writable } => {
    const res: Array<string> = []

    const mock = new PassThrough()
    mock.setEncoding('utf8')
    mock.on('data', (chunk) => res.push(chunk))

    return { res, mock }
}
