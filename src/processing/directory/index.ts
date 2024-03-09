import createDirs from './directoryCreator';
import { getHighestChapters, readFolder } from './directoryReader';

export default class Directory {
  static readFolder = readFolder;
  static getHighestChapters = getHighestChapters;
  static createDirs = createDirs;
}
