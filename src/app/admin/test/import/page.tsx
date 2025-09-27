'use client'

import { useState, useCallback, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from '@/components/ui/button'
import { Badge } from "@/components/ui/badge"
import { Upload, FileText, AlertCircle, CheckCircle, Loader2, Database, Image, Trash2 } from 'lucide-react'
import { importListings, validateImportFile, getImportStats } from './_actions'

interface ValidationResult {
  isValid: boolean
  listingCount: number
  exportDate: string
  issues: string[]
}

interface ImportStats {
  currentImportedListings: number
  currentImportedImages: number
}

export default function ImportListingsPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileContent, setFileContent] = useState<string>('')
  const [validation, setValidation] = useState<ValidationResult | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importStatus, setImportStatus] = useState<{
    type: 'success' | 'error' | null
    message: string
    details?: any
  }>({ type: null, message: '' })
  const [stats, setStats] = useState<ImportStats | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const result = await getImportStats()
      if (result.success && result.data) {
        setStats(result.data)
      }
    } catch (error) {
      console.error('Failed to load import stats:', error)
    }
  }

  const handleFileSelect = useCallback(async (file: File) => {
    if (!file.name.endsWith('.json')) {
      setImportStatus({
        type: 'error',
        message: 'Please select a JSON file'
      })
      return
    }

    setSelectedFile(file)
    setValidation(null)
    setImportStatus({ type: null, message: '' })

    // Read file content
    try {
      const content = await file.text()
      setFileContent(content)

      // Validate file
      setIsValidating(true)
      const validationResult = await validateImportFile(content)

      if (validationResult.success && validationResult.data) {
        setValidation(validationResult.data)
        if (!validationResult.data.isValid) {
          setImportStatus({
            type: 'error',
            message: 'File validation failed. Please check the issues below.'
          })
        }
      } else {
        setImportStatus({
          type: 'error',
          message: validationResult.error || 'File validation failed'
        })
      }
    } catch (error) {
      setImportStatus({
        type: 'error',
        message: `Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
    } finally {
      setIsValidating(false)
    }
  }, [])

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    setIsDragOver(false)

    const file = event.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }, [handleFileSelect])

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleImport = async () => {
    if (!fileContent || !validation?.isValid) return

    setIsImporting(true)
    setImportStatus({ type: null, message: '' })

    try {
      const importData = JSON.parse(fileContent)
      const result = await importListings(importData)

      if (result.success && result.data) {
        setImportStatus({
          type: 'success',
          message: `Import completed successfully`,
          details: result.data
        })
        // Refresh stats
        await loadStats()
      } else {
        setImportStatus({
          type: 'error',
          message: result.error || 'Import failed'
        })
      }
    } catch (error) {
      setImportStatus({
        type: 'error',
        message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
    } finally {
      setIsImporting(false)
    }
  }

  const clearFile = () => {
    setSelectedFile(null)
    setFileContent('')
    setValidation(null)
    setImportStatus({ type: null, message: '' })
  }

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Import Listings</h1>
        <p className="text-muted-foreground">
          Import listings from a JSON export file. All listings will be assigned to you and marked as test data pending approval.
        </p>
      </div>

      {/* Current Import Stats */}
      {stats && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Your Current Imported Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Database className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.currentImportedListings}</div>
                  <div className="text-sm text-muted-foreground">Imported Listings</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <Image className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.currentImportedImages}</div>
                  <div className="text-sm text-muted-foreground">Imported Images</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* File Upload */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Select Import File</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragOver
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-300 dark:border-gray-600'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            {selectedFile ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-3">
                  <FileText className="h-8 w-8 text-blue-600" />
                  <div>
                    <div className="font-medium">{selectedFile.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </div>
                </div>
                <Button variant="outline" onClick={clearFile} size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove File
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                <div>
                  <div className="text-lg font-medium">Drop your JSON file here</div>
                  <div className="text-sm text-muted-foreground">or click to browse</div>
                </div>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <Button asChild variant="outline">
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="h-4 w-4 mr-2" />
                    Choose File
                  </label>
                </Button>
              </div>
            )}
          </div>

          {/* Validation Status */}
          {isValidating && (
            <div className="mt-4 flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Validating file...
            </div>
          )}

          {validation && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  {validation.isValid ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  )}
                  File Validation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant={validation.isValid ? "default" : "destructive"}>
                      {validation.isValid ? "Valid" : "Invalid"}
                    </Badge>
                    <span className="text-sm">
                      {validation.listingCount} listings found
                    </span>
                  </div>

                  {validation.exportDate && (
                    <div className="text-sm text-muted-foreground">
                      Exported: {new Date(validation.exportDate).toLocaleString()}
                    </div>
                  )}

                  {validation.issues.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-red-600 dark:text-red-400">
                        Issues found:
                      </div>
                      <ul className="text-sm text-red-600 dark:text-red-400 space-y-1">
                        {validation.issues.map((issue, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span>•</span>
                            <span>{issue}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Import Action */}
      <Card>
        <CardHeader>
          <CardTitle>Import Listings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button
              onClick={handleImport}
              disabled={!validation?.isValid || isImporting}
              size="lg"
              className="w-full"
            >
              {isImporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importing Listings...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Import {validation?.listingCount || 0} Listings
                </>
              )}
            </Button>

            {/* Status Messages */}
            {importStatus.type && (
              <div className={`p-4 rounded-lg border ${
                importStatus.type === 'success'
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              }`}>
                <div className="flex items-start gap-2">
                  {importStatus.type === 'success' ? (
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-500 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-500 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div className={`font-medium ${
                      importStatus.type === 'success'
                        ? 'text-green-800 dark:text-green-200'
                        : 'text-red-800 dark:text-red-200'
                    }`}>
                      {importStatus.message}
                    </div>

                    {/* Import Details */}
                    {importStatus.details && (
                      <div className="mt-3 space-y-2">
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <div className="font-medium">Imported</div>
                            <div className="text-green-600 dark:text-green-400">
                              {importStatus.details.importedCount}
                            </div>
                          </div>
                          <div>
                            <div className="font-medium">Skipped</div>
                            <div className="text-yellow-600 dark:text-yellow-400">
                              {importStatus.details.skippedCount}
                            </div>
                          </div>
                          <div>
                            <div className="font-medium">Errors</div>
                            <div className="text-red-600 dark:text-red-400">
                              {importStatus.details.errorCount}
                            </div>
                          </div>
                        </div>

                        {importStatus.details.errors?.length > 0 && (
                          <div className="mt-3">
                            <div className="font-medium mb-2">Errors:</div>
                            <ul className="text-sm space-y-1 max-h-40 overflow-y-auto">
                              {importStatus.details.errors.map((error: string, index: number) => (
                                <li key={index} className="flex items-start gap-2">
                                  <span>•</span>
                                  <span>{error}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-500 mt-0.5" />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Note:</strong> All imported listings will be assigned to you, marked as test listings,
                  and require approval before becoming visible to users. Original owner information will not be preserved.
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}