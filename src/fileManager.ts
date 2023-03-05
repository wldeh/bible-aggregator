import * as cheerio from 'cheerio'
import * as unzipper from 'unzip-stream'
import fs from 'fs'
import fetch, { Response } from 'node-fetch'

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
      //console.error(error)
      throw error
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
      fs.writeFile(
        downloadPath,
        buffer,
        (err: NodeJS.ErrnoException | null) => {
          if (err) {
            console.error(err)
          } else {
            console.log('File downloaded successfully')
          }
        }
      )
    } catch (error) {
      console.error(error)
    }
  }

  public static async unzip(
    outPath: string,
    downloadPath: string
  ): Promise<void> {
    try {
      return fs
        .createReadStream(downloadPath)
        .pipe(unzipper.Extract({ path: outPath }))
    } catch (error) {
      console.error(error)
    }
  }

  public static async importFolder(url: string, outPath: string) {
    try {
      const downloadPath = `/tmp/${Math.random().toString(36).substring(2)}.zip`
      const downloadLink: string = await this.getDownloadLink(url)
      await this.download(downloadLink, downloadPath)
      await this.unzip(outPath, downloadPath)
      fs.unlinkSync(downloadPath)
    } catch (error) {
      console.error(error)
    }
  }
}
