import { $ } from '../src'
import { PassThrough, Writable } from 'stream'

process.on('unhandledRejection', console.error)

describe('isFailed', () => {
    it('true', async () => {
        const isFailed = await $('false').isFailed()
        expect(isFailed).toBeTruthy()
    })

    it('false', async () => {
        const isFailed = await $('true').isFailed()
        expect(isFailed).toBeFalsy()
    })
})

describe('isSucceeded', () => {
    it('true', async () => {
        const isScceeded = await $('true').isSucceeded()
        expect(isScceeded).toBeTruthy()
    })

    it('false', async () => {
        const isScceeded = await $('false').isSucceeded()
        expect(isScceeded).toBeFalsy()
    })
})
