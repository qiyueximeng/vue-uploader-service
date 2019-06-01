const path = require('path')
const fs = require('fs')
const childProcess = require('child_process')
const sparkMD5 = require('spark-md5')

const router = require('express').Router()
const { success, fail } = require('../utils/response')

// 初始化上传路径
const multer = require('multer')
const upload = multer({ dest: path.join(__dirname, '../tpl/') })

// 产品本身 hash 用于生成文件签名
const proHash = sparkMD5.hash('This is your flag')
// 文件签名生成字段间的合并符号
const hashSeparator = '!!!'
const fileParamName = 'file'
const chunkNamePre = 'chunk'

const { cleanTpl, genChunkDir, testChunkExist, genFilePath, writeChunks } = require('../utils/file')

// 校验文件上传状态接口
router.get('/', (req, res) => {
    const { identifier, filename } = req.query
    const name = decodeURIComponent(filename)
    const fileHash = sparkMD5.hash(name + identifier)
    const filePath = genFilePath(fileHash)
    const result = {
        isRapidUpload: false,
        url: '',
        uploadedChunks: []
    }
    // 文件已上传过
    if(fs.existsSync(filePath)) {
        const sig = sparkMD5.hash([proHash, name, fileHash].join(hashSeparator))
        return res.json(success(Object.assign(result, {
            isRapidUpload: true,
            url: [
                'http://localhost:3000/upload',
                'file', fileHash, filename, sig
            ].join('/')
        }), '可以秒传'))
    }

    const chunkDir = genChunkDir(identifier)
    const existsChunks = fs.readdirSync(chunkDir)
    // 没有上传的切片
    if(!existsChunks.length) return res.json(success(result, '文件不存在'))

    // 上传了部分切片
    const uploadedChunks = existsChunks.map(chunk => parseInt(chunk.slice(chunkNamePre.length)))
    res.json(success(Object.assign(result, { uploadedChunks }), '已上传部分切片'))
})

// 上传文件切片接口
router.post('/', upload.single(fileParamName), async (req, res) => {
    const { identifier, chunkNumber, totalSize, chunkSize } = req.body

    // 生成切片临时存储目录
    const chunksDir = genChunkDir(identifier)
    // 根据块索引和文件唯一标识生成存储的每个块临时文件名
    const chunkPath = chunksDir + '/' + chunkNamePre + chunkNumber

    // 将上传的块文件重命名为上面生成的文件名
    fs.renameSync(req.file.path, chunkPath)

    // 轮询校验每个块是否都存在，若每个块都存在则响应上传完成
    let currChunkNumber = 1
    const totalChunks = Math.max(Math.floor(totalSize / chunkSize), 1)
    const chunkPathList = []
    while(currChunkNumber <= totalChunks) {
        const currChunkPath = chunksDir + '/' + chunkNamePre + currChunkNumber
        chunkPathList.push(currChunkPath)
        currChunkNumber++
    }
    Promise.all(chunkPathList.map(chunkPath => testChunkExist(chunkPath)))
        .then(resultList => {
            res.json(success({
                isComplete: resultList.every(result => result)
            }))
        })
})

// 清空文件缓存目录接口
router.post('/clean', (req, res) => {
    cleanTpl().then(() => {
        res.json(success(void 0, '清空目录成功'))
    })
})

// 切片上传完成后的合并接口
router.post('/merge', (req, res) => {
    const { identifier, fileName } = req.body
    const chunkDir = genChunkDir(identifier)
    // 文件名+后缀
    const name = decodeURIComponent(fileName)
    // 生成文件实际存储名称
    const fileHash = sparkMD5.hash(name + identifier)
    // 文件实际存储路径
    const filePath = genFilePath(fileHash)
    // 文件签名
    const sig = sparkMD5.hash([proHash, name, fileHash].join(hashSeparator))
    // 获取切片目录下的所有切片路径并排序
    try {
        // 将各切片写入最终路径
        const writeSuccess = writeChunks(chunkDir, filePath, chunkNamePre)
        if(!writeSuccess) return res.json(fail(101, void 0, '该文件分片不存在'))

        // 删除缓存切片目录
        childProcess.exec(`rm -rf ${chunkDir}`)

        // 返回该文件访问 url
        res.json(success({
            url: [
                'http://localhost:3000/upload',
                'file', fileHash, fileName, sig
            ].join('/')
        }, '切片合并成功'))
    } catch(err) {
        childProcess.exec(`rm -rf ${chunkDir}`)
        res.json(fail(102, void 0, '切片合并失败'))
    }
})

// 下载指定文件
router.get('/file/:fileHash/:encodeName/:sig', (req, res) => {
    try {
        const { fileHash, encodeName, sig } = req.params
        const name = decodeURIComponent(encodeName)
        const realSig = sparkMD5.hash([proHash, name, fileHash].join(hashSeparator))
    
        if(realSig !== sig) return res.json(fail(103, void 0, '签名错误'))
    
        res.download(path.join(desPath, fileHash), name, err => {
            if(err) res.json(fail(104, void 0, '下载失败'))
        })
    } catch(err) {
        res.json(fail(1, err))
    }
})

module.exports = router