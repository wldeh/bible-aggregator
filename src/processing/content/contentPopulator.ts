import * as global from 'src/types/globalTypes'
import * as types from 'src/types/processingTypes'
import fs from 'fs'
import fetch from 'node-fetch'

import Content from '.'
import Files from '../../../src/data/files'

export default async function populate(outPath: string): Promise<void> {
  const data = JSON.parse(fs.readFileSync('./bibles/bibles.json', 'utf8'))
  const bibleInfo: global.versionInfo = await Content.getInfo(outPath)

  if (data.some((bible: global.versionInfo) => bible.id === bibleInfo.id)) {
    await Files.deleteFolder(outPath)
    throw new Error('Already imported bible')
  }

  data.push(bibleInfo)
  fs.writeFileSync('./bibles/bibles.json', JSON.stringify(data, null))
  fs.writeFileSync(
    `./bibles/${bibleInfo.id}/${bibleInfo.id}.json`,
    JSON.stringify(bibleInfo, null)
  )

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

  await Files.deleteFolder(outPath)
}
