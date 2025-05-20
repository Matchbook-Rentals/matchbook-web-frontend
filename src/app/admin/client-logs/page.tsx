'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { fetchClientLogs, deleteClientLog, type ClientLog } from './_actions'

const PAGE_SIZE = 20

export default function ClientLogsPage() {
  const [logs, setLogs] = useState<ClientLog[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null)
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null)

  // Load logs on mount and when filters/pagination change
  useEffect(() => {
    const loadLogs = async () => {
      setIsLoading(true)
      try {
        const result = await fetchClientLogs({
          page: currentPage,
          pageSize: PAGE_SIZE,
          level: selectedLevel,
          device: selectedDevice,
        })
        setLogs(result.logs)
        setTotalPages(result.totalPages)
      } catch (error) {
        console.error('Failed to load logs:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadLogs()
  }, [currentPage, selectedLevel, selectedDevice])

  const handleLevelFilter = (level: string | null) => {
    setSelectedLevel(level)
    setCurrentPage(1)
  }

  const handleDeviceFilter = (device: string | null) => {
    setSelectedDevice(device)
    setCurrentPage(1)
  }

  const handleDeleteLog = async (id: string) => {
    try {
      await deleteClientLog(id)
      setLogs(logs.filter(log => log.id !== id))
    } catch (error) {
      console.error('Failed to delete log:', error)
    }
  }

  // Format date in a readable way
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString()
  }

  // Format JSON data for display
  const formatData = (data: string | null) => {
    if (!data) return 'N/A'
    try {
      const parsed = JSON.parse(data)
      return JSON.stringify(parsed, null, 2)
    } catch {
      return data
    }
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Client Logs</h1>
      
      <div className="flex flex-wrap gap-2 mb-6">
        <div>
          <span className="font-medium mr-2">Level:</span>
          <Button 
            variant={selectedLevel === null ? "default" : "outline"} 
            size="sm" 
            onClick={() => handleLevelFilter(null)}
            className="mr-1"
          >
            All
          </Button>
          <Button 
            variant={selectedLevel === 'debug' ? "default" : "outline"} 
            size="sm" 
            onClick={() => handleLevelFilter('debug')}
            className="mr-1"
          >
            Debug
          </Button>
          <Button 
            variant={selectedLevel === 'info' ? "default" : "outline"} 
            size="sm" 
            onClick={() => handleLevelFilter('info')}
            className="mr-1"
          >
            Info
          </Button>
          <Button 
            variant={selectedLevel === 'warn' ? "default" : "outline"} 
            size="sm" 
            onClick={() => handleLevelFilter('warn')}
            className="mr-1"
          >
            Warn
          </Button>
          <Button 
            variant={selectedLevel === 'error' ? "default" : "outline"} 
            size="sm" 
            onClick={() => handleLevelFilter('error')}
          >
            Error
          </Button>
        </div>
        
        <div className="ml-auto">
          <span className="font-medium mr-2">Device:</span>
          <Button 
            variant={selectedDevice === null ? "default" : "outline"} 
            size="sm" 
            onClick={() => handleDeviceFilter(null)}
            className="mr-1"
          >
            All
          </Button>
          <Button 
            variant={selectedDevice === 'ios' ? "default" : "outline"} 
            size="sm" 
            onClick={() => handleDeviceFilter('ios')}
            className="mr-1"
          >
            iOS
          </Button>
          <Button 
            variant={selectedDevice === 'android' ? "default" : "outline"} 
            size="sm" 
            onClick={() => handleDeviceFilter('android')}
            className="mr-1"
          >
            Android
          </Button>
          <Button 
            variant={selectedDevice === 'web' ? "default" : "outline"} 
            size="sm" 
            onClick={() => handleDeviceFilter('web')}
          >
            Web
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center my-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <>
          {logs.length === 0 ? (
            <Card className="p-6 text-center">
              <p>No logs found matching the selected filters.</p>
            </Card>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-40">Timestamp</TableHead>
                    <TableHead className="w-24">Level</TableHead>
                    <TableHead className="w-24">Device</TableHead>
                    <TableHead className="w-64">Message</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="w-32">User</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-sm">{formatDate(log.createdAt)}</TableCell>
                      <TableCell>
                        <span 
                          className={`
                            px-2 py-1 rounded text-xs font-medium
                            ${log.level === 'debug' ? 'bg-gray-200 text-gray-800' : ''}
                            ${log.level === 'info' ? 'bg-blue-200 text-blue-800' : ''}
                            ${log.level === 'warn' ? 'bg-yellow-200 text-yellow-800' : ''}
                            ${log.level === 'error' ? 'bg-red-200 text-red-800' : ''}
                          `}
                        >
                          {log.level}
                        </span>
                      </TableCell>
                      <TableCell>{log.device || 'N/A'}</TableCell>
                      <TableCell>{log.message}</TableCell>
                      <TableCell>
                        {log.data ? (
                          <details>
                            <summary>View Data</summary>
                            <pre className="text-xs mt-2 p-2 bg-gray-100 rounded overflow-auto max-h-48">
                              {formatData(log.data)}
                            </pre>
                          </details>
                        ) : 'N/A'}
                      </TableCell>
                      <TableCell>{log.userId ? log.userId.substring(0, 8) + '...' : 'Anonymous'}</TableCell>
                      <TableCell>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => handleDeleteLog(log.id)}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="flex justify-between mt-6">
            <Button 
              variant="outline" 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="py-2">
              Page {currentPage} of {totalPages}
            </span>
            <Button 
              variant="outline" 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </>
      )}
    </div>
  )
}