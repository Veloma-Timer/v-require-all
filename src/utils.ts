export const isPromise = (value: any): boolean => typeof value.then === 'function' && value.toString() === '[object Promise]';
export const isArray = (value: any): boolean => Array.isArray(value);
export const toArray = (value: any): any[] => isArray(value) ? value : [value];