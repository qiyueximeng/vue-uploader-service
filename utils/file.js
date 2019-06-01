const path = require('path')
const fs = require('fs')

const tplPath = path.resolve(__dirname, '../tpl')
const desPath = path.join(__dirname, '../files')
if(!fs.existsSync(tplPath)) fs.mkdirSync(tplPath)
if(!fs.existsSync(desPath)) fs.mkdirSync(desPath)

// 获取指定文件的切片临时目录
const genChunkDir = dir => {
    const chunkDir = path.join(tplPath, dir)
    if(!fs.existsSync(chunkDir)) fs.mkdirSync(chunkDir)
    return chunkDir
}

const genFilePath = fileHash => path.join(desPath, fileHash)

// 校验指定路径的切片是否存在
const testChunkExist = (chunkPath) => new Promise((resolve) => {
    fs.access(chunkPath, err => {
        resolve(err ? false : true)
    })
})
// 清空指定目录
const cleanDir = dirPath => new Promise((resolve) => {
    function removeDir(dir) {
        const files = fs.readdirSync(dir)
        files.forEach(file => {
            const currPath = `${dir}/${file}`
            if(fs.statSync(currPath).isDirectory()) {
                removeDir(currPath)
            } else {
                fs.unlinkSync(currPath)
            }
        })
        if(dir === dirPath) {
            resolve()
        } else {
            fs.rmdirSync(dir)
        }
    }
    removeDir(dirPath)
})

// 将指定切片目录中的切片写入到文件路径中
function writeChunks(chunkDir, filePath, chunkNamePre) {
    const chunks = fs.readdirSync(chunkDir)
    if(chunks.length === 0) return false
    const sliceLen = chunkNamePre.length
    if(chunks.length > 1) chunks.sort((a, b) => parseInt(a.slice(sliceLen)) - parseInt(b.slice(sliceLen)))
    chunks.forEach(chunk => {
        fs.appendFileSync(filePath, fs.readFileSync(path.join(chunkDir, chunk)))
    })
    return true
}

module.exports = {
    cleanTpl: () => cleanDir(tplPath),
    genChunkDir,
    testChunkExist,
    genFilePath,
    writeChunks
}