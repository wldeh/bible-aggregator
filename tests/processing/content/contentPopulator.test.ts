import fs from 'fs'

import Content from '../../../src/processing/content'
import populate from '../../../src/processing/content/contentPopulator'

jest.mock('fs')
jest.mock('../../../src/processing/content')

describe('populate', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('throws an error when the bible with the same id already exists', async () => {
    const bibleInfo = { id: 'existingBible' }
    const data = [{ id: 'existingBible' }]

    ;(fs.readFileSync as jest.Mock).mockReturnValueOnce(JSON.stringify(data))
    ;(Content.getInfo as jest.Mock).mockResolvedValueOnce(bibleInfo)

    await expect(populate('outPath')).rejects.toThrow('Already imported bible')
  })

  test('creates the correct file structure for the new bible', async () => {
    const bibleInfo = { id: 'newBible' }
    const data = [{ id: 'existingBible' }]
    const contents = [
      {
        book: 'Book 1',
        chapter: 1,
        verses: [
          { verse: 1, text: 'Verse 1 text' },
          { verse: 2, text: 'Verse 2 text' }
        ]
      }
    ]

    ;(fs.readFileSync as jest.Mock).mockReturnValueOnce(JSON.stringify(data))
    ;(Content.getInfo as jest.Mock).mockResolvedValueOnce(bibleInfo)
    ;(Content.getContent as jest.Mock).mockResolvedValueOnce(contents)

    await populate('outPath')

    expect(fs.writeFileSync).toHaveBeenCalledWith(
      './bibles/newBible/books/book1/chapters/1.json',
      JSON.stringify({ data: contents[0].verses })
    )
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      './bibles/newBible/books/book1/chapters/1/verses/1.json',
      JSON.stringify({ verse: 1, text: 'Verse 1 text' })
    )
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      './bibles/newBible/books/book1/chapters/1/verses/2.json',
      JSON.stringify({ verse: 2, text: 'Verse 2 text' })
    )
  })

  test('writes the correct data to the book, chapter, and verse files', async () => {
    const bibleInfo = { id: 'newBible' }
    const data = [{ id: 'existingBible' }]
    const contents = [
      {
        book: 'Book 1',
        chapter: 1,
        verses: [
          { verse: 1, text: 'Verse 1 text' },
          { verse: 2, text: 'Verse 2 text' }
        ]
      }
    ]

    ;(fs.readFileSync as jest.Mock).mockReturnValueOnce(JSON.stringify(data))
    ;(Content.getInfo as jest.Mock).mockResolvedValueOnce(bibleInfo)
    ;(Content.getContent as jest.Mock).mockResolvedValueOnce(contents)

    await populate('outPath')

    expect(fs.writeFileSync).toHaveBeenCalledWith(
      './bibles/newBible/books/book1/chapters/1.json',
      JSON.stringify({ data: contents[0].verses })
    )
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      './bibles/newBible/books/book1/chapters/1/verses/1.json',
      JSON.stringify({ verse: 1, text: 'Verse 1 text' })
    )
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      './bibles/newBible/books/book1/chapters/1/verses/2.json',
      JSON.stringify({ verse: 2, text: 'Verse 2 text' })
    )
  })

  test('does not overwrite existing data in the bibles.json file or in the book, chapter, and verse files', async () => {
    const bibleInfo = { id: 'newBible' }
    const data = [{ id: 'existingBible' }]
    const contents = [
      {
        book: 'Book 1',
        chapter: 1,
        verses: [
          { verse: 1, text: 'Verse 1 text' },
          { verse: 2, text: 'Verse 2 text' }
        ]
      }
    ]

    ;(fs.readFileSync as jest.Mock).mockReturnValueOnce(JSON.stringify(data))
    ;(Content.getInfo as jest.Mock).mockResolvedValueOnce(bibleInfo)
    ;(Content.getContent as jest.Mock).mockResolvedValueOnce(contents)

    await populate('outPath')

    expect(fs.writeFileSync).toHaveBeenCalledWith(
      './bibles/bibles.json',
      JSON.stringify([...data, bibleInfo])
    )
    expect(fs.writeFileSync).not.toHaveBeenCalledWith(
      './bibles/bibles.json',
      JSON.stringify([bibleInfo])
    )
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      './bibles/newBible/books/book1/chapters/1.json',
      JSON.stringify({ data: contents[0].verses })
    )
    expect(fs.writeFileSync).not.toHaveBeenCalledWith(
      './bibles/newBible/books/book1/chapters/1.json',
      JSON.stringify({ data: [] })
    )
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      './bibles/newBible/books/book1/chapters/1/verses/1.json',
      JSON.stringify({ verse: 1, text: 'Verse 1 text' })
    )
    expect(fs.writeFileSync).not.toHaveBeenCalledWith(
      './bibles/newBible/books/book1/chapters/1/verses/1.json',
      JSON.stringify({ verse: 1, text: '' })
    )
  })
})
