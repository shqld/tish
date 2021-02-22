import { ChildProcess } from 'child_process'

export type Process = Pick<
    ChildProcess,
    'pid' | 'spawnfile' | 'spawnargs' | 'on' | 'stdin' | 'stdout' | 'stderr'
>
