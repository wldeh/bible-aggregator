import * as global from 'src/types/globalTypes'
import * as types from 'src/types/processingTypes'
import fs from 'fs'

import Directory from '.'
import Content from '../content'

export default async function createDirs(outPath: string): Promise<void> {
  const bibleInfo = await Content.getInfo(outPath)
  const books = await Content.booksInfo(outPath)
  const filteredBooks: any = Directory.getHighestChapters(books)

  for (const book of filteredBooks) {
    for (let i = 1; i <= book.chapter; i++) {
      const dir = `./bibles/${bibleInfo.id}/books/${book.name
        .toLowerCase()
        .replaceAll(' ', '')}/chapters/${i}/verses`

      fs.mkdirSync(dir, { recursive: true })
    }
  }
}
