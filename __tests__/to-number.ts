import { $ } from '../src'

describe('toNumber', () => {
    describe('when succeeds', () => {
        it('should return exit number: 0', async () => {
            expect($('exit 0').toNumber()).resolves.toBe(0)
        })
    })

    describe('when fails', () => {
        it('should return exit number and not throw', async () => {
            expect($('exit 1').toNumber()).resolves.toBe(1)
        })
    })
})
