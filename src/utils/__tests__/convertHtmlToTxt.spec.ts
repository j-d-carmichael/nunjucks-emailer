import convertHtmlToTxt from '@/utils/convertHtmlToTxt';

it('remove html and links', async () => {
  const txt = convertHtmlToTxt(
    `
<h1>Welcome!</h1>
<p>I hope you are well.</p>
<a href="https://www.liffery.com">Click here</a>

<p>Goodbye
from the team</p>
`
  );
  console.log(txt);
  expect(txt).toBe(
`WELCOME!

I hope you are well.

Click here [https://www.liffery.com]

Goodbye from the team`
  )
});
