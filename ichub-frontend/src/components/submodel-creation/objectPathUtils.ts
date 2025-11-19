// Utility functions for nested object path access
export function getValueByPath(obj: any, path: string): any {
    if (!path) return obj;
    return path.split('.').reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : ''), obj);
}

export function setValueByPath(obj: any, path: string, value: any): any {
    if (!path) return value;
    const keys = path.split('.');
    const result = { ...obj };
    let current = result;
    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (!current[key] || typeof current[key] !== 'object') {
            current[key] = {};
        } else {
            current[key] = { ...current[key] };
        }
        current = current[key];
    }
    const lastKey = keys[keys.length - 1];
    if (value === '' || value === null || value === undefined) {
        delete current[lastKey];
    } else {
        current[lastKey] = value;
    }
    return result;
}
