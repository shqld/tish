const initialChain = () => Promise.resolve()

export abstract class LazyPromise<T> implements Promise<T> {
    public [Symbol.toStringTag]: string
    protected chain: () => Promise<any>

    constructor() {
        this.chain = initialChain
    }

    get then(): Promise<T>['then'] {
        return this.chain().then
    }
    get catch(): Promise<T>['catch'] {
        return this.chain().catch
    }
    get finally(): Promise<T>['finally'] {
        return this.chain().finally
    }
}
