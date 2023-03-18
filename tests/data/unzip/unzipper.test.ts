import * as unzipFile from 'unzip-stream'
import fs from 'fs'

import unzip from '../../../src/data/files/unzipper'

jest.mock('fs')
jest.mock('unzip-stream')

describe('unzip', () => {
  it('should unzip the file', async () => {
    const mockReadStream = {
      pipe: jest.fn().mockReturnThis(),
      on: jest.fn().mockImplementation((event, callback) => {
        if (event === 'finish') {
          callback()
        }
        return mockReadStream
      })
    }
    ;(fs.createReadStream as jest.Mock).mockReturnValue(mockReadStream)

    const outPath = '/out'
    const downloadPath = '/download'
    await unzip(outPath, downloadPath)

    expect(fs.createReadStream).toHaveBeenCalledWith(downloadPath)
    expect(unzipFile.Extract).toHaveBeenCalledWith({ path: outPath })
    expect(mockReadStream.on).toHaveBeenCalledWith(
      'error',
      expect.any(Function)
    )
    expect(mockReadStream.on).toHaveBeenCalledWith(
      'finish',
      expect.any(Function)
    )
  })

  it('should throw an error if unzip fails', async () => {
    const mockReadStream = {
      pipe: jest.fn().mockReturnThis(),
      on: jest.fn().mockImplementation((event, callback) => {
        if (event === 'error') {
          callback(new Error('Unzip failed'))
        }
        return mockReadStream
      })
    }
    ;(fs.createReadStream as jest.Mock).mockReturnValue(mockReadStream)

    const outPath = '/out'
    const downloadPath = '/download'
    await expect(unzip(outPath, downloadPath)).rejects.toThrow(
      'unzip failed: Unzip failed'
    )
  })
})
