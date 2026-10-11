
import fs from 'node:fs/promises'
import path from 'node:path'
import Papa from 'papaparse'
import QRCode from 'qrcode'

const CSV_FILE = path.resolve('participants.csv')
const OUTPUT_DIR = path.resolve('generated-qrs')

const BASE_URL = process.env.VERIFICATION_BASE_URL
  ?.trim()
  .replace(/\/+$/, '')

async function main() {
  if (!BASE_URL || !/^https:\/\//i.test(BASE_URL)) {
    throw new Error(
      'Set VERIFICATION_BASE_URL to your public HTTPS Vercel URL.'
    )
  }

  const csvText = await fs.readFile(CSV_FILE, 'utf8')

  const parsed = Papa.parse(csvText.replace(/^\uFEFF/, ''), {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (header) => header.trim(),
  })

  if (parsed.errors.length > 0) {
    throw new Error(
      `CSV error: ${parsed.errors.map((e) => e.message).join('; ')}`
    )
  }

  const rows = parsed.data
  const seenIds = new Set()

  if (rows.length === 0) {
    throw new Error('participants.csv contains no participant records.')
  }

  for (const [index, row] of rows.entries()) {
    const id = row.certificate_id?.trim()

    if (!id || !/^[A-Za-z0-9_-]{1,80}$/.test(id)) {
      throw new Error(
        `Invalid certificate_id on CSV data row ${index + 2}.`
      )
    }

    if (seenIds.has(id)) {
      throw new Error(`Duplicate certificate ID: ${id}`)
    }

    seenIds.add(id)
  }

  await fs.mkdir(OUTPUT_DIR, { recursive: true })

  let successCount = 0

  for (const row of rows) {
    const id = row.certificate_id.trim()
    const verificationUrl =
      `${BASE_URL}/verify/${encodeURIComponent(id)}`

    const outputFile = path.join(OUTPUT_DIR, `${id}.png`)

    await QRCode.toFile(outputFile, verificationUrl, {
      type: 'png',
      width: 1000,
      margin: 3,
      errorCorrectionLevel: 'H',
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    })

    console.log(`Generated: ${id}.png`)
    successCount++
  }

  console.log(
    `\nSuccessfully generated ${successCount} QR codes in: ${OUTPUT_DIR}`
  )
}

main().catch((error) => {
  console.error('\nQR generation failed:', error.message)
  process.exitCode = 1
})
