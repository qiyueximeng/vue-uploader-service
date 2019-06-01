const response = {
    success(data = {}, msg = 'success') {
        return { code: 0, msg, data}
    },
    fail: (code = 1, data = {}, msg = 'fail') => { code, data, msg }
}

module.exports = response