import { useState, useCallback, useRef } from 'react'
import { apiClient } from '@/shared/api/client'
import { UPLOAD } from '@/lib/constants'
import { toast } from '@/shared/stores/notificationStore'

export type UploadStatus = 'idle' | 'uploading' | 'processing' | 'done' | 'error'

export interface UploadState {
  status: UploadStatus
  progress: number
  uploadId: string | null
  videoId: string | null
  error: string | null
}

interface InitUploadResponse {
  uploadId: string
  totalChunks: number
}

interface CompleteUploadResponse {
  videoId: string
  status: string
}

export function useVideoUpload() {
  const [state, setState] = useState<UploadState>({
    status: 'idle',
    progress: 0,
    uploadId: null,
    videoId: null,
    error: null,
  })
  const abortRef = useRef<AbortController | null>(null)

  const upload = useCallback(
    async (
      file: File,
      metadata: { title: string; description?: string; tags?: string[] }
    ) => {
      if (!UPLOAD.allowedVideoTypes.includes(file.type)) {
        toast.error('Invalid file type', 'Please upload a video file (MP4, WebM, etc.)')
        return
      }
      if (file.size > UPLOAD.maxFileSize) {
        toast.error('File too large', 'Maximum file size is 500 MB.')
        return
      }

      abortRef.current = new AbortController()
      setState({ status: 'uploading', progress: 0, uploadId: null, videoId: null, error: null })

      try {
        // Step 1: Init upload
        const totalChunks = Math.ceil(file.size / UPLOAD.chunkSize)
        const { data: initData } = await apiClient.post<InitUploadResponse>('/videos/upload/init', {
          filename: file.name,
          fileSize: file.size,
          mimeType: file.type,
          totalChunks,
          ...metadata,
        })
        const { uploadId } = initData
        setState((s) => ({ ...s, uploadId }))

        // Step 2: Upload chunks
        for (let i = 0; i < totalChunks; i++) {
          if (abortRef.current?.signal.aborted) {
            throw new Error('Upload cancelled')
          }

          const start = i * UPLOAD.chunkSize
          const end = Math.min(start + UPLOAD.chunkSize, file.size)
          const chunk = file.slice(start, end)

          const formData = new FormData()
          formData.append('chunk', chunk)
          formData.append('uploadId', uploadId)
          formData.append('chunkIndex', String(i))
          formData.append('totalChunks', String(totalChunks))

          await apiClient.post('/videos/upload/chunk', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            signal: abortRef.current?.signal,
          })

          const progress = Math.round(((i + 1) / totalChunks) * 90)
          setState((s) => ({ ...s, progress }))
        }

        // Step 3: Complete upload
        setState((s) => ({ ...s, status: 'processing', progress: 90 }))
        const { data: completeData } = await apiClient.post<CompleteUploadResponse>(
          '/videos/upload/complete',
          { uploadId }
        )

        setState({
          status: 'done',
          progress: 100,
          uploadId,
          videoId: completeData.videoId,
          error: null,
        })
        toast.success('Upload complete!', 'Your video is now processing.')
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Upload failed'
        if (msg === 'Upload cancelled') return
        setState((s) => ({ ...s, status: 'error', error: msg }))
        toast.error('Upload failed', msg)
      }
    },
    []
  )

  const cancel = useCallback(() => {
    abortRef.current?.abort()
    setState({ status: 'idle', progress: 0, uploadId: null, videoId: null, error: null })
  }, [])

  const reset = useCallback(() => {
    setState({ status: 'idle', progress: 0, uploadId: null, videoId: null, error: null })
  }, [])

  return { state, upload, cancel, reset }
}

export function useImageUpload() {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const uploadImage = useCallback(async (file: File): Promise<string | null> => {
    if (!UPLOAD.allowedImageTypes.includes(file.type)) {
      setError('Invalid image type')
      return null
    }

    setIsUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('image', file)
      const { data } = await apiClient.post<{ url: string }>('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return data.url
    } catch {
      setError('Failed to upload image')
      return null
    } finally {
      setIsUploading(false)
    }
  }, [])

  return { uploadImage, isUploading, error }
}
