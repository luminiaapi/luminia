/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RequestTab } from '../types';

export function generateCurl(tab: RequestTab): string {
  let curl = `curl --location '${tab.url}' \\\n`;
  curl += `--request ${tab.method} \\\n`;

  // Headers
  tab.headers.forEach(h => {
    if (h.enabled && h.key) {
      curl += `--header '${h.key}: ${h.value}' \\\n`;
    }
  });

  // Auth
  if (tab.auth.type === 'bearer' && tab.auth.bearerToken) {
    curl += `--header 'Authorization: Bearer ${tab.auth.bearerToken}' \\\n`;
  } else if (tab.auth.type === 'basic') {
    const auth = btoa(`${tab.auth.username}:${tab.auth.password}`);
    curl += `--header 'Authorization: Basic ${auth}' \\\n`;
  } else if (tab.auth.type === 'apikey' && tab.auth.apiKeyName) {
    curl += `--header '${tab.auth.apiKeyName}: ${tab.auth.apiKeyValue}' \\\n`;
  }

  // Body
  if (tab.bodyType === 'json' && tab.body) {
    curl += `--header 'Content-Type: application/json' \\\n`;
    curl += `--data '${tab.body.replace(/'/g, "'\\''")}'`;
  } else if (tab.bodyType === 'urlencoded') {
    curl += `--header 'Content-Type: application/x-www-form-urlencoded' \\\n`;
    const data = tab.bodyUrlEncoded
      .filter(p => p.enabled && p.key)
      .map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`)
      .join('&');
    curl += `--data '${data}'`;
  } else if (tab.bodyType === 'form-data') {
    tab.bodyFormData.forEach(f => {
      if (f.enabled && f.key) {
        curl += `--form '${f.key}="${f.value}"' \\\n`;
      }
    });
    curl = curl.trim().replace(/ \\$/, '');
  } else {
    curl = curl.trim().replace(/ \\$/, '');
  }

  return curl;
}

export function generateFetch(tab: RequestTab): string {
  const headers: Record<string, string> = {};
  tab.headers.forEach(h => {
    if (h.enabled && h.key) headers[h.key] = h.value;
  });

  if (tab.auth.type === 'bearer' && tab.auth.bearerToken) {
    headers['Authorization'] = `Bearer ${tab.auth.bearerToken}`;
  } else if (tab.auth.type === 'basic') {
    headers['Authorization'] = `Basic ${btoa(`${tab.auth.username}:${tab.auth.password}`)}`;
  } else if (tab.auth.type === 'apikey' && tab.auth.apiKeyName) {
    headers[tab.auth.apiKeyName] = tab.auth.apiKeyValue || '';
  }

  let body = '';
  if (tab.bodyType === 'json' && tab.body) {
    headers['Content-Type'] = 'application/json';
    body = `\n  body: JSON.stringify(${tab.body}),`;
  } else if (tab.bodyType === 'urlencoded') {
    headers['Content-Type'] = 'application/x-www-form-urlencoded';
    const data = tab.bodyUrlEncoded
      .filter(p => p.enabled && p.key)
      .map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`)
      .join('&');
    body = `\n  body: "${data}",`;
  }

  const options = {
    method: tab.method,
    headers,
  };

  return `fetch("${tab.url}", {
  method: "${tab.method}",
  headers: ${JSON.stringify(headers, null, 4).replace(/\n/g, '\n  ')},${body}
})
  .then(response => response.json())
  .then(result => console.log(result))
  .catch(error => console.log('error', error));`;
}

export function generateAxios(tab: RequestTab): string {
  const headers: Record<string, string> = {};
  tab.headers.forEach(h => {
    if (h.enabled && h.key) headers[h.key] = h.value;
  });

  if (tab.auth.type === 'bearer' && tab.auth.bearerToken) {
    headers['Authorization'] = `Bearer ${tab.auth.bearerToken}`;
  }

  let data = '';
  if (tab.bodyType === 'json' && tab.body) {
    headers['Content-Type'] = 'application/json';
    data = `\n  data: ${tab.body},`;
  }

  return `const axios = require('axios');

let config = {
  method: '${tab.method.toLowerCase()}',
  maxBodyLength: Infinity,
  url: '${tab.url}',
  headers: ${JSON.stringify(headers, null, 4).replace(/\n/g, '\n  ')},${data}
};

axios.request(config)
.then((response) => {
  console.log(JSON.stringify(response.data));
})
.catch((error) => {
  console.log(error);
});`;
}

export function generatePowerShell(tab: RequestTab): string {
  let headers = '';
  tab.headers.forEach(h => {
    if (h.enabled && h.key) {
      headers += `  "${h.key}" = "${h.value}"\n`;
    }
  });

  if (tab.auth.type === 'bearer' && tab.auth.bearerToken) {
    headers += `  "Authorization" = "Bearer ${tab.auth.bearerToken}"\n`;
  }

  let body = '';
  if (tab.bodyType === 'json' && tab.body) {
    body = `$body = '${tab.body.replace(/'/g, "''")}'\n`;
  }

  return `${body}$headers = New-Object "System.Collections.Generic.Dictionary[[String],[String]]"
${headers.trim() ? headers : '  # No headers'}

$response = Invoke-RestMethod '${tab.url}' -Method '${tab.method}' -Headers $headers${body ? ' -Body $body' : ''}
$response | ConvertTo-Json`;
}

export function generatePython(tab: RequestTab): string {
  let headers = '{\n';
  tab.headers.forEach(h => {
    if (h.enabled && h.key) {
      headers += `  '${h.key}': '${h.value}',\n`;
    }
  });
  headers += '}';

  let payload = 'None';
  if (tab.bodyType === 'json' && tab.body) {
    payload = `'''${tab.body}'''`;
  }

  return `import requests

url = "${tab.url}"
payload = ${payload}
headers = ${headers}

response = requests.request("${tab.method}", url, headers=headers, data=payload)

print(response.text)`;
}
