import type diagnostics from '@features/diagnostics/i18n/en';

const diagnosticsRu: typeof diagnostics = {
  actions: {
    refresh: 'Обновить состояние mock',
    reset: 'Сбросить mock',
  },
  baseUrl: {
    hint: 'Меняется в .env (см. .env.example), затем перезапустите Metro с --reset-cache.',
    label: 'Адрес mock-сервера',
  },
  errors: {
    unreachable: 'Mock-сервер недоступен по этому адресу.',
  },
  loading: 'Загружаем состояние mock…',
  scenario: {
    current: 'Текущий сценарий',
    title: 'Сценарий',
  },
  state: {
    jobs: 'Задачи',
    noJobs: 'На mock нет задач.',
    title: 'Счётчики mock',
  },
  title: 'Диагностика',
};

export default diagnosticsRu;
