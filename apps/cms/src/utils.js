
exports.debugEnv = (prefix) => {
    const data = Object.keys(process.env).filter(key => key.startsWith(prefix)).map(key => ({ [key]: process.env[key] })).reduce(
        (a, b) => ({ ...a, ...b }), {}
    )
    console.log(JSON.stringify(data))

    return data
}