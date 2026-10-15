// Runs on the host (Maestro GraalJS). ACTION: reset | scenario | state; MODE for scenario.
var baseUrl = 'http://127.0.0.1:8787';

if (ACTION === 'reset') {
  http.post(baseUrl + '/__test/reset', { body: '' });
}

if (ACTION === 'scenario') {
  http.post(baseUrl + '/__test/scenario', {
    body: JSON.stringify({ mode: MODE }),
    headers: { 'Content-Type': 'application/json' },
  });
}

var state = json(http.get(baseUrl + '/__test/state').body);

output.mode = state.mode;
output.stats = state.stats;
output.jobStatus = state.jobs.length > 0 ? state.jobs[0].status : 'none';
