const path = require('path')
const { pool } = require('../config/postgres/postgres')
const { streamCsvRows } = require('./csvImporter')
const { emptyToNull } = require('./utils/emptyToNull')
const { logRowFailure } = require('./utils/rowLogger')
const { recordRowError } = require('./utils/errorRecorder')
const { reportProgress } = require('./utils/progressReporter')
const { extractStoreIdFromControlFunctions, extractTerminalCodes } = require('./dimensions/extractors')
const { recordAssociation } = require('./dimensions/associationTracker')
const { upsertBatch } = require('./dimensions/upsertBatch')

const DEFAULT_BATCH_SIZE = 500
const DEFAULT_PROGRESS_INTERVAL = 50000

// Trust tiers for association precedence — lower wins. Store: payment is the
// stated primary source, order's embedded control_functions.storeId is
// secondary. Terminal->merchant: terminal_events is the owning/fleet
// merchant (schema.sql's own documented intent for terminal.merchant_id),
// order is secondary, api_logs is the lowest-trust fallback.
const STORE_TIER_PAYMENT = 0
const STORE_TIER_ORDER = 1
const TERMINAL_MERCHANT_TIER_TERMINAL_EVENTS = 0
const TERMINAL_MERCHANT_TIER_ORDER = 1
const TERMINAL_MERCHANT_TIER_API_LOG = 2
const TERMINAL_STORE_TIER_ORDER = 0 // order is the only source of terminal->store

// Duplicated intentionally from importManager.js rather than importing it,
// so this file has zero coupling to (and zero risk of ever changing the
// behavior of) the existing fact-table import path.
async function createDimensionJob(client, { datasetType, sourceFileName }) {
  const result = await client.query(
    `INSERT INTO import_jobs (dataset_type, source_file_name, file_checksum, status, started_at)
     VALUES ($1, $2, NULL, 'RUNNING', now())
     RETURNING import_job_id`,
    [datasetType, sourceFileName]
  )
  return result.rows[0].import_job_id
}

async function finalizeDimensionJob(client, importJobId, { status, rowCount, errorCount }) {
  await client.query(
    `UPDATE import_jobs
     SET status = $2, row_count = $3, error_count = $4, completed_at = now()
     WHERE import_job_id = $1`,
    [importJobId, status, rowCount, errorCount]
  )
}

// Scans every transactional CSV exactly once (no dimension re-reads a file
// another dimension already needed — merchant/store/terminal/terminal_code
// are all derived from the same single pass over each file), builds the
// distinct dimension row sets in memory, then inserts them idempotently.
async function loadDimensions({
  orderFiles = [],
  paymentFiles = [],
  apiLogFiles = [],
  terminalEventFiles = [],
  dryRun = false,
  batchSize = DEFAULT_BATCH_SIZE,
  progressInterval = DEFAULT_PROGRESS_INTERVAL,
  onProgress,
} = {}) {
  const merchantIds = new Set()

  const storeToMerchant = new Map()
  const storeTier = new Map()

  const terminalToMerchant = new Map()
  const terminalMerchantTier = new Map()

  const terminalToStore = new Map()
  const terminalStoreTier = new Map()

  const terminalCodes = new Set()

  const rowCounts = { merchant: 0, store: 0, terminal: 0, terminal_code: 0 }
  const conflicts = []
  const skipped = []

  let scannedRows = 0

  const maybeReportProgress = () => {
    if (scannedRows % progressInterval !== 0) return
    const progress = {
      fileLabel: 'Dimension scan (merchant / store / terminal / terminal_code)',
      rowsProcessed: scannedRows,
      validCount: scannedRows - conflicts.length - skipped.length,
      invalidCount: conflicts.length + skipped.length,
      totalRows: null, // see note in the sprint write-up: a pre-count pass here would double I/O over several GB of source data for a UI nicety
    }
    if (onProgress) onProgress(progress)
    else reportProgress(progress)
  }

  const recordSkip = (dataset, sourceFile) => (skipErr) => {
    scannedRows += 1
    skipped.push({
      dataset,
      sourceFile: path.basename(sourceFile),
      rowIndex: scannedRows,
      message: skipErr.message || String(skipErr),
    })
  }

  async function scanOrderFile(filePath) {
    const fileLabel = path.basename(filePath)

    await streamCsvRows(
      filePath,
      async (row, rowIndex) => {
        scannedRows += 1
        rowCounts.merchant += 1
        rowCounts.store += 1
        rowCounts.terminal += 1

        const merchantId = emptyToNull(row.merchant_id)
        const terminalId = emptyToNull(row.terminal_id)
        const storeId = extractStoreIdFromControlFunctions(row.control_functions)

        if (merchantId) merchantIds.add(merchantId)

        if (storeId) {
          recordAssociation({
            valueMap: storeToMerchant,
            tierMap: storeTier,
            conflicts,
            dimension: 'store',
            sourceFile: fileLabel,
            rowIndex,
            key: storeId,
            value: merchantId,
            tier: STORE_TIER_ORDER,
          })
        }

        if (terminalId) {
          recordAssociation({
            valueMap: terminalToMerchant,
            tierMap: terminalMerchantTier,
            conflicts,
            dimension: 'terminal',
            sourceFile: fileLabel,
            rowIndex,
            key: terminalId,
            value: merchantId,
            tier: TERMINAL_MERCHANT_TIER_ORDER,
          })

          if (storeId) {
            recordAssociation({
              valueMap: terminalToStore,
              tierMap: terminalStoreTier,
              conflicts,
              dimension: 'terminal',
              sourceFile: fileLabel,
              rowIndex,
              key: terminalId,
              value: storeId,
              tier: TERMINAL_STORE_TIER_ORDER,
            })
          }
        }

        maybeReportProgress()
      },
      recordSkip('merchant', filePath)
    )
  }

  async function scanPaymentFile(filePath) {
    const fileLabel = path.basename(filePath)

    await streamCsvRows(
      filePath,
      async (row, rowIndex) => {
        scannedRows += 1
        rowCounts.merchant += 1
        rowCounts.store += 1
        rowCounts.terminal_code += 1

        const merchantId = emptyToNull(row.merchant_id)
        const storeId = emptyToNull(row.store_id)

        if (merchantId) merchantIds.add(merchantId)

        if (storeId) {
          recordAssociation({
            valueMap: storeToMerchant,
            tierMap: storeTier,
            conflicts,
            dimension: 'store',
            sourceFile: fileLabel,
            rowIndex,
            key: storeId,
            value: merchantId,
            tier: STORE_TIER_PAYMENT,
          })
        }

        for (const code of extractTerminalCodes(row.terminal_code)) {
          terminalCodes.add(code)
        }

        maybeReportProgress()
      },
      recordSkip('merchant', filePath)
    )
  }

  async function scanApiLogFile(filePath) {
    const fileLabel = path.basename(filePath)

    await streamCsvRows(
      filePath,
      async (row, rowIndex) => {
        scannedRows += 1
        rowCounts.merchant += 1
        rowCounts.terminal += 1

        const merchantId = emptyToNull(row.merchant_id)
        const terminalId = emptyToNull(row.terminal_id)

        if (merchantId) merchantIds.add(merchantId)

        if (terminalId) {
          recordAssociation({
            valueMap: terminalToMerchant,
            tierMap: terminalMerchantTier,
            conflicts,
            dimension: 'terminal',
            sourceFile: fileLabel,
            rowIndex,
            key: terminalId,
            value: merchantId,
            tier: TERMINAL_MERCHANT_TIER_API_LOG,
          })
        }

        maybeReportProgress()
      },
      recordSkip('merchant', filePath)
    )
  }

  async function scanTerminalEventFile(filePath) {
    const fileLabel = path.basename(filePath)

    await streamCsvRows(
      filePath,
      async (row, rowIndex) => {
        scannedRows += 1
        rowCounts.merchant += 1
        rowCounts.terminal += 1

        const merchantId = emptyToNull(row.merchant_id)
        const terminalId = emptyToNull(row.terminal_id)

        if (merchantId) merchantIds.add(merchantId)

        if (terminalId) {
          recordAssociation({
            valueMap: terminalToMerchant,
            tierMap: terminalMerchantTier,
            conflicts,
            dimension: 'terminal',
            sourceFile: fileLabel,
            rowIndex,
            key: terminalId,
            value: merchantId,
            tier: TERMINAL_MERCHANT_TIER_TERMINAL_EVENTS,
          })
        }

        maybeReportProgress()
      },
      recordSkip('merchant', filePath)
    )
  }

  // Sequential, not parallel — keeps memory/IO predictable and progress
  // reporting coherent across a dataset of this size.
  for (const f of orderFiles) await scanOrderFile(f)
  for (const f of paymentFiles) await scanPaymentFile(f)
  for (const f of apiLogFiles) await scanApiLogFile(f)
  for (const f of terminalEventFiles) await scanTerminalEventFile(f)

  const merchantRows = [...merchantIds].map((id) => ({ merchant_id: id }))
  const storeRows = [...storeToMerchant.entries()].map(([storeId, merchantId]) => ({
    store_id: storeId,
    merchant_id: merchantId,
  }))
  const terminalRows = [...terminalToMerchant.entries()].map(([terminalId, merchantId]) => ({
    terminal_id: terminalId,
    merchant_id: merchantId,
    store_id: terminalToStore.get(terminalId) || null,
  }))
  const terminalCodeRows = [...terminalCodes].map((code) => ({ terminal_code: code }))

  const candidates = {
    merchant: merchantRows.length,
    store: storeRows.length,
    terminal: terminalRows.length,
    terminal_code: terminalCodeRows.length,
  }

  if (dryRun) {
    console.log(`\nDIMENSION LOADER — DRY RUN SUMMARY\n`)
    console.log(`Rows Scanned: ${scannedRows.toLocaleString('en-US')}`)
    console.log(`Merchant candidates: ${candidates.merchant}`)
    console.log(`Store candidates: ${candidates.store}`)
    console.log(`Terminal candidates: ${candidates.terminal}`)
    console.log(`Terminal Code candidates: ${candidates.terminal_code}`)
    console.log(`Association conflicts: ${conflicts.length}`)
    console.log(`CSV parse issues: ${skipped.length}`)

    return { dryRun: true, scannedRows, candidates, conflicts, skipped }
  }

  const client = await pool.connect()
  const jobIds = {}

  try {
    jobIds.merchant = await createDimensionJob(client, {
      datasetType: 'merchant',
      sourceFileName: `${orderFiles.length + paymentFiles.length + apiLogFiles.length + terminalEventFiles.length} files across order+payment+api_log+terminal_events`,
    })
    jobIds.store = await createDimensionJob(client, {
      datasetType: 'store',
      sourceFileName: `${orderFiles.length + paymentFiles.length} files across order+payment`,
    })
    jobIds.terminal = await createDimensionJob(client, {
      datasetType: 'terminal',
      sourceFileName: `${orderFiles.length + apiLogFiles.length + terminalEventFiles.length} files across order+api_log+terminal_events`,
    })
    jobIds.terminal_code = await createDimensionJob(client, {
      datasetType: 'terminal_code',
      sourceFileName: `${paymentFiles.length} files across payment`,
    })

    for (const s of skipped) {
      logRowFailure({ datasetType: 'merchant', sourceFileName: s.sourceFile, rowIndex: s.rowIndex, reason: s.message })
      await recordRowError(client, {
        importJobId: jobIds.merchant,
        dataset: 'merchant',
        rowNumber: s.rowIndex,
        errorType: 'CSV_PARSE',
        errorMessage: `[${s.sourceFile}] ${s.message}`,
        rawRow: null,
      })
    }

    for (const c of conflicts) {
      logRowFailure({ datasetType: c.dimension, sourceFileName: c.sourceFile, rowIndex: c.rowIndex, reason: c.message })
      await recordRowError(client, {
        importJobId: jobIds[c.dimension],
        dataset: c.dimension,
        rowNumber: c.rowIndex,
        errorType: 'CONFLICT',
        errorMessage: `[${c.sourceFile}] ${c.message}`,
        rawRow: null,
      })
    }

    const insertDimension = async (table, columns, rows, conflictTarget) => {
      let attempted = 0
      for (let i = 0; i < rows.length; i += batchSize) {
        const chunk = rows.slice(i, i + batchSize)
        await upsertBatch(client, { table, columns, rows: chunk, conflictTarget })
        attempted += chunk.length
      }
      return attempted
    }

    await insertDimension('merchant', ['merchant_id'], merchantRows, 'merchant_id')
    await insertDimension('store', ['store_id', 'merchant_id'], storeRows, 'store_id')
    await insertDimension('terminal', ['terminal_id', 'merchant_id', 'store_id'], terminalRows, 'terminal_id')
    await insertDimension('terminal_code', ['terminal_code'], terminalCodeRows, 'terminal_code')

    const conflictCountByDimension = (dim) => conflicts.filter((c) => c.dimension === dim).length

    await finalizeDimensionJob(client, jobIds.merchant, {
      status: 'SUCCEEDED',
      rowCount: rowCounts.merchant,
      errorCount: skipped.length,
    })
    await finalizeDimensionJob(client, jobIds.store, {
      status: 'SUCCEEDED',
      rowCount: rowCounts.store,
      errorCount: conflictCountByDimension('store'),
    })
    await finalizeDimensionJob(client, jobIds.terminal, {
      status: 'SUCCEEDED',
      rowCount: rowCounts.terminal,
      errorCount: conflictCountByDimension('terminal'),
    })
    await finalizeDimensionJob(client, jobIds.terminal_code, {
      status: 'SUCCEEDED',
      rowCount: rowCounts.terminal_code,
      errorCount: 0,
    })

    return { dryRun: false, scannedRows, jobIds, candidates, conflicts, skipped }
  } catch (fatalErr) {
    for (const id of Object.values(jobIds)) {
      if (id) {
        await finalizeDimensionJob(client, id, { status: 'FAILED', rowCount: 0, errorCount: 0 }).catch(() => {})
      }
    }
    throw fatalErr
  } finally {
    client.release()
  }
}

module.exports = { loadDimensions }
