// Reviewer helper for the mock's test-control routes. Usage:
//   node scripts/mock-control.mjs state | reset | scenario <happy|lost_ack|stale_status|delete_failure>
const baseUrl = process.env.MOCK_URL ?? 'http://127.0.0.1:8787';
const [command, argument] = process.argv.slice(2);

const request = async (path, init) => {
  const response = await fetch(`${baseUrl}${path}`, init);
  console.log(JSON.stringify(await response.json(), null, 2));
};

const commands = {
  reset: () => request('/__test/reset', { method: 'POST' }),
  scenario: () =>
    request('/__test/scenario', {
      body: JSON.stringify({ mode: argument }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    }),
  state: () => request('/__test/state'),
};

const run = commands[command];

if (!run) {
  console.error('Usage: node scripts/mock-control.mjs state | reset | scenario <mode>');
  process.exit(1);
}

await run();
