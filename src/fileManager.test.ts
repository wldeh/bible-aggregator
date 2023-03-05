import fs from 'fs'
import fetch from 'node-fetch'

import fileManager from './fileManager'

//jest.mock('node-fetch')
jest.mock('node-fetch', () => jest.fn())
jest.mock('fs')

describe('fileManager', () => {
  describe('getDownloadLink', () => {
    it('should return the download link for a given URL', async () => {
      const url =
        'https://app.thedigitalbiblelibrary.org/entry/download_listing?id=06125adad2d5898a&license=4013&revision='
      const expectedHref =
        '/entry/download_archive?id=06125adad2d5898a&license=4013&revision=13&type=release'

      ;(fetch as jest.Mock).mockImplementationOnce(() =>
        Promise.resolve({
          text: () =>
            Promise.resolve(
              `<html><body><a id="download_button" href="${expectedHref}"></a></body></html>`
            )
        })
      )

      const href = await fileManager.getDownloadLink(url)
      expect(fetch).toHaveBeenCalledWith(url)
      expect(href).toEqual(
        `https://app.thedigitalbiblelibrary.org${expectedHref}`
      )
    })

    it('should throw an error if the request fails', async () => {
      const url = 'https://example.com'

      ;(fetch as jest.Mock).mockImplementationOnce(() =>
        Promise.reject(new Error('Network error'))
      )

      await expect(fileManager.getDownloadLink(url)).rejects.toThrow(
        'Network error'
      )
    })
  })

  describe('importFolder', () => {
    it('should download and unzip a folder from a given URL', async () => {
      const url =
        'https://app.thedigitalbiblelibrary.org/entry/download_listing?id=06125adad2d5898a&license=4013&revision='
      const outPath = '/tmp/folder'

      // Mock the getDownloadLink method to return a fake download link
      const mockGetDownloadLink = jest
        .spyOn(fileManager, 'getDownloadLink')
        .mockResolvedValue(
          'https://app.thedigitalbiblelibrary.org/entry/download_archive?id=06125adad2d5898a&license=4013&revision=13&type=release'
        )

      // Mock the download method to write a fake zip file to disk
      const mockDownload = jest
        .spyOn(fileManager, 'download')
        .mockImplementation((url, downloadPath) => {
          fs.writeFileSync(downloadPath, 'fake-zip-file')
          return Promise.resolve()
        })

      // Mock the unzip method to extract the fake zip file
      const mockUnzip = jest.spyOn(fileManager, 'unzip').mockResolvedValue()

      await fileManager.importFolder(url, outPath)

      expect(mockGetDownloadLink).toHaveBeenCalledWith(url)
      expect(mockDownload).toHaveBeenCalledWith(
        'https://app.thedigitalbiblelibrary.org/entry/download_archive?id=06125adad2d5898a&license=4013&revision=13&type=release',
        expect.stringMatching(/^\/tmp\/.+\.zip$/)
      )
      expect(mockUnzip).toHaveBeenCalledWith(
        outPath,
        expect.stringMatching(/^\/tmp\/.+\.zip$/)
      )
    })
  })
})
