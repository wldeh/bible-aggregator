import * as global from 'src/types/globalTypes'
import * as types from 'src/types/processingTypes'
import fs from 'fs'

import Directory from '.'

export default async function createDirs(
  books: types.DataItem[],
  bibleInfo: global.versionInfo
): Promise<void> {
  const filteredBooks: any = await Directory.getHighestChapters(books)

  const data = JSON.parse(fs.readFileSync('./bibles/bibles.json', 'utf8'))
  data.push(bibleInfo)
  fs.writeFileSync('./bibles/bibles.json', JSON.stringify(data, null))

  for (const book of filteredBooks) {
    for (let i = 1; i <= book.chapter; i++) {
      const dir = `./bibles/${bibleInfo.id}/books/${book.name
        .toLowerCase()
        .replaceAll(' ', '')}/chapters/${i}/verses`

      fs.mkdirSync(dir, { recursive: true })
    }
  }
}
