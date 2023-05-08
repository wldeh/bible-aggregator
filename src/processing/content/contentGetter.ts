import * as global from 'src/types/globalTypes'
import * as types from 'src/types/processingTypes'
import cheerio from 'cheerio'
import fs from 'fs'

import usxParser from '../usxParser'

export async function booksInfo(outPath: string) {
  const infoFile = fs.readFileSync(outPath + '/metadata.xml')
  const $ = cheerio.load(infoFile)
  const data = fs.readFileSync(outPath + '/release/versification.vrs')

  const result = []

  const lines = data.toString().replace(/\r\n/g, '\n').split('\n')

  for (var i = 0; i < lines.length; i++) {
    if (lines[i].includes('=') || lines[i].includes('#')) continue
    const parts = lines[i].split(' ')

    for (var x = 0; x < parts.length; x++) {
      if (parts[i] !== undefined) if (!parts[i].includes(':')) continue

      result.push({
        name: $(
          `name[id="book-${parts[0]
            .toLowerCase()
            .replace(/first/i, '1')
            .replace(/second/i, '2')
            .replace(/third/i, '3')}"] > short`
        )
          .first()
          .text(),
        chapter: parts[x].split(':')[0],
        verses: parts[x].split(':')[1]
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
      book: arr[i].name
        .replace(/first/i, '1')
        .replace(/second/i, '2')
        .replace(/third/i, '3'),
      chapter: arr[i].chapter,
      verses: usx.filter(
        (a: any) =>
          a.book ==
            arr[i].name
              .replace(/first/i, '1')
              .replace(/second/i, '2')
              .replace(/third/i, '3') && a.chapter == arr[i].chapter
      )
    })
  }
  return array.filter((a) => a.verses.length > 0)
}
