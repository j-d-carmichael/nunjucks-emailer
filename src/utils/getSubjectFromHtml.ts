import * as cheerio from 'cheerio';

export default (htmlString: string): string | undefined => {
  const $ = cheerio.load(htmlString);
  const subject = $('nunjuck-email-subject').attr('text');
  if (subject && subject.length > 0) {
    return subject;
  }
  return undefined;
}
