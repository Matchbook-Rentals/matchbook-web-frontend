'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { logger } from '@/lib/logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  executeSqlQuery, 
  getModelData, 
  getRecordById, 
  getRelatedRecords,
  getModelRelationships 
} from './_actions'
import { 
  Loader2, 
  RefreshCw, 
  Eye, 
  ArrowLeft, 
  ArrowRight, 
  Database, 
  ChevronRight, 
  BookOpen,
  Table2
} from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { Field, Model, Relation } from './schema-definition'

interface ExtendedModel extends Model {
  recordCount?: number;
  countError?: string;
}

interface SqlEditorClientProps {
  models: ExtendedModel[];
}

export default function SqlEditorClient({ models }: SqlEditorClientProps) {
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Get query params
  const modelName = searchParams.get('model')
  const recordId = searchParams.get('id')
  const relationField = searchParams.get('relationField')
  const parentId = searchParams.get('parentId')
  const pageParam = searchParams.get('page')
  const currentPage = pageParam ? parseInt(pageParam) : 1

  // State for SQL query tab
  const [sqlQuery, setSqlQuery] = useState<string>('SELECT * FROM User LIMIT 10')
  const [isExecuting, setIsExecuting] = useState(false)
  const [queryResults, setQueryResults] = useState<any[] | null>(null)
  const [queryError, setQueryError] = useState<string | null>(null)
  const [queryColumns, setQueryColumns] = useState<string[]>([])
  
  // State for model browser tab
  const [activeModel, setActiveModel] = useState<string | null>(modelName)
  const [modelData, setModelData] = useState<any[] | null>(null)
  const [modelDataError, setModelDataError] = useState<string | null>(null)
  const [modelDataLoading, setModelDataLoading] = useState(false)
  const [modelColumns, setModelColumns] = useState<string[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [modelRelations, setModelRelations] = useState<{model: Model, relation: Relation}[]>([])
  
  // State for record detail view
  const [recordDetail, setRecordDetail] = useState<any | null>(null)
  const [recordSchema, setRecordSchema] = useState<any | null>(null)
  const [recordDetailLoading, setRecordDetailLoading] = useState(false)
  const [recordDetailError, setRecordDetailError] = useState<string | null>(null)

  // Get the currently active model definition
  const currentModelDef = models.find(m => m.name === activeModel)
  
  // Determine if we are viewing a record, a model, or related records
  const viewMode = recordId 
    ? 'record' 
    : (relationField && parentId) 
      ? 'related' 
      : activeModel 
        ? 'model' 
        : null

  // Function to format values for display
  const formatValue = (value: any, fieldDef?: Field) => {
    if (value === null || value === undefined) return <span className="text-gray-400">null</span>
    
    if (fieldDef?.isEnum) {
      return <Badge variant="outline">{value}</Badge>
    }
    
    if (typeof value === 'boolean') {
      return value ? (
        <Badge variant="success">true</Badge>
      ) : (
        <Badge variant="destructive">false</Badge>
      )
    }
    
    if (value instanceof Date) {
      return value.toISOString()
    }
    
    if (typeof value === 'object') {
      return (
        <code className="text-xs bg-gray-100 p-1 rounded">
          {JSON.stringify(value)}
        </code>
      )
    }
    
    return String(value)
  }

  // Function to handle SQL query execution
  const handleExecuteQuery = async () => {
    setIsExecuting(true)
    setQueryError(null)
    
    try {
      const result = await executeSqlQuery(sqlQuery)
      
      if (result.success) {
        setQueryResults(result.data)
        // Extract column names from the first result
        if (result.data && result.data.length > 0) {
          setQueryColumns(Object.keys(result.data[0]))
        } else {
          setQueryColumns([])
        }
        toast({
          title: "Query executed successfully",
          description: `${result.count} rows returned`,
        })
      } else {
        setQueryError(result.error)
        toast({
          variant: "destructive",
          title: "Query failed",
          description: result.error,
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      setQueryError(errorMessage)
      toast({
        variant: "destructive",
        title: "Query failed",
        description: errorMessage,
      })
    } finally {
      setIsExecuting(false)
    }
  }

  // Function to load model data
  const loadModelData = useCallback(async (model: string, page = 1) => {
    setModelDataLoading(true)
    setModelDataError(null)
    
    try {
      // Extract filter parameters from URL 
      const filterParams: Record<string, string> = {}
      searchParams.forEach((value, key) => {
        if (key !== 'model' && key !== 'page' && key !== 'id' && key !== 'relationField' && key !== 'parentId') {
          filterParams[key] = value
        }
      })

      let result
      
      if (relationField && parentId) {
        // Loading related records
        result = await getRelatedRecords(model, relationField, parentId, page, 10)
      } else {
        // Loading model data with optional filters
        result = await getModelData(model, page, 10, filterParams)
      }
      
      if (result.success) {
        setModelData(result.data)
        setTotalPages(result.totalPages)
        setTotalCount(result.totalCount)
        
        // Extract column names (fields) from the first result
        if (result.data && result.data.length > 0) {
          setModelColumns(Object.keys(result.data[0]))
        } else if (currentModelDef) {
          // If no data but we have model definitions, use field names
          setModelColumns(currentModelDef.fields.map(f => f.name))
        } else {
          setModelColumns([])
        }
        
        // Also load model relationships
        loadModelRelationships(model)
      } else {
        setModelDataError(result.error)
        toast({
          variant: "destructive",
          title: "Failed to load data",
          description: result.error,
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      setModelDataError(errorMessage)
      toast({
        variant: "destructive",
        title: "Failed to load data",
        description: errorMessage,
      })
    } finally {
      setModelDataLoading(false)
    }
  }, [relationField, parentId, searchParams, toast, currentModelDef])

  // Function to load model relationships
  const loadModelRelationships = useCallback(async (model: string) => {
    try {
      const result = await getModelRelationships(model)
      
      if (result.success) {
        setModelRelations(result.data || [])
      }
    } catch (error) {
      logger.error('Error loading model relationships', error);
    }
  }, [])

  // Function to load record details
  const loadRecordDetail = useCallback(async (model: string, id: string) => {
    setRecordDetailLoading(true)
    setRecordDetailError(null)
    
    try {
      const result = await getRecordById(model, id)
      
      if (result.success) {
        setRecordDetail(result.data)
        if (result.schema) {
          setRecordSchema(result.schema)
        }
      } else {
        setRecordDetailError(result.error)
        toast({
          variant: "destructive",
          title: "Failed to load record",
          description: result.error,
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      setRecordDetailError(errorMessage)
      toast({
        variant: "destructive",
        title: "Failed to load record",
        description: errorMessage,
      })
    } finally {
      setRecordDetailLoading(false)
    }
  }, [toast])

  // Load data when parameters change
  useEffect(() => {
    if (modelName) {
      setActiveModel(modelName)
      
      if (recordId) {
        // Load single record
        loadRecordDetail(modelName, recordId)
      } else {
        // Load model data (possibly filtered by relation)
        loadModelData(modelName, currentPage)
      }
    }
  }, [modelName, recordId, relationField, parentId, currentPage, loadModelData, loadRecordDetail])

  // Handle model selection change
  const handleModelChange = (model: string) => {
    // Clear existing data
    setModelData(null)
    setModelDataError(null)
    setRecordDetail(null)
    setRecordDetailError(null)
    setRecordSchema(null)
    
    // Update the URL to navigate to the selected model
    router.push(`/admin/sql-editor?model=${model}`)
  }

  // Handle pagination
  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', page.toString())
    router.push(`/admin/sql-editor?${params.toString()}`)
  }

  // Generate example SQL for a model
  const generateExampleSql = (model: string) => {
    setSqlQuery(`SELECT * FROM \`${model}\` LIMIT 10`)
  }
  
  // Generate navigation links for pagination
  const renderPagination = () => {
    return (
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-gray-500">
          {totalCount > 0 ? (
            <>Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, totalCount)} of {totalCount} records</>
          ) : (
            <>No records found</>
          )}
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Previous
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
          >
            Next <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    )
  }

  // Render field value with possible links for relations
  const renderFieldValue = (row: any, column: string) => {
    if (!currentModelDef) return formatValue(row[column])
    
    // Find the field definition
    const fieldDef = currentModelDef.fields.find(f => f.name === column)
    
    if (!fieldDef) return formatValue(row[column])
    
    // Handle different field types 
    if (fieldDef.isId && row[column]) {
      // Primary key field - make it a link to the record
      return (
        <Link 
          href={`/admin/sql-editor?model=${activeModel}&id=${row[column]}`}
          className="text-blue-600 hover:underline"
        >
          {row[column]}
        </Link>
      )
    }
    
    // Get relation for this field if it exists
    const relation = currentModelDef.relations.find(r => r.foreignKey === column)
    
    // If this is a foreign key with a relation
    if (relation && row[column]) {
      // Foreign key - link to the related record
      return (
        <Link 
          href={`/admin/sql-editor?model=${relation.model}&id=${row[column]}`}
          className="text-blue-600 hover:underline"
        >
          {row[column]}
        </Link>
      )
    }
    
    // Regular field
    return formatValue(row[column], fieldDef)
  }

  // Render the models sidebar
  const renderModelSidebar = () => (
    <div className="w-full md:w-64 flex-none">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <Database className="h-4 w-4 mr-2" /> Database Models
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2">
          <ScrollArea className="h-[calc(100vh-250px)]">
            <div className="space-y-1 p-2">
              {models
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((model) => (
                <div key={model.name} className="w-full">
                  <Button
                    variant={activeModel === model.name ? "secondary" : "ghost"}
                    className="w-full justify-start font-normal"
                    onClick={() => handleModelChange(model.name)}
                  >
                    <span className="truncate flex-1 text-left">{model.name}</span>
                    {typeof model.recordCount === 'number' && (
                      <Badge variant="outline" className="ml-2">{model.recordCount}</Badge>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
  
  // Render the SQL Editor tab
  const renderSqlEditorTab = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <BookOpen className="h-4 w-4 mr-2" /> SQL Query Editor
          </CardTitle>
          <CardDescription>
            Execute custom SQL queries against your database (SELECT only)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <Textarea
              value={sqlQuery}
              onChange={(e) => setSqlQuery(e.target.value)}
              placeholder="Enter SQL query..."
              className="min-h-[120px] font-mono"
            />
            <div className="flex justify-between">
              <div className="space-x-2">
                {activeModel && (
                  <Button 
                    variant="outline" 
                    onClick={() => generateExampleSql(activeModel)}
                    size="sm"
                  >
                    Example for {activeModel}
                  </Button>
                )}
              </div>
              <Button 
                onClick={handleExecuteQuery} 
                disabled={isExecuting}
              >
                {isExecuting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Executing...
                  </>
                ) : (
                  <>Execute Query</>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {queryError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p className="font-bold">Error:</p>
          <p>{queryError}</p>
        </div>
      )}

      {queryResults && queryResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Query Results ({queryResults.length} rows)</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    {queryColumns.map((column) => (
                      <TableHead key={column}>{column}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {queryResults.map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {queryColumns.map((column) => (
                        <TableCell key={column}>{formatValue(row[column])}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
      
      {queryResults && queryResults.length === 0 && (
        <Card>
          <CardContent className="py-4">
            <p className="text-center text-gray-500">No results found</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
  
  // Render the Model Browser tab
  const renderModelBrowserTab = () => (
    <div className="space-y-4">
      {/* Breadcrumb navigation */}
      <div className="flex items-center space-x-2 text-sm">
        <Link href="/admin/sql-editor" className="text-blue-600 hover:underline flex items-center">
          <Database className="h-3 w-3 mr-1" /> Models
        </Link>
        
        {activeModel && (
          <>
            <ChevronRight className="h-3 w-3" />
            {recordId || (relationField && parentId) ? (
              <Link 
                href={`/admin/sql-editor?model=${activeModel}`} 
                className="text-blue-600 hover:underline"
              >
                {activeModel}
              </Link>
            ) : (
              <span>{activeModel}</span>
            )}
          </>
        )}
        
        {activeModel && relationField && parentId && (
          <>
            <ChevronRight className="h-3 w-3" />
            <span>
              {relationField}={parentId}
            </span>
          </>
        )}
        
        {activeModel && recordId && (
          <>
            <ChevronRight className="h-3 w-3" />
            <span>{recordId}</span>
          </>
        )}
      </div>
      
      {/* Display different content based on view mode */}
      {viewMode === 'record' && recordId && activeModel && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center justify-between">
              <span className="flex items-center">
                <Table2 className="h-4 w-4 mr-2" /> {activeModel} Record
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => loadRecordDetail(activeModel, recordId)}
                disabled={recordDetailLoading}
              >
                <RefreshCw className={`h-4 w-4 ${recordDetailLoading ? 'animate-spin' : ''}`} />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recordDetailLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : recordDetailError ? (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                <p>{recordDetailError}</p>
              </div>
            ) : recordDetail ? (
              <div className="space-y-4">
                {/* Record details */}
                <div className="space-y-2">
                  {Object.entries(recordDetail).map(([key, value]) => {
                    // Find field definition
                    const field = currentModelDef?.fields.find(f => f.name === key);
                    const relation = currentModelDef?.relations.find(r => 
                      r.foreignKey === key || r.name === key
                    );
                    
                    // Skip complex objects that are relations
                    if (typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Date)) {
                      return null;
                    }
                    
                    return (
                      <div key={key} className="grid grid-cols-3 gap-4 py-2 border-b border-gray-100">
                        <div className="font-medium flex items-center">
                          {key}
                          {field?.isId && <Badge className="ml-2" variant="outline">ID</Badge>}
                          {relation && <Badge className="ml-2" variant="outline">FK</Badge>}
                        </div>
                        <div className="col-span-2">{renderFieldValue(recordDetail, key)}</div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Show related records links */}
                {recordSchema?.relations?.length > 0 && (
                  <div className="pt-4">
                    <h3 className="text-md font-semibold mb-2">Related Records</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {recordSchema.relations.map(({model, relation}: {model: Model, relation: Relation}) => (
                        <Link
                          key={relation.name}
                          href={`/admin/sql-editor?model=${relation.model}&relationField=${relation.foreignKey}&parentId=${recordDetail.id}`}
                          className="flex items-center p-2 hover:bg-gray-100 rounded"
                        >
                          <div className="flex-1">
                            <span className="text-blue-600 hover:underline">{relation.model}</span>
                            <span className="text-gray-500 text-xs block">via {relation.foreignKey}</span>
                          </div>
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-center text-gray-500">No record found</p>
            )}
          </CardContent>
        </Card>
      )}
      
      {(viewMode === 'model' || viewMode === 'related') && activeModel && (
        <>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                <span className="flex items-center">
                  <Table2 className="h-4 w-4 mr-2" /> {activeModel} Data
                </span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => loadModelData(activeModel, currentPage)}
                  disabled={modelDataLoading}
                >
                  <RefreshCw className={`h-4 w-4 ${modelDataLoading ? 'animate-spin' : ''}`} />
                </Button>
              </CardTitle>
              {relationField && parentId && (
                <div className="text-sm text-gray-500">
                  Filtered by {relationField} = {parentId}
                </div>
              )}
            </CardHeader>
            <CardContent>
              {modelDataLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : modelDataError ? (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  <p>{modelDataError}</p>
                </div>
              ) : modelData && modelData.length > 0 ? (
                <ScrollArea className="h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">View</TableHead>
                        {modelColumns.map((column) => {
                          const field = currentModelDef?.fields.find(f => f.name === column);
                          const relation = currentModelDef?.relations.find(r => r.foreignKey === column);
                          
                          return (
                            <TableHead key={column}>
                              <div className="flex items-center">
                                {column}
                                {field?.isId && <Badge className="ml-1 text-xs" variant="outline">ID</Badge>}
                                {relation && <Badge className="ml-1 text-xs" variant="outline">FK</Badge>}
                              </div>
                            </TableHead>
                          );
                        })}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {modelData.map((row, rowIndex) => (
                        <TableRow key={rowIndex}>
                          <TableCell>
                            {row.id && (
                              <Link 
                                href={`/admin/sql-editor?model=${activeModel}&id=${row.id}`}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <Eye className="h-4 w-4" />
                              </Link>
                            )}
                          </TableCell>
                          {modelColumns.map((column) => (
                            <TableCell key={column}>
                              {renderFieldValue(row, column)}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              ) : (
                <p className="text-center text-gray-500 py-8">No data found</p>
              )}
            </CardContent>
          </Card>
          
          {/* Pagination controls */}
          {modelData && modelData.length > 0 && renderPagination()}
        </>
      )}
      
      {!activeModel && (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-gray-500">
              Select a model from the sidebar to explore its data
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )

  return (
    <div className="flex flex-col md:flex-row gap-4">
      {renderModelSidebar()}
      
      <div className="flex-1">
        <Tabs defaultValue="browser">
          <TabsList className="mb-4">
            <TabsTrigger value="browser">Model Browser</TabsTrigger>
            <TabsTrigger value="sql">SQL Query Editor</TabsTrigger>
          </TabsList>
          
          <TabsContent value="browser">
            {renderModelBrowserTab()}
          </TabsContent>
          
          <TabsContent value="sql">
            {renderSqlEditorTab()}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}