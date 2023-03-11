import fs from 'fs'

import populate from 'src/processing/content/contentPopulator'

jest.mock('fs')

describe('populate', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should add bibleInfo to bibles.json if it does not already exist', async () => {
    const outPath = 'testOutPath'
    const bibleInfo = {
      id: 'test',
      version: 'Test Version',
      description: 'Test Description',
      scope: 'Test',
      language: {
        name: 'Test Language',
        code: 'test',
        level: 'Test'
      },
      country: {
        name: 'Test Country',
        code: 'test'
      },
      numeralSystem: 'Test',
      script: 'Test',
      archivist: 'Test Archivist',
      copyright: 'Test',
      localVersionName: 'Test Local Version Name',
      localVersionAbbreviation: 'Test Local Version Abbreviation'
    }
    const biblesData = [{ id: 'otherId', name: 'otherName' }]

    const readFileSyncMock = jest
      .spyOn(fs, 'readFileSync')
      .mockReturnValueOnce(JSON.stringify(biblesData))

    const writeFileSyncMock = jest.spyOn(fs, 'writeFileSync')

    await populate(outPath, bibleInfo)

    expect(readFileSyncMock).toHaveBeenCalledWith(
      './bibles/bibles.json',
      'utf8'
    )
    expect(writeFileSyncMock).toHaveBeenCalledWith(
      './bibles/bibles.json',
      JSON.stringify([...biblesData, bibleInfo], null)
    )
  })

  it('should throw an error if bibleInfo already exists in bibles.json', async () => {
    const outPath = 'testOutPath'
    const bibleInfo = {
      id: 'test',
      version: 'Test Version',
      description: 'Test Description',
      scope: 'Test',
      language: {
        name: 'Test Language',
        code: 'test',
        level: 'Test'
      },
      country: {
        name: 'Test Country',
        code: 'test'
      },
      numeralSystem: 'Test',
      script: 'Test',
      archivist: 'Test Archivist',
      copyright: 'Test',
      localVersionName: 'Test Local Version Name',
      localVersionAbbreviation: 'Test Local Version Abbreviation'
    }
    const biblesData = [bibleInfo]

    jest
      .spyOn(fs, 'readFileSync')
      .mockReturnValueOnce(JSON.stringify(biblesData))

    await expect(populate(outPath, bibleInfo)).rejects.toThrow(
      'Already imported bible'
    )
  })
})
