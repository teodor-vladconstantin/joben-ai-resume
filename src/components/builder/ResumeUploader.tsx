'use client'

import { useRef, useState } from 'react'
import { AlertCircle, CheckCircle2, FileText, Loader2, Upload, X } from 'lucide-react'

interface ParsedResume {
  full_name: string | null
  email: string | null
  phone: string | null
  location: string | null
  summary: string | null
  work_experience: Array<{
    company: string
    role: string
    start_date: string | null
    end_date: string | null
    description: string | null
  }>
  education: Array<{
    institution: string
    degree: string
    field: string
    start_date: string | null
    end_date: string | null
  }>
  skills: string[]
  languages: Array<{
    language: string
    level: string
  }>
  certifications: string[]
}

interface ResumeUploaderProps {
  onParsed?: (resume: ParsedResume) => void
  maxFiles?: number
}

const MAX_FILES_PER_SLOT = 3
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024
const MAX_FILES_ERROR_MESSAGE = 'You can upload a maximum of 3 CVs per slot.'
const INVALID_FILE_ERROR_MESSAGE = 'Only .pdf and .docx files are allowed.'

const ALLOWED_TYPES = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
const ALLOWED_EXTENSIONS = ['.pdf', '.docx']

function getExtension(fileName: string): string {
  const index = fileName.lastIndexOf('.')
  if (index < 0) return ''
  return fileName.slice(index).toLowerCase()
}

function isValidFile(file: File): boolean {
  const extension = getExtension(file.name)
  if (!ALLOWED_EXTENSIONS.includes(extension)) return false
  if (file.type === '') return true
  return ALLOWED_TYPES.includes(file.type)
}

export function ResumeUploader({ onParsed, maxFiles = MAX_FILES_PER_SLOT }: ResumeUploaderProps) {
  const effectiveMaxFiles = Math.min(maxFiles, MAX_FILES_PER_SLOT)

  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [parsedData, setParsedData] = useState<ParsedResume | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (file: File) => {
    setError(null)

    if (!isValidFile(file)) {
      setError(INVALID_FILE_ERROR_MESSAGE)
      return
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError('File must be under 5 MB.')
      return
    }

    if (uploadedFiles.length >= effectiveMaxFiles) {
      if (effectiveMaxFiles === MAX_FILES_PER_SLOT) {
        setError(MAX_FILES_ERROR_MESSAGE)
      } else {
        setError(`You can upload a maximum of ${effectiveMaxFiles} CVs per slot.`)
      }
      return
    }

    setPendingFile(file)
    setShowModal(true)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleContinueUpload = async () => {
    if (!pendingFile || isLoading) return

    setShowModal(false)
    setIsLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', pendingFile)

      const response = await fetch('/parse', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = (await response.json()) as { detail?: string; error?: string }
        throw new Error(errorData.detail || errorData.error || 'Failed to parse resume')
      }

      const data = (await response.json()) as ParsedResume
      setUploadedFiles((prev) => [...prev, pendingFile])
      setParsedData(data)
      setPendingFile(null)

      if (onParsed) {
        onParsed(data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse resume. Please try again.')
      setPendingFile(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setShowModal(false)
    setPendingFile(null)
  }

  const handleRemoveFile = (index: number) => {
    setUploadedFiles((prev) => {
      const next = prev.filter((_, i) => i !== index)
      if (next.length === 0) {
        setParsedData(null)
      }
      return next
    })
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 max-w-md rounded-lg border border-gray-800 bg-gray-900 p-8">
            <h3 className="mb-3 text-lg font-semibold text-white">Before you upload</h3>
            <p className="mb-6 text-gray-400">
              For best results, upload a digitally generated PDF or DOCX file. Scanned documents or photos of CVs may produce incomplete results.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                className="flex-1 rounded-lg bg-gray-800 px-4 py-2 font-medium text-white transition hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleContinueUpload}
                disabled={isLoading}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Got it, continue
              </button>
            </div>
          </div>
        </div>
      )}

      {!parsedData && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition ${
            isDragging
              ? 'border-blue-500 bg-blue-500/10'
              : 'border-gray-700 bg-gray-900/50 hover:border-gray-600 hover:bg-gray-900'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx"
            onChange={handleInputChange}
            className="hidden"
            disabled={isLoading}
          />

          {isLoading ? (
            <>
              <Loader2 className="mx-auto mb-3 h-12 w-12 animate-spin text-blue-500" />
              <p className="text-gray-400">Uploading and parsing your file...</p>
            </>
          ) : (
            <>
              <Upload className="mx-auto mb-3 h-12 w-12 text-gray-500" />
              <p className="mb-1 font-medium text-white">Drag and drop your CV here</p>
              <p className="mb-3 text-sm text-gray-400">or click to browse</p>
              <p className="text-xs text-gray-500">
                PDF or DOCX - Max 5MB - {uploadedFiles.length}/{effectiveMaxFiles} files uploaded
              </p>
            </>
          )}
        </div>
      )}

      {error && (
        <div className="mt-4 flex gap-3 rounded-lg border border-red-800 bg-red-900/20 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {uploadedFiles.length > 0 && (
        <div className="mt-6 space-y-2">
          <p className="mb-3 text-sm font-medium text-gray-400">Uploaded files ({uploadedFiles.length}/{effectiveMaxFiles})</p>
          {uploadedFiles.map((file, index) => (
            <div key={index} className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-900/50 p-3">
              <div className="flex min-w-0 items-center gap-3">
                <FileText className="h-4 w-4 shrink-0 text-blue-500" />
                <span className="truncate text-sm text-gray-300">{file.name}</span>
              </div>
              <button
                onClick={() => handleRemoveFile(index)}
                className="text-gray-500 transition hover:text-red-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}

          {isLoading ? (
            <p className="inline-flex items-center gap-2 text-sm text-blue-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Uploading and parsing your file...
            </p>
          ) : null}

          {uploadedFiles.length < effectiveMaxFiles && (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="mt-4 w-full rounded-lg border border-dashed border-gray-700 px-4 py-2 text-gray-400 transition hover:border-gray-600 hover:text-gray-300 disabled:opacity-50"
            >
              + Add another file
            </button>
          )}
        </div>
      )}

      {parsedData && (
        <div className="mt-8 space-y-6">
          <div className="flex items-start gap-4">
            <CheckCircle2 className="mt-1 h-6 w-6 shrink-0 text-green-500" />
            <div>
              <h3 className="text-xl font-semibold text-white">{parsedData.full_name || 'Resume'}</h3>
              <p className="text-sm text-gray-400">Successfully parsed</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {parsedData.email && (
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">Email</p>
                <p className="text-white">{parsedData.email}</p>
              </div>
            )}
            {parsedData.phone && (
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">Phone</p>
                <p className="text-white">{parsedData.phone}</p>
              </div>
            )}
            {parsedData.location && (
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">Location</p>
                <p className="text-white">{parsedData.location}</p>
              </div>
            )}
          </div>

          {parsedData.summary && (
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">Professional Summary</p>
              <p className="text-sm leading-relaxed text-gray-300">{parsedData.summary}</p>
            </div>
          )}

          {parsedData.skills.length > 0 && (
            <div>
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-500">Skills</p>
              <div className="flex flex-wrap gap-2">
                {parsedData.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="rounded-full border border-blue-800 bg-blue-900/30 px-3 py-1 text-sm text-blue-300"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {parsedData.work_experience.length > 0 && (
            <div>
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-500">Work Experience</p>
              <div className="space-y-4">
                {parsedData.work_experience.map((exp, index) => (
                  <div key={index} className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
                    <div className="mb-2 flex items-start justify-between">
                      <div>
                        <p className="font-medium text-white">{exp.role}</p>
                        <p className="text-sm text-gray-400">{exp.company}</p>
                      </div>
                      {(exp.start_date || exp.end_date) && (
                        <p className="text-xs text-gray-500">
                          {exp.start_date && exp.start_date} {exp.end_date && `- ${exp.end_date}`}
                        </p>
                      )}
                    </div>
                    {exp.description && <p className="mt-2 text-sm text-gray-300">{exp.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {parsedData.education.length > 0 && (
            <div>
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-500">Education</p>
              <div className="space-y-3">
                {parsedData.education.map((edu, index) => (
                  <div key={index} className="rounded-lg border border-gray-800 bg-gray-900/50 p-3">
                    <p className="font-medium text-white">{edu.degree}</p>
                    <p className="text-sm text-gray-400">{edu.institution}</p>
                    {edu.field && <p className="text-sm text-gray-500">{edu.field}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {parsedData.languages.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">Languages</p>
              <div className="flex flex-wrap gap-2">
                {parsedData.languages.map((lang, index) => (
                  <span key={index} className="text-sm text-gray-300">
                    {lang.language} <span className="text-gray-500">({lang.level})</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {parsedData.certifications.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">Certifications</p>
              <ul className="space-y-1">
                {parsedData.certifications.map((cert, index) => (
                  <li key={index} className="text-sm text-gray-300">
                    - {cert}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={() => {
              setUploadedFiles([])
              setParsedData(null)
              setError(null)
            }}
            className="mt-6 w-full rounded-lg bg-gray-800 px-4 py-2 font-medium text-white transition hover:bg-gray-700"
          >
            Upload Another CV
          </button>
        </div>
      )}
    </div>
  )
}
