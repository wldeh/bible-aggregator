import fs from 'fs'

import download from '../download'
import Unzipper from '../unzip'

export default async function importFolder(url: string, outPath: string) {
  try {
    const downloadPath = `./${Math.random().toString(36).substring(2)}.zip`
    const downloadLink: string = await download.getDownloadLink(url)
    await download.downloadZip(downloadLink, downloadPath)
    await Unzipper.unzip(outPath, downloadPath)
    await fs.promises.unlink(downloadPath)
  } catch (error) {
    throw new Error(`importFolder failed: ${error.message}`)
  }
}
