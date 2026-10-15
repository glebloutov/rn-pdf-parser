const statementImport = {
  actions: {
    cancel: 'Cancel',
    checkAgain: 'Check again',
    clearLocalData: 'Clear local data',
    confirmUpload: 'Upload statement',
    delete: 'Delete import',
    details: 'Details',
    pickFile: 'Choose statement (PDF or CSV)',
    refresh: 'Refresh',
    retryDeletion: 'Retry deletion',
    retryUpload: 'Retry upload',
    startNew: 'Start a new import',
  },
  charge: {
    amount: 'Amount',
    cadence: 'Cadence',
    cadenceValue: {
      monthly: 'Monthly',
    },
    lastSeen: 'Last seen',
    merchant: 'Merchant',
    notAvailable: 'This charge is no longer available.',
    title: 'Recurring charge',
  },
  clearLocalData: {
    hint: 'Removes file copies and saved state from this device only. Server data is not deleted.',
  },
  confirm: {
    fileName: 'File',
    format: 'Format',
    hint: 'The file is checked on this device. Only after you confirm are its bytes sent to the server.',
    size: 'Size',
    title: 'Confirm statement',
  },
  deletion: {
    accepted: 'Deletion requested. Waiting for the server to confirm…',
    deleted:
      'Deleted on the server. No statement data is kept for this import.',
    inProgress: 'Sending deletion request…',
    notConfirmed:
      'Deletion was not confirmed by the server. The data may still be stored on the server.',
  },
  empty: {
    description:
      'Choose a synthetic bank statement. It will be checked on your device before anything is sent.',
    title: 'No statement imported',
  },
  errors: {
    COPY_FAILED: 'The file could not be read. Try choosing it again.',
    EMPTY_FILE: 'The file is empty.',
    FILE_TOO_LARGE: 'The file is larger than 10 MiB and was not sent.',
    IMPORT_ALREADY_ACTIVE: 'Finish or delete the current import first.',
    IMPORT_CONFLICT:
      'The server already has a different file for this upload. Start a new import.',
    IMPORT_NOT_DISCARDABLE: 'Delete the import on the server first.',
    IMPORT_NOT_FOUND: 'The server no longer knows this import.',
    INTERRUPTED: 'The app was closed before the server answered.',
    INVALID_REQUEST: 'The server rejected the upload request.',
    INVALID_STATE: 'This action is not available right now.',
    LOCAL_COPY_MISSING:
      'The local copy of the file is gone. Start a new import.',
    NETWORK_UNAVAILABLE: 'The server could not be reached.',
    NO_ACTIVE_IMPORT: 'There is no active import.',
    OPERATION_IN_PROGRESS: 'Another action is still running. Please wait.',
    PICK_CANCELLED: 'No file was chosen.',
    PICK_FAILED: 'The file picker could not be opened.',
    SERVICE_UNAVAILABLE: 'The server is temporarily unavailable.',
    UNEXPECTED_RESPONSE: 'The server sent an unexpected response.',
    UNSUPPORTED_CONTENT:
      'This file is not a PDF or CSV statement and was not sent.',
  },
  format: {
    csv: 'CSV',
    pdf: 'PDF',
  },
  report: {
    monthlyTotal: 'Total per month',
    title: 'Recurring charges',
  },
  status: {
    deleted: 'Deleted',
    deleting: 'Deleting',
    failed: 'Import failed',
    processing: 'Processing',
    queued: 'Queued — waiting for processing',
    ready: 'Ready',
    submitUncertain: 'Upload result unknown',
    submitting: 'Uploading…',
  },
  statusHints: {
    processing:
      'The server is analysing the statement. This screen updates automatically.',
    queued: 'The upload was accepted. The report is not ready yet.',
    submitUncertain:
      'We could not confirm whether the server received the file. "Check again" looks it up; "Retry upload" resends it safely with the same key.',
    checkingUpload: 'Checking whether the server received the upload…',
    submitUncertainNotFound: 'The server has not found this upload yet.',
  },
  statusMeta: {
    job: 'Job {{jobId}} · revision {{revision}}',
    outdated:
      'Ignored outdated server answers: {{count}} (last: {{status}} · revision {{revision}})',
  },
  title: 'Statement import',
  toasts: {
    deleted: 'The server confirmed the deletion.',
    deletionNotConfirmed: 'Deletion not confirmed. You can retry it.',
    importFailed: 'The import failed.',
    localDataCleared: 'Local data cleared from this device.',
    reportReady: 'The report is ready.',
    uploadAccepted: 'Upload accepted by the server.',
    uploadUncertain: 'No answer from the server. Check the upload again.',
  },
};

export default statementImport;
