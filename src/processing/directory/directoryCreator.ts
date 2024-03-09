import fs from 'fs';

import Directory from '.';
import Content from '../content';

/**
 * Creates directories for Bible books and chapters.
 *
 * @param {string} outPath - The output path for the directories.
 * @returns {Promise<void>}
 */
export default async function createDirs(outPath: string): Promise<void> {
  const bibleInfo = await Content.getInfo(outPath);
  const books = await Content.booksInfo(outPath);
  const filteredBooks = Directory.getHighestChapters(books);

  for (const book of filteredBooks) {
    for (let i = 1; i <= Number(book.chapter); i++) {
      const dir = `./bibles/${bibleInfo.id}/books/${formatBookName(
        book.name
      )}/chapters/${i}/verses`;

      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

/**
 * Formats the book name for directory creation.
 *
 * @param {string} bookName - The book name to format.
 * @returns {string} - The formatted book name.
 */
function formatBookName(bookName: string): string {
  return bookName
    .toLowerCase()
    .replaceAll(' ', '')
    .replace(/first/i, '1')
    .replace(/second/i, '2')
    .replace(/third/i, '3');
}
