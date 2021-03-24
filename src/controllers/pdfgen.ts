import { launch } from 'puppeteer'

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export async function generatePDF(html: string, type: string) {
  try {
    const folder = process.env.PDFS_FOLDER || 'pdfgen'
    const browser = await launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] })
    const page = await browser.newPage()
    await page.setContent(html)
    await page.pdf({
      path: `${folder}/${type}.pdf`,
      format: 'A4',
      printBackground: true,
      margin: { bottom: '75px', top: '30px' },
      displayHeaderFooter: false,
    })

    await browser.close()
    return 0
  } catch (err) {
    console.error(err)
    return 1
  }
}
