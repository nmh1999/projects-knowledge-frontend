/** Keep API calls same-origin so the development proxy and local hosting share one setup. */
const environment = Object.freeze({backEndUrl: '/api'});

export function getEnv(): typeof environment {
  return environment;
}
