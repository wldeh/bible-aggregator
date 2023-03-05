import * as cheerio from 'cheerio';
import * as unzipper from 'unzip-stream';
import fs from 'fs';
import fetch, { Response } from 'node-fetch';

export default class fileManager {
  static async getDownloadLink(url: string): Promise<string> {
    try {
      const response: Response = await fetch(url);
      const data: string = await response.text();
      const $ = cheerio.load(data);
      const href: string =
        'https://app.thedigitalbiblelibrary.org' +
        $('#download_button').attr('href');
      return href;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  static async download(url: string): Promise<void> {
    try {
      const response: Response = await fetch(url);
      const blob: Blob = await response.blob();
      const buffer = Buffer.from(await blob.arrayBuffer());
      fs.writeFile(
        'file.zip',
        buffer,
        (err: NodeJS.ErrnoException | null) => {
          if (err) {
            console.error(err);
          } else {
            console.log('File downloaded successfully');
          }
        }
      );
    } catch (error) {
      console.error(error);
    }
  }

  static async unzip(path: string, outPath: string): Promise<void> {
    try {
      return fs
        .createReadStream(path)
        .pipe(unzipper.Extract({ path: outPath }));
    } catch (error) {
      console.error(error);
    }
  }
}


