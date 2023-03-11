import * as unzipFile from 'unzip-stream';
import fs from 'fs';

export default async function unzip(
  outPath: string,
  downloadPath: string
): Promise<void> {
  try {
    await new Promise<void>((resolve, reject) => {
      fs.createReadStream(downloadPath)
        .pipe(unzipFile.Extract({ path: outPath }))
        .on('error', reject)
        .on('finish', resolve);
    });
  } catch (error) {
    throw new Error(`unzip failed: ${error.message}`);
  }
}