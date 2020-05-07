import { $ } from '../src'

describe('toBoolean', () => {
    describe('when succeeds', () => {
        it('should return true', async () => {
            expect($('true').toBoolean()).resolves.toBe(true)
        })
    })

    describe('when fails', () => {
        it('should return false and not throw', async () => {
            expect($('false').toBoolean()).resolves.toBe(false)
        })
    })
})
