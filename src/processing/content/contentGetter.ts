import * as global from 'src/types/globalTypes'
import * as types from 'src/types/processingTypes'
import cheerio from 'cheerio'
import fs from 'fs'

import usxParser from '../usxParser'

export async function booksInfo(outPath: string): Promise<types.DataItem[]> {
  const infoFile = fs.readFileSync(outPath + '/metadata.xml')
  const $ = cheerio.load(infoFile)
  const data = fs
    .readFileSync(outPath + '/release/versification.vrs', 'utf8')
    .replace(/\n/g, ' ')

  const result: types.DataItem[] = []
  let book = ''
  let chapter = ''
  let verse = ''
  const lines = data.split(' ')
  for (const line of lines) {
    if (line.startsWith('#')) continue
    if (line.match(/^[A-Z]+$/)) {
      book = line
    } else {
      ;[chapter, verse] = line.split(':')
      result.push({
        name: $(`name[id="book-${book.toLowerCase()}"] > short`).first().text(),
        chapter: chapter,
        verses: verse?.replace('\r', '')
      })
    }
  }
  return result.filter((a) => a.name !== '' && a.verses)
}

export async function getInfo(outPath: string): Promise<global.versionInfo> {
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

export async function getContent(outPath: string) {
  const arr = await booksInfo(outPath)
  const usx = await usxParser.parseUSX(outPath)
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
