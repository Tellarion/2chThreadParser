const dataSections = require('./configs/2chsections')

const fs = require('fs')

const calladownload = require('calladownload')

const DvachApi = require("dvach.js")

var ready_download = false
var files_branch = 0
var all_files_thread = 0
var ready_download_index = 0

/* 2CH TYPES FILES

    [1] = IMAGE JPG
    [2] = IMAGE PNG
    [6] = WEBM
    [10] = MP4

*/

function checkFileExists(file) {
    return fs.promises.access(file, fs.constants.F_OK)
                .then(() => true)
                .catch(() => false)
}

async function saveMedia(boardName, threadNumber, numberPost, file) {
    return new Promise((resolve, reject) => {

        let folderCorrectTypeName = ""

        var dirBoard = `./download/${boardName}`;

        if(boardName.indexOf("/") !== -1) {
            boardName = `UnknownThread_${threadNumber}`
            dirBoard = `./download/UnknownThread_${threadNumber}`
        }

        if (!fs.existsSync(dirBoard)){
            fs.mkdirSync(dirBoard)
        }

        switch(file.type) {
            case 1: folderCorrectTypeName = `image_jpg/`; break;
            case 2: folderCorrectTypeName = `image_png/`; break;
            case 6: folderCorrectTypeName = `webm/`; break;
            case 10: folderCorrectTypeName = `mp4/`; break;
            default: folderCorrectTypeName = `unknown/`; break;
        }

        var dirOwn = `./download/${boardName}/${folderCorrectTypeName}`;

        if (!fs.existsSync(dirOwn)){
            fs.mkdirSync(dirOwn)
        }

        var filePath = `./download/${boardName}/${folderCorrectTypeName}/${numberPost}_${file.displayname}`

        checkFileExists(filePath).then(result => {
            if(!result) {
                console.log(`Start download file ${file.displayname}`)
                try {
                    calladownload(`https://2ch.hk${file.path}`, `./download/${boardName}/${folderCorrectTypeName}/${numberPost}_${file.displayname}`, function (error) {
                        files_branch++
                        if(all_files_thread == files_branch) {
                            console.log('Загрузка всех файлов с треда произведена!')
                            ready_download = false
                            ready_download_index++
                        }
                        if(!error) { resolve(true) } else { reject(false) }
                    })
                } catch(error) {
                    reject(false)
                }
            } else {
                files_branch++
                if(all_files_thread == files_branch) {
                    console.log('Загрузка всех файлов с треда произведена!')
                    ready_download = false
                    ready_download_index++
                }
            }
        })
    })
}

async function downloadThread(element) {
    return new Promise((resolve, reject) => {
        DvachApi.getThread(element.board, element.thread)
        .then((data) => {
            
            all_files_thread = 0

            files_branch = 0

            let boardName = data[0].subject

            console.log(boardName)

            for(let i = 0; i < data.length; i++) {
                if(data[i].files.length >= 1) {
                    all_files_thread += data[i].files.length
                }
            }

            console.log(`All files count: ${all_files_thread}`)

            for(let i = 0; i < data.length; i++) {
                if(data[i].files.length >= 1) {
                    for(let m = 0; m < data[i].files.length; m++) {
                        saveMedia(boardName, element.thread, data[i].number, data[i].files[m]).then(result => {
                            if(result) {
                                console.log(`File with boardName: ${boardName} = ${data[i].files[m].displayname} success download!`)
                            } else {
                                console.log(`File with boardName: ${boardName} = ${data[i].files[m].displayname} download wrong!`)
                            }
                        })
                    }
                }
            }
        })
        .catch((err) => {

        })
    })
}

async function startParser() {
    setInterval(function() {
        if(ready_download == false) {
            console.log('Start parser')
            ready_download = true
            downloadThread(dataSections.array[ready_download_index])
            console.log(dataSections.array[ready_download_index])
        }
    }, 5000)
}

startParser()