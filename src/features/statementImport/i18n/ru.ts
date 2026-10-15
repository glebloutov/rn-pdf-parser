import type statementImport from '@features/statementImport/i18n/en';

const statementImportRu: typeof statementImport = {
  actions: {
    cancel: 'Отмена',
    checkAgain: 'Проверить снова',
    clearLocalData: 'Очистить данные на устройстве',
    confirmUpload: 'Отправить выписку',
    delete: 'Удалить импорт',
    details: 'Подробнее',
    pickFile: 'Выбрать выписку (PDF или CSV)',
    refresh: 'Обновить',
    retryDeletion: 'Повторить удаление',
    retryUpload: 'Повторить отправку',
    startNew: 'Новый импорт',
  },
  charge: {
    amount: 'Сумма',
    cadence: 'Периодичность',
    cadenceValue: {
      monthly: 'Ежемесячно',
    },
    lastSeen: 'Последнее списание',
    merchant: 'Получатель',
    notAvailable: 'Это списание больше недоступно.',
    title: 'Регулярное списание',
  },
  clearLocalData: {
    hint: 'Удаляет копии файла и сохранённое состояние только с этого устройства. Данные на сервере не удаляются.',
  },
  confirm: {
    fileName: 'Файл',
    format: 'Формат',
    hint: 'Файл проверен на устройстве. Его байты отправятся на сервер только после подтверждения.',
    size: 'Размер',
    title: 'Подтвердите выписку',
  },
  deletion: {
    accepted: 'Удаление запрошено. Ждём подтверждения сервера…',
    deleted: 'Удалено на сервере. Данные этого импорта больше не хранятся.',
    inProgress: 'Отправляем запрос на удаление…',
    notConfirmed:
      'Сервер не подтвердил удаление. Данные могут всё ещё храниться на сервере.',
  },
  empty: {
    description:
      'Выберите синтетическую банковскую выписку. Она будет проверена на устройстве до отправки.',
    title: 'Выписка не загружена',
  },
  errors: {
    COPY_FAILED: 'Не удалось прочитать файл. Выберите его ещё раз.',
    EMPTY_FILE: 'Файл пустой.',
    FILE_TOO_LARGE: 'Файл больше 10 МиБ и не был отправлен.',
    IMPORT_ALREADY_ACTIVE: 'Сначала завершите или удалите текущий импорт.',
    IMPORT_CONFLICT:
      'На сервере уже есть другой файл для этой отправки. Начните новый импорт.',
    IMPORT_NOT_DISCARDABLE: 'Сначала удалите импорт на сервере.',
    IMPORT_NOT_FOUND: 'Сервер больше не знает этот импорт.',
    INTERRUPTED: 'Приложение закрылось до ответа сервера.',
    INVALID_REQUEST: 'Сервер отклонил запрос на отправку.',
    INVALID_STATE: 'Это действие сейчас недоступно.',
    LOCAL_COPY_MISSING: 'Локальная копия файла пропала. Начните новый импорт.',
    NETWORK_UNAVAILABLE: 'Сервер недоступен.',
    NO_ACTIVE_IMPORT: 'Нет активного импорта.',
    OPERATION_IN_PROGRESS: 'Предыдущее действие ещё выполняется. Подождите.',
    PICK_CANCELLED: 'Файл не выбран.',
    PICK_FAILED: 'Не удалось открыть выбор файла.',
    SERVICE_UNAVAILABLE: 'Сервер временно недоступен.',
    UNEXPECTED_RESPONSE: 'Сервер прислал неожиданный ответ.',
    UNSUPPORTED_CONTENT:
      'Это не выписка в формате PDF или CSV. Файл не отправлен.',
  },
  format: {
    csv: 'CSV',
    pdf: 'PDF',
  },
  report: {
    monthlyTotal: 'Итого в месяц',
    title: 'Регулярные списания',
  },
  status: {
    deleted: 'Удалено',
    deleting: 'Удаление',
    failed: 'Импорт не удался',
    processing: 'Обработка',
    queued: 'В очереди — ждём обработки',
    ready: 'Готово',
    submitUncertain: 'Результат отправки неизвестен',
    submitting: 'Отправка…',
  },
  statusHints: {
    processing: 'Сервер анализирует выписку. Экран обновится автоматически.',
    queued: 'Файл принят. Отчёт ещё не готов.',
    submitUncertain:
      'Не удалось подтвердить, получил ли сервер файл. «Проверить снова» ищет его; «Повторить отправку» безопасно отправит его с тем же ключом.',
    checkingUpload: 'Проверяем, получил ли сервер файл…',
    submitUncertainNotFound: 'Сервер пока не нашёл эту отправку.',
  },
  statusMeta: {
    job: 'Задача {{jobId}} · ревизия {{revision}}',
    outdated:
      'Проигнорировано устаревших ответов сервера: {{count}} (последний: {{status}} · ревизия {{revision}})',
  },
  title: 'Импорт выписки',
  toasts: {
    deleted: 'Сервер подтвердил удаление.',
    deletionNotConfirmed: 'Удаление не подтверждено. Можно повторить.',
    importFailed: 'Импорт не удался.',
    localDataCleared: 'Локальные данные удалены с устройства.',
    reportReady: 'Отчёт готов.',
    uploadAccepted: 'Сервер принял файл.',
    uploadUncertain: 'Сервер не ответил. Проверьте отправку ещё раз.',
  },
};

export default statementImportRu;
