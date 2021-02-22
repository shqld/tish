import { Readable, Writable } from 'stream'

export class MockReadable extends Readable {
    private _source: Array<string>

    constructor(source: Array<string>) {
        super()

        this._source = source
    }

    public _read() {
        for (const chunk of this._source) {
            this.push(Buffer.from(chunk))
        }

        this.push(null)
    }
}

export class MockWritable extends Writable {
    public _write(chunk: Buffer, _: unknown, cb: Function) {
        cb()
    }
}
