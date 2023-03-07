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
      await fs.promises.unlink(downloadPath)
    } catch (error) {
      throw new FileManagerError(
        `importFolder failed: ${error.message}`,
        error.code,
        'importFolder'
      )
    }
  }

  public static async createDirs(books, bibleInfo) {
    const filteredBooks = this.getHighestChapters(books)

    const data = JSON.parse(fs.readFileSync('./bibles/bibles.json', 'utf8'))
    data.push(bibleInfo)
    fs.writeFileSync('./bibles/bibles.json', JSON.stringify(data, null))

    for (const book of filteredBooks) {
      for (var i = 1; i <= book.chapter; i++) {
        const dir = `./bibles/${bibleInfo.id}/books/${book.name
          .toLowerCase()
          .replaceAll(' ', '')}/chapters/${i}/verses`

        fs.mkdirSync(dir, { recursive: true })
      }
    }
  }

  private static getHighestChapters(data) {
    return data.reduce((acc, curr) => {
      const existing = acc.find((item) => item.name === curr.name)
      if (existing) {
        if (Number(existing.chapter) < Number(curr.chapter)) {
          existing.chapter = curr.chapter
          existing.verses = curr.verses
        }
      } else {
        acc.push(curr)
      }
      return acc
    }, [])
  }
}
