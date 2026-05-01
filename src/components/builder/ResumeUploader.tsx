'use client'

import React, { useState, useRef } from 'react'
import { Upload, FileText, X, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'

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

export function ResumeUploader({ onParsed, maxFiles = 3 }: ResumeUploaderProps) {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [parsedData, setParsedData] = useState<ParsedResume | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const ALLOWED_TYPES = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  const ALLOWED_EXTENSIONS = ['.pdf', '.docx']

  const isValidFile = (file: File): boolean => {
    const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()
    return ALLOWED_EXTENSIONS.includes(extension) && ALLOWED_TYPES.includes(file.type)
  }

  const handleFileSelect = (file: File) => {
    setError(null)

    // Check if file type is valid
    if (!isValidFile(file)) {
      setError('Invalid file type. Please upload a PDF or DOCX file.')
      return
    }

    // Check if we already have max files
    if (uploadedFiles.length >= maxFiles) {
      setError(`You can upload a maximum of ${maxFiles} CVs per slot.`)
      return
    }

    // Show modal before uploading
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
    if (!pendingFile) return

    setShowModal(false)
    setIsLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', pendingFile)

      const response = await fetch('/api/parse', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to parse resume')
      }

      const data: ParsedResume = await response.json()
      setUploadedFiles([...uploadedFiles, pendingFile])
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
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index))
    if (uploadedFiles.length - 1 === 0) {
      setParsedData(null)
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-8 max-w-md mx-4 border border-gray-800">
            <h3 className="text-lg font-semibold text-white mb-3">Before you upload</h3>
            <p className="text-gray-400 mb-6">
              For best results, upload a digitally generated PDF or DOCX file. Scanned documents or photos of CVs may produce incomplete results.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                className="flex-1 px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={handleContinueUpload}
                className="flex-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition"
              >
                Got it, continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Area */}
      {!parsedData && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition ${
            isDragging
              ? 'border-blue-500 bg-blue-500/10'
              : 'border-gray-700 hover:border-gray-600 bg-gray-900/50 hover:bg-gray-900'
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
              <Loader2 className="w-12 h-12 text-blue-500 mx-auto mb-3 animate-spin" />
              <p className="text-gray-400">Parsing your resume...</p>
            </>
          ) : (
            <>
              <Upload className="w-12 h-12 text-gray-500 mx-auto mb-3" />
              <p className="text-white font-medium mb-1">Drag and drop your CV here</p>
              <p className="text-gray-400 text-sm mb-3">or click to browse</p>
              <p className="text-gray-500 text-xs">
                PDF or DOCX • Max 5MB • {uploadedFiles.length}/{maxFiles} files uploaded
              </p>
            </>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-4 rounded-lg bg-red-900/20 border border-red-800 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="mt-6 space-y-2">
          <p className="text-sm font-medium text-gray-400 mb-3">Uploaded files ({uploadedFiles.length}/{maxFiles})</p>
          {uploadedFiles.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-900/50 border border-gray-800">
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                <span className="text-sm text-gray-300 truncate">{file.name}</span>
              </div>
              <button
                onClick={() => handleRemoveFile(index)}
                className="text-gray-500 hover:text-red-500 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          {uploadedFiles.length < maxFiles && (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="w-full mt-4 px-4 py-2 rounded-lg border border-dashed border-gray-700 hover:border-gray-600 text-gray-400 hover:text-gray-300 transition disabled:opacity-50"
            >
              + Add another file
            </button>
          )}
        </div>
      )}

      {/* Parsed Data Display */}
      {parsedData && (
        <div className="mt-8 space-y-6">
          {/* Header */}
          <div className="flex items-start gap-4">
            <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0 mt-1" />
            <div>
              <h3 className="text-xl font-semibold text-white">{parsedData.full_name || 'Resume'}</h3>
              <p className="text-gray-400 text-sm">Successfully parsed</p>
            </div>
          </div>

          {/* Personal Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {parsedData.email && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Email</p>
                <p className="text-white">{parsedData.email}</p>
              </div>
            )}
            {parsedData.phone && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Phone</p>
                <p className="text-white">{parsedData.phone}</p>
              </div>
            )}
            {parsedData.location && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Location</p>
                <p className="text-white">{parsedData.location}</p>
              </div>
            )}
          </div>

          {/* Summary */}
          {parsedData.summary && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Professional Summary</p>
              <p className="text-gray-300 text-sm leading-relaxed">{parsedData.summary}</p>
            </div>
          )}

          {/* Skills */}
          {parsedData.skills.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Skills</p>
              <div className="flex flex-wrap gap-2">
                {parsedData.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 rounded-full bg-blue-900/30 border border-blue-800 text-blue-300 text-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Work Experience */}
          {parsedData.work_experience.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Work Experience</p>
              <div className="space-y-4">
                {parsedData.work_experience.map((exp, index) => (
                  <div key={index} className="p-4 rounded-lg bg-gray-900/50 border border-gray-800">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-white">{exp.role}</p>
                        <p className="text-sm text-gray-400">{exp.company}</p>
                      </div>
                      {(exp.start_date || exp.end_date) && (
                        <p className="text-xs text-gray-500">
                          {exp.start_date && exp.start_date} {exp.end_date && `— ${exp.end_date}`}
                        </p>
                      )}
                    </div>
                    {exp.description && <p className="text-sm text-gray-300 mt-2">{exp.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {parsedData.education.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Education</p>
              <div className="space-y-3">
                {parsedData.education.map((edu, index) => (
                  <div key={index} className="p-3 rounded-lg bg-gray-900/50 border border-gray-800">
                    <p className="font-medium text-white">{edu.degree}</p>
                    <p className="text-sm text-gray-400">{edu.institution}</p>
                    {edu.field && <p className="text-sm text-gray-500">{edu.field}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Languages */}
          {parsedData.languages.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Languages</p>
              <div className="flex flex-wrap gap-2">
                {parsedData.languages.map((lang, index) => (
                  <span key={index} className="text-sm text-gray-300">
                    {lang.language} <span className="text-gray-500">({lang.level})</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Certifications */}
          {parsedData.certifications.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Certifications</p>
              <ul className="space-y-1">
                {parsedData.certifications.map((cert, index) => (
                  <li key={index} className="text-sm text-gray-300">
                    • {cert}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Upload Another Button */}
          <button
            onClick={() => {
              setUploadedFiles([])
              setParsedData(null)
              setError(null)
            }}
            className="w-full mt-6 px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-medium transition"
          >
            Upload Another CV
          </button>
        </div>
      )}
    </div>
  )
}
