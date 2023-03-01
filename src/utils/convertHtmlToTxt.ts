import { convert } from 'html-to-text';

export default (html: string): string => {
  return convert(html, {
    wordwrap: 130
  });
}
