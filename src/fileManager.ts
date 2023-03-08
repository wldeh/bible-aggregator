import * as cheerio from 'cheerio'
import * as unzipper from 'unzip-stream'
import fs from 'fs'
import fetch, { Response } from 'node-fetch'
import path from 'path'

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

  public static async getInfo(outPath: string) {
    const infoFile = await fs.promises.readFile(outPath + '/metadata.xml')
    const $ = cheerio.load(infoFile)
    return {
      id: `${$('ldml').text()}-${$('abbreviationLocal')
        .first()
        .text()
        .toLowerCase()}`,
      version: $('name').first().text(),
      description: $('description').first().text(),
      scope: $('scope').text(),
      language: {
        name: $('language > name').text(),
        code: $('language > iso').text(),
        level: $('audience').text()
      },
      country: {
        name: $('country > name').text(),
        code: $('country > iso').text()
      },
      numeralSystem: $('numerals').text(),
      script: $('script').text(),
      archivist: $('archivistName').text(),
      coyright: $(
        'copyright > fullStatement > statementContent > p > strong'
      ).text(),
      localVersionName: $('nameLocal').first().text(),
      localVersionAbbreviation: $('abbreviationLocal').first().text()
    }
  }

  public static async booksInfo(outPath: string) {
    const infoFile = fs.readFileSync(outPath + '/metadata.xml')
    const $ = cheerio.load(infoFile)
    const data = fs
      .readFileSync(outPath + '/release/versification.vrs', 'utf8')
      .replace(/\n/g, ' ')

    let result = []
    let book = ''
    let chapter = ''
    let verse = ''
    let lines = data.split(' ')
    for (const line of lines) {
      if (line.startsWith('#')) continue
      if (line.match(/^[A-Z]+$/)) {
        book = line
      } else {
        ;[chapter, verse] = line.split(':')
        result.push({
          name: $(`name[id="book-${book.toLowerCase()}"] > short`)
            .first()
            .text(),
          chapter: chapter,
          verses: verse?.replace('\r', '')
        })
      }
    }
    result = result.filter((a: any) => a.name !== '' && a.verses)
    return result
  }

  public static async populate(outPath: string, bibleInfo) {
    const data = JSON.parse(fs.readFileSync('./bibles/bibles.json', 'utf8'))

    if (!data.includes(JSON.stringify(bibleInfo))) data.push(bibleInfo)
    else throw new Error('Already imported bible')

    fs.writeFileSync('./bibles/bibles.json', JSON.stringify(data, null))
    const contents: any = await this.getContent(outPath)

    for (var i = 0; i < contents.length; i++) {
      const chapterPath = `./bibles/${bibleInfo.id}/books/${contents[i]?.book
        .toLowerCase()
        .replaceAll(' ', '')}/chapters/${contents[i].chapter}.json`
      fs.writeFileSync(
        chapterPath,
        JSON.stringify({ data: contents[i].verses.map((a) => a) })
      )
      for (var x = 0; x < contents[i].verses.length; x++) {
        const versePath = `./bibles/${bibleInfo.id}/books/${contents[i].book
          .toLowerCase()
          .replaceAll(' ', '')}/chapters/${contents[i].chapter}/verses/${
          contents[i].verses[x].verse
        }.json`
        fs.writeFileSync(
          versePath,
          JSON.stringify({
            verse: contents[i].verses[x].verse,
            text: contents[i].verses[x].text
          })
        )
      }
    }
  }

  private static async parseUSX(folder: string): Promise<object[]> {
    let array = []
    const infoFile = fs.readFileSync(folder + '/metadata.xml')
    const $I = cheerio.load(infoFile)

    const files = await this.readFolder(folder)
    let usxFiles = files.filter((path) => path.endsWith('.usx'))

    for (const file of usxFiles) {
      const usxData = await fs.promises.readFile(file)
      const $ = cheerio.load(usxData, { xmlMode: true })

      const verses = $('verse')
        .map((i, elem) => {
          return {
            book: $I(
              `name[id="book-${path
                .basename(file)
                .replace('.usx', '')
                .toLowerCase()}"] > short`
            )
              .first()
              .text(),
            chapter: $(elem).attr('sid')?.split(' ')[1].split(':')[0],
            verse: $(elem).attr('number'),
            text: $(elem)[0].next?.data?.trim() || null
          }
        })
        .get()
        .filter((a) => a.verse && a.text)

      array = array.concat(verses)
    }

    return array
  }

  private static async getContent(outPath: string) {
    const arr = await this.booksInfo(outPath)
    const usx = await this.parseUSX(outPath)
    const array = []

    for (var i = 0; i < arr.length; i++) {
      array.push({
        book: arr[i].name,
        chapter: arr[i].chapter,
        verses: usx.filter(
          (a: any) => a.book == arr[i].name && a.chapter == arr[i].chapter
        )
      })
    }
    return array.filter((a) => a.verses.length > 0)
  }

  public static async readFolder(currentDir: string): Promise<string[]> {
    let files: string[] = []

    const entries = await fs.promises.readdir(currentDir, {
      withFileTypes: true
    })

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name)

      if (entry.isDirectory()) {
        files = files.concat(await this.readFolder(fullPath))
      } else {
        files.push(fullPath)
      }
    }

    return files
  }
}
