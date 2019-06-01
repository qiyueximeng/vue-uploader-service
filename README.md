# vue-uploader-service
一个基于 vue-uploader 前端上传组件的 nodejs 接口例子

该项目是基于 [vue-simple-uploader](https://github.com/simple-uploader/vue-uploader/blob/master/README_zh-CN.md) 这个 Vue 文件上传插件编写的一个 nodejs 项目。

## 支持功能
- 文件上传状态校验（上传完成、上传部分、未上传）
- 文件上传
- 断点续传
- 秒传
- 已上传的文件进行下载

## 使用
### 初始化
```shell
git clone https://github.com/qiyueximeng/vue-uploader-service.git
cd vue-uploader-service
npm i
npm run dev
```

### 接口
- GET /upload：文件上传状态校验接口，返回是否可以秒传，文件下载路径，已上传切片数组
- POST /upload：上传文件切片接口，返回是否上传完成可以合并
- POST /upload/merge：文件切片合并接口，返回合并状态，若成功则返回文件下载路径
- GET /upload/file/:fileHash/:encodeName/:sig：文件下载接口，下载对应文件