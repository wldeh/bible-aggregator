import { booksInfo, getContent, getInfo } from './contentGetter';
import populate from './contentPopulator';

export default class Content {
  static booksInfo = booksInfo;
  static getInfo = getInfo;
  static getContent = getContent;
  static populate = populate;
}
