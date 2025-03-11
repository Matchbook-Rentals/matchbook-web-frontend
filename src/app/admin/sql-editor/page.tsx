import { checkRole } from '@/utils/roles'
import { redirect } from 'next/navigation'
import { getAllModels, getModelCounts } from './_actions'
import SqlEditorClient from './sql-editor-client'

export default async function SqlEditorPage() {
  if (!checkRole('admin')) {
    redirect('/unauthorized')
  }

  // Get all models and their schema info
  const [modelsResponse, modelCountsResponse] = await Promise.all([
    getAllModels(),
    getModelCounts()
  ]);
  
  if (!modelsResponse.success) {
    return (
      <div className="container mx-auto py-10">
        <h1 className="text-2xl font-bold mb-4">Database Explorer</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>Error loading database schema: {modelsResponse.error}</p>
        </div>
      </div>
    )
  }

  // Combine model definitions with their record counts
  const modelsWithCounts = modelsResponse.data.map(model => {
    const countInfo = modelCountsResponse.success 
      ? modelCountsResponse.data.find(m => m.modelName === model.name) 
      : null;
      
    return {
      ...model,
      recordCount: countInfo?.count || 0,
      countError: countInfo?.error
    };
  });

  return (
    <div className="container mx-auto py-4">
      <h1 className="text-2xl font-bold mb-4">Database Explorer</h1>
      <SqlEditorClient models={modelsWithCounts} />
    </div>
  )
}