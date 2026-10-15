const diagnostics = {
  actions: {
    refresh: 'Refresh mock state',
    reset: 'Reset mock',
  },
  baseUrl: {
    hint: 'Change it in .env (see .env.example), then restart Metro with --reset-cache.',
    label: 'Mock server address',
  },
  errors: {
    unreachable: 'Mock server is not reachable at this address.',
  },
  loading: 'Loading mock state…',
  scenario: {
    current: 'Current scenario',
    title: 'Scenario',
  },
  state: {
    jobs: 'Jobs',
    noJobs: 'No jobs on the mock.',
    title: 'Mock counters',
  },
  title: 'Diagnostics',
};

export default diagnostics;
