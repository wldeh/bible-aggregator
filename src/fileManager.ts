import * as cheerio from 'cheerio'
import * as unzipper from 'unzip-stream'
import fs from 'fs'
import fetch, { Response } from 'node-fetch'

class FileManagerError extends Error {
  code: string
  method: string

  constructor(message: string, code: string, method: string) {
    super(message)
    this.code = code
    this.method = method
  }
}

export default class fileManager {
  public static async getDownloadLink(url: string): Promise<string> {
    try {
      const response: Response = await fetch(url)
      const data: string = await response.text()
      const $ = cheerio.load(data)
      const href: string =
        'https://app.thedigitalbiblelibrary.org' +
        $('#download_button').attr('href')
      return href
    } catch (error) {
      throw new FileManagerError(
        `getDownloadLink failed: ${error.message}`,
        error.code,
        'getDownloadLink'
      )
    }
  }

  public static async download(
    url: string,
    downloadPath: string
  ): Promise<void> {
    try {
      const response: Response = await fetch(url)
      const blob: Blob = await response.blob()
      const buffer = Buffer.from(await blob.arrayBuffer())
      await fs.writeFileSync(downloadPath, buffer)
    } catch (error) {
      throw new FileManagerError(
        `download failed: ${error.message}`,
        error.code,
        'download'
      )
    }
  }

  public static async unzip(
    outPath: string,
    downloadPath: string
  ): Promise<void> {
    try {
      await new Promise((resolve, reject) => {
        fs.createReadStream(downloadPath)
          .pipe(unzipper.Extract({ path: outPath }))
          .on('error', reject)
          .on('finish', resolve)
      })
    } catch (error) {
      throw new FileManagerError(
        `unzip failed: ${error.message}`,
        error.code,
        'unzip'
      )
    }
  }

  public static async importFolder(url: string, outPath: string) {
    try {
      const downloadPath = `./${Math.random().toString(36).substring(2)}.zip`
      const downloadLink: string = await this.getDownloadLink(url)
      await this.download(downloadLink, downloadPath)
      await this.unzip(outPath, downloadPath)
      fs.unlinkSync(downloadPath)
    } catch (error) {
      throw new FileManagerError(
        `importFolder failed: ${error.message}`,
        error.code,
        'importFolder'
      )
    }
  }

  public static async getBibleInfo() {}
}
