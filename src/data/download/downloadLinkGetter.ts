import * as cheerio from 'cheerio'
import fetch, { Response } from 'node-fetch'

const BASE_URL = 'https://app.thedigitalbiblelibrary.org'

export default async function getDownloadLink(url: string): Promise<string> {
  try {
    const response: Response = await fetch(url)
    const data: string = await response.text()
    const $ = cheerio.load(data)
    const href: string = BASE_URL + $('#download_button').attr('href')
    return href
  } catch (error) {
    throw new Error(`getDownloadLink failed: ${error.message}`)
  }
}
