export interface UploadProgress {
  /** « sending » pendant l'envoi, « processing » quand tout est envoyé et que le serveur écrit les fichiers */
  phase: 'preparing' | 'sending' | 'processing'
  loaded: number
  total: number
  percent: number
}

// fetch ne donne pas la progression d'un envoi : on passe par XMLHttpRequest.
// En cas d'échec, l'erreur a la même forme que celle de $fetch : { data: <corps JSON de l'API> }.
export function postWithProgress<T>(
  url: string,
  body: FormData,
  onProgress: (progress: UploadProgress) => void,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', url)

    let total = 0
    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return
      total = event.total
      onProgress({
        phase: 'sending',
        loaded: event.loaded,
        total: event.total,
        percent: Math.round((event.loaded / event.total) * 100),
      })
    }
    xhr.upload.onload = () => {
      onProgress({ phase: 'processing', loaded: total, total, percent: 100 })
    }

    xhr.onload = () => {
      let json: unknown = null
      try {
        json = xhr.responseText ? JSON.parse(xhr.responseText) : null
      } catch {
        json = null
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(json as T)
      } else {
        reject({ data: json ?? { statusMessage: `Request failed (${xhr.status})` } })
      }
    }
    xhr.onerror = () => reject({ data: { statusMessage: 'Network error. Check your connection and try again.' } })

    xhr.send(body)
  })
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
