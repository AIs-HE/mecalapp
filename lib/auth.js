const STORAGE_KEYS = {
    USER_NAME: 'mecalapp_user_name',
    USER_ROLE: 'mecalapp_user_role'
}

function safeGet(key) {
    try {
        return localStorage.getItem(key)
    } catch (e) {
        console.error('auth.safeGet error', e)
        return null
    }
}

function safeSet(key, value) {
    try {
        if (value === undefined || value === null) {
            localStorage.removeItem(key)
        } else {
            localStorage.setItem(key, String(value))
        }
    } catch (e) {
        console.error('auth.safeSet error', e)
    }
}

export function getUserName() {
    return safeGet(STORAGE_KEYS.USER_NAME) || null
}

export function getUserRole() {
    return safeGet(STORAGE_KEYS.USER_ROLE) || null
}

export function setUserName(name) {
    safeSet(STORAGE_KEYS.USER_NAME, name || '')
}

export function setUserRole(role) {
    safeSet(STORAGE_KEYS.USER_ROLE, role || '')
}

export function clearAuth() {
    try {
        localStorage.removeItem(STORAGE_KEYS.USER_NAME)
        localStorage.removeItem(STORAGE_KEYS.USER_ROLE)
    } catch (e) {
        console.error('auth.clearAuth error', e)
    }
}

export function getAuth() {
    return {
        name: getUserName(),
        role: getUserRole()
    }
}

export default {
    getUserName,
    getUserRole,
    setUserName,
    setUserRole,
    clearAuth,
    getAuth
}
