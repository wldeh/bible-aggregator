import * as types from 'src/types/processingTypes'
import cheerio from 'cheerio'
import fs from 'fs'
import path from 'path'

import Directory from '../directory'

export default async function parseUSX(folder: string): Promise<types.Verse[]> {
  let array: types.Verse[] = []
  const infoFile = fs.readFileSync(path.join(folder, 'metadata.xml'))
  const $I = cheerio.load(infoFile)

  const files = await Directory.readFolder(folder)
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
