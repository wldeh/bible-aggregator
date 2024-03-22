import * as types from 'src/types'
import * as unzipFile from 'unzip-stream'
import cheerio from 'cheerio'
import fs from 'fs'
import fetch, { Blob, Response } from 'node-fetch'
import path from 'path'
import { DOMParser } from 'xmldom'

const url =
  'https://app.thedigitalbiblelibrary.org/entries/_public_domain_entries_tabledata.json'

const BASE_URL = 'https://app.thedigitalbiblelibrary.org'

export default async function main(): Promise<void> {
  try {
    let count = 0
    const response: Response = await fetch(url)
    const initialData = await response.json()
    const array = initialData.aaData

    for await (const item of array) {
      count++
      console.log(`(${count + '/' + array.length}) Setting up: ${item[4]}`)
      await setupBible(
        `https://app.thedigitalbiblelibrary.org/entry?id=${item[0]}`
      )
    }
  } catch (error) {
    throw new Error(`test failed: ${error.message}`)
  }
}

async function setupBible(url: string): Promise<void> {
  try {
    const startTime = performance.now()
    const outPath = `./delete/${Math.random().toString(36).substring(2)}`

    await importFolder(url, outPath)
    await createDirs(outPath)
    await populate(outPath)

    const endTime = performance.now()
    const timeTaken = endTime - startTime
    console.log(
      `Finished In ${(timeTaken / 1000).toFixed(
        2
      )} seconds @ ${new Date().toLocaleString('en-US', {
        timeZone: 'America/Los_Angeles'
      })}}`
    )
  } catch (error) {
    console.error(`Error setting up Bible: ${error.message}`)
  }
}

async function importFolder(url: string, outPath: string) {
  try {
    const downloadPath = `./bibles/${Math.random()
      .toString(36)
      .substring(2)}.zip`
    const downloadLink: string = await getDownloadLink(url)

    await downloadZip(downloadLink, downloadPath)
    await unzip(outPath, downloadPath)
    await fs.promises.unlink(downloadPath)
  } catch (error) {
    throw new Error(`importFolder failed: ${error.message}`)
  }
}

async function unzip(outPath: string, downloadPath: string): Promise<void> {
  try {
    await new Promise<void>((resolve, reject) => {
      fs.createReadStream(downloadPath)
        .pipe(unzipFile.Extract({ path: outPath }))
        .on('error', reject)
        .on('finish', resolve)
    })
  } catch (error) {
    throw new Error(`unzip failed: ${error.message}`)
  }
}

async function downloadZip(url: string, downloadPath: string): Promise<void> {
  try {
    const response: Response = await fetch(url)
    const blob: Blob = await response.blob()
    const buffer = Buffer.from(await (blob as any).arrayBuffer())
    await fs.writeFileSync(downloadPath, buffer)
  } catch (error) {
    throw new Error(`download failed: ${error.message}`)
  }
}
async function getDownloadLink(url: string): Promise<string> {
  try {
    const initialResponse = await fetch(url)
    const initialData = await initialResponse.text()
    const $1 = cheerio.load(initialData)
    const downloadResponse = await fetch(
      BASE_URL + $1('.list-group-item > a').attr('href')
    )

    const downloadData = await downloadResponse.text()
    const $2 = cheerio.load(downloadData)
    const href: string = BASE_URL + $2('#download_button').attr('href')

    return href
  } catch (error) {
    throw new Error(`getDownloadLink failed: ${error.message}`)
  }
}

async function createDirs(outPath: string): Promise<void> {
  const bibleInfo = await getInfo(outPath)
  const books = await booksInfo(outPath)
  const filteredBooks = getHighestChapters(books)

  for (const book of filteredBooks) {
    for (let i = 1; i <= Number(book.chapter); i++) {
      const dir = `./bibles/${bibleInfo.id}/books/${formatBookName(
        book.name
      )}/chapters/${i}/verses`

      fs.mkdirSync(dir, { recursive: true })
    }
  }
}

function getHighestChapters(data: types.DataItem[]): types.DataItem[] {
  return data.reduce((acc: types.DataItem[], curr: types.DataItem) => {
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

async function populate(outPath: string): Promise<void> {
  const biblesPath = path.join('./bibles', 'bibles.json')
  const data = JSON.parse(await fs.promises.readFile(biblesPath, 'utf8'))
  const bibleInfo: types.versionInfo = await getInfo(outPath)

  if (data.some((bible: types.versionInfo) => bible.id === bibleInfo.id)) {
    await deleteFolder(outPath)
    throw new Error('Already imported bible')
  }

  data.push(bibleInfo)
  await fs.promises.writeFile(biblesPath, JSON.stringify(data, null, 2))

  const biblePath = path.join('./bibles', bibleInfo.id)
  await fs.promises.mkdir(biblePath, { recursive: true })
  await fs.promises.writeFile(
    path.join(biblePath, `${bibleInfo.id}.json`),
    JSON.stringify(bibleInfo, null, 2)
  )

  const contents: types.ContentItem[] = await getContent(outPath)
  await processContents(bibleInfo, contents)

  await deleteFolder(outPath)
}

async function processContents(
  bibleInfo: types.versionInfo,
  contents: types.ContentItem[]
): Promise<void> {
  for (const content of contents) {
    const sanitizedBookName = sanitizeBookName(content.book)
    const bookPath = path.join(
      './bibles',
      bibleInfo.id,
      'books',
      sanitizedBookName
    )
    await fs.promises.mkdir(path.join(bookPath, 'chapters'), {
      recursive: true
    })

    const chapterPath = path.join(
      bookPath,
      'chapters',
      `${content.chapter}.json`
    )
    await fs.promises.writeFile(
      chapterPath,
      JSON.stringify({ data: content.verses })
    )

    for (const verse of content.verses) {
      const versePath = path.join(
        bookPath,
        'chapters',
        content.chapter,
        'verses',
        `${verse.verse}.json`
      )
      await fs.promises.mkdir(path.dirname(versePath), { recursive: true })
      await fs.promises.writeFile(
        versePath,
        JSON.stringify({ verse: verse.verse, text: verse.text })
      )
    }
  }
}

function sanitizeBookName(bookName: string): string {
  return bookName
    .toLowerCase()
    .replaceAll(' ', '')
    .replace(/first/i, '1')
    .replace(/second/i, '2')
    .replace(/third/i, '3')
}

async function getContent(outPath: string): Promise<types.ContentItem[]> {
  const bookInfos = await booksInfo(outPath)
  const usxData = await parseUSX(outPath)
  return bookInfos
    .map((bookInfo) => ({
      book: sanitizeBookName(bookInfo.name),
      chapter: bookInfo.chapter,
      verses: usxData.filter(
        (verse) =>
          verse.book === sanitizeBookName(bookInfo.name) &&
          verse.chapter === bookInfo.chapter
      )
    }))
    .filter((content) => content.verses.length > 0)
}

async function booksInfo(outPath: string) {
  try {
    // Asynchronously read the metadata and versification data
    const [metadata, versificationData] = await Promise.all([
      fs.promises.readFile(path.join(outPath, 'metadata.xml'), 'utf8'),
      fs.promises.readFile(
        path.join(outPath, 'release', 'versification.vrs'),
        'utf8'
      )
    ])

    const $ = cheerio.load(metadata)
    const lines = versificationData.replace(/\r\n/g, '\n').split('\n')
    const result = []

    for (const line of lines) {
      if (line.includes('=') || line.includes('#')) continue

      const parts = line.split(' ')
      for (const part of parts) {
        if (part && part.includes(':')) {
          const [bookCode, verseInfo] = part.split(':')
          const chapter = verseInfo.split('-')[0] // Assuming verseInfo format is "chapter-verse"
          const sanitizedBookCode = sanitizeBookName(bookCode)

          const bookName = $(`name[id="book-${sanitizedBookCode}"] > short`)
            .first()
            .text()
          if (bookName) {
            result.push({ name: bookName, chapter, verses: verseInfo })
          }
        }
      }
    }

    return result.filter(({ name, verses }) => name && verses)
  } catch (error) {
    console.error('Failed to load book info:', error)
    return []
  }
}

async function readFolder(currentDir: string): Promise<string[]> {
  let files: string[] = []

  const entries = await fs.promises.readdir(currentDir, {
    withFileTypes: true
  })

  for (const entry of entries) {
    const fullPath: string = path.join(currentDir, entry.name)

    if (entry.isDirectory()) {
      files = files.concat(await readFolder(fullPath))
    } else {
      files.push(fullPath)
    }
  }

  return files
}

async function parseUSX(folder: string): Promise<types.Verse[]> {
  let array: types.Verse[] = []
  const infoFile = fs.readFileSync(path.join(folder, 'metadata.xml'))
  const $I = cheerio.load(infoFile)

  const files = await readFolder(folder)
  const usxFiles = files.filter((path) => path.endsWith('.usx'))

  for (const file of usxFiles) {
    let verses
    const usxData = await fs.promises.readFile(file)
    const $ = cheerio.load(usxData, { xmlMode: true })

    const sid = $('*').filter(function () {
      return $(this).attr('sid') !== undefined
    })

    if (sid.length > 0) {
      let xmlString = fs.readFileSync(file).toString()
      let parser = new DOMParser()
      let xmlDoc = parser.parseFromString(xmlString, 'text/xml')
      let tags = xmlDoc.getElementsByTagName('verse')
      verses = Array.from(tags)
        .map((verse) => {
          if ((verse as any).hasAttribute('sid')) {
            let chapterVerse = (verse as any).getAttribute('sid').split(' ')[1]
            let [chapter, verseNumber] = chapterVerse.split(':')
            let textContent = ''
            let nextSibling = (verse as any).nextSibling
            while (nextSibling && nextSibling.nodeName !== 'verse') {
              textContent += nextSibling.textContent
              nextSibling = nextSibling.nextSibling
            }
            return {
              book: $I(
                `name[id="book-${path
                  .basename(file)
                  .replace('.usx', '')
                  .toLowerCase()}"] > short`
              )
                .first()
                .text()
                .replace(/first/i, '1')
                .replace(/second/i, '2')
                .replace(/third/i, '3'),
              chapter: chapter,
              verse: verseNumber,
              text: textContent
                .trim()
                .split(`\n`)
                [textContent.trim().split(`\n`).length - 1].trim()
            }
          }
        })
        .filter((a) => a)
        .filter((a) => a.verse && a.text)
    } else {
      verses = $('para').map(function () {
        let chapterNumber = $(this).prevAll('chapter').first().attr('number')
        return $(this)
          .find('verse')
          .map(function () {
            let verseNumber = $(this).attr('number')
            let verseText = ($(this)[0] as any)?.nextSibling?.nodeValue?.trim()
            return {
              book: $I(
                `name[id="book-${path
                  .basename(file)
                  .replace('.usx', '')
                  .toLowerCase()}"] > short`
              )
                .first()
                .text()
                .replace(/first/i, '1')
                .replace(/second/i, '2')
                .replace(/third/i, '3'),
              chapter: chapterNumber,
              verse: verseNumber,
              text: verseText.trim()
            }
          })
          .get()
      })
    }

    array = [...array, ...verses]
  }

  return array
}

async function getInfo(outPath: string): Promise<types.versionInfo> {
  const infoFile = await fs.promises.readFile(outPath + '/metadata.xml')
  const $ = cheerio.load(infoFile)
  return {
    id: `${$('ldml').text() || $('language > iso').text()}-${
      $('abbreviationLocal').first().text().toLowerCase() ||
      $('abbreviation').first().text().toLowerCase()
    }`,
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
    copyright: $(
      'copyright > fullStatement > statementContent > p > strong'
    ).text(),
    localVersionName: $('nameLocal').first().text(),
    localVersionAbbreviation: $('abbreviationLocal').first().text()
  }
}

/**
 * Formats the book name for directory creation.
 *
 * @param {string} bookName - The book name to format.
 * @returns {string} - The formatted book name.
 */
function formatBookName(bookName: string): string {
  return bookName
    .toLowerCase()
    .replaceAll(' ', '')
    .replace(/first/i, '1')
    .replace(/second/i, '2')
    .replace(/third/i, '3')
}

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

async function cleanup() {
  await fs.promises.rmdir(path.join(__dirname, '../delete'), {
    recursive: true
  })
}

process.on('SIGINT', cleanup)
process.on('SIGTERM', cleanup)

process.on('exit', (code) => {
  cleanup()
})
