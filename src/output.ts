import { Readable } from 'stream'
import * as fs from 'fs'
import * as rl from 'readline'
import { LazyPromise } from './lazy-promise'
import { Command } from './command'

export class Output extends LazyPromise<string> {
    private stream: Readable

    constructor(stream: Readable) {
        super()

        this.stream = stream
    }

    protected chain = () => {
        const buf: Array<Buffer> = []

        this.stream.setEncoding('utf8')
        this.stream.on('data', (chunk) => buf.push(chunk))

        return this.then(() => Buffer.concat(buf).toString().trim())
    }

    get [Symbol.asyncIterator]() {
        this.then()

        return rl.createInterface({
            input: this.stream,
            crlfDelay: Infinity,
        })[Symbol.asyncIterator]
    }

    redirect(filePath: string): Promise<void> {
        this.stream.pipe(fs.createWriteStream(filePath))
        this.stream.setEncoding('utf8')

        this.then()

        return new Promise((resolve, reject) => {
            this.stream.on('end', resolve)
            this.stream.on('error', reject)
        })
    }
}
