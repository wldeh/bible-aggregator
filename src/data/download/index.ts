import getDownloadLink from './downloadLinkGetter'
import downloadZip from './downloader'

export default class Download {
  static downloadZip = downloadZip
  static getDownloadLink = getDownloadLink
}
