import cheerio from 'cheerio'
import fs from 'fs'

// type
async function parseUSXFile(fileName: string): Promise<object[]> {
  const usxData = await fs.promises.readFile(fileName)
  const $ = cheerio.load(usxData, { xmlMode: true })

  const verses = $('verse')
    .map((i, elem) => {
      const chapterNumber = $(elem).attr('sid')?.split(' ')[1].split(':')[0]
      const verseNumber = $(elem).attr('number')
      const text = $(elem)[0].next?.data?.trim() || null
      return {
        chapterNumber,
        verseNumber,
        verse: text
      }
    })
    .get()
    .filter((verse) => verse.chapterNumber && verse.verseNumber)

  return verses
}
