import cheerio from 'cheerio'
import fetch from 'node-fetch'

const BASE_URL = 'https://app.thedigitalbiblelibrary.org'

export default async function getDownloadLink(url: string): Promise<string> {
  try {
    const initialResponse = await fetch(url)
    const initialData = await initialResponse.text()
    const $1 = cheerio.load(initialData)
    const downloadResponse = await fetch(
      BASE_URL + $1('.list-group-item > a').attr('href')
    )

    const downloadData = await downloadResponse.text()
    const $2 = cheerio.load(downloadData)
    const href: string = BASE_URL + $2('#download_button').attr('href')

    return href
  } catch (error) {
    throw new Error(`getDownloadLink failed: ${error.message}`)
  }
}
