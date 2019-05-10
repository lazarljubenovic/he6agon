type Omit<T extends Record<string, any>, K extends keyof T> = Pick<T, Exclude<keyof T, K>>
