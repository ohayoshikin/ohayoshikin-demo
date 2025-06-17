export async function request(
  {
    url,
    method = 'GET',
    data,
    headers = {},
    signal,
  }: {
    url: string
    method: string
    data?: any
    headers?: HeadersInit
    signal?: AbortSignal
  }
) {
  const options: RequestInit = {
    method,
    headers,
    signal,
  }

  if (!(options.headers as Record<string, string>)['Content-Type']) {
    (options.headers as Record<string, string>)['Content-Type'] = (
      method === 'GET' || method === 'HEAD'
        ? 'application/x-www-form-urlencoded'
        : 'application/json'
    )
  }

  if (data) {
    if (method === 'GET' || method === 'HEAD') {
      const params = new URLSearchParams(data)
      url += (url.indexOf('?') === -1 ? '?' : '&') + params.toString()
    } else {
      options.body = JSON.stringify(data)
    }
  }

  try {
    const response = await fetch(url, options)
    const data = await response.json()
    return data.data
  } catch (error) {
    console.error(error)
    return Promise.reject(error)
  }


    // .then((response) => {
    //   if (!response.ok) {
    //     throw new Error(`HTTP error! status: ${response.status}`)
    //   }
    //   return response.json()
    // })
    // .catch((error) => {
    //   console.error('Fetch error:', error)
    //   throw error
    // })
}