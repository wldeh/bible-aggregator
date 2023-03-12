import fs from 'fs'

import Download from '../download'
import Unzipper from '../unzip'

export default async function importFolder(url: string, outPath: string) {
  try {
    const downloadPath = `./${Math.random().toString(36).substring(2)}.zip`
    const downloadLink: string = await Download.getDownloadLink(url)
    await Download.downloadZip(downloadLink, downloadPath)
    await Unzipper.unzip(outPath, downloadPath)
    await fs.promises.unlink(downloadPath)
  } catch (error) {
    throw new Error(`importFolder failed: ${error.message}`)
  }
}
