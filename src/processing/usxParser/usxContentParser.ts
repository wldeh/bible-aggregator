//rewrite
import * as types from 'src/types/processingTypes'
import cheerio from 'cheerio'
import fs from 'fs'
import path from 'path'
import { DOMParser } from 'xmldom'

import Directory from '../directory'

export default async function parseUSX(folder: string): Promise<types.Verse[]> {
  let array: types.Verse[] = []
  const infoFile = fs.readFileSync(path.join(folder, 'metadata.xml'))
  const $I = cheerio.load(infoFile)

  const files = await Directory.readFolder(folder)
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
