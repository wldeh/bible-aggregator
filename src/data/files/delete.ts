import fs from 'fs'

const deleteFolder = (path: string) => {
  if (fs.existsSync(path)) {
    fs.readdirSync(path).forEach((file) => {
      const curPath = path + '/' + file
      if (fs.lstatSync(curPath).isDirectory()) {
        deleteFolder(curPath)
      } else {
        fs.unlinkSync(curPath)
      }
    })
    fs.rmdirSync(path)
  }
}

export default deleteFolder
