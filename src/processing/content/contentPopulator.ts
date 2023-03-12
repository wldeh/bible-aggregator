import * as global from 'src/types/globalTypes'
import * as types from 'src/types/processingTypes'
import fs from 'fs'

import Content from '.'

export default async function populate(outPath: string): Promise<void> {
  const data = JSON.parse(fs.readFileSync('./bibles/bibles.json', 'utf8'))
  const bibleInfo = await Content.getInfo(outPath)

  if (!data.includes(JSON.stringify(bibleInfo))) data.push(bibleInfo)
  else throw new Error('Already imported bible')

  fs.writeFileSync('./bibles/bibles.json', JSON.stringify(data, null))
  const contents: types.ContentItem[] = await Content.getContent(outPath)

  for (let i = 0; i < contents.length; i++) {
    const chapterPath = `./bibles/${bibleInfo.id}/books/${contents[i]?.book
      .toLowerCase()
      .replaceAll(' ', '')}/chapters/${contents[i].chapter}.json`
    fs.writeFileSync(
      chapterPath,
      JSON.stringify({ data: contents[i].verses.map((a) => a) })
    )
    for (let x = 0; x < contents[i].verses.length; x++) {
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
