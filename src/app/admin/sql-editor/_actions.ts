'use server'

import { checkRole } from '@/utils/roles'
import prisma from '@/lib/prismadb'
import { revalidatePath } from 'next/cache'
import { Prisma } from '@prisma/client'
import { 
  schema, 
  getModelByName, 
  getRelatedModels, 
  modelNames,
  Model,
  Relation
} from './schema-definition'

// Function to execute a provided SQL query
export async function executeSqlQuery(query: string) {
  if (!checkRole('admin')) {
    throw new Error('Unauthorized')
  }

  try {
    // Security: Prevent destructive queries
    const lowercaseQuery = query.toLowerCase().trim()
    
    // Only allow SELECT queries
    if (!lowercaseQuery.startsWith('select')) {
      return {
        success: false,
        error: 'Only SELECT queries are allowed for security reasons.'
      }
    }

    if (lowercaseQuery.includes(';') || 
        lowercaseQuery.includes('--') || 
        lowercaseQuery.includes('/*') ||
        lowercaseQuery.includes('*/') ||
        lowercaseQuery.includes('union') ||
        lowercaseQuery.includes('drop') ||
        lowercaseQuery.includes('alter') ||
        lowercaseQuery.includes('truncate')) {
      return {
        success: false,
        error: 'Potentially unsafe SQL query detected. Please remove any semicolons, comments, or unsafe keywords.'
      }
    }
    
    const result = await prisma.$queryRawUnsafe(query)
    
    return {
      success: true,
      data: result,
      count: Array.isArray(result) ? result.length : 0
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return {
      success: false,
      error: errorMessage
    }
  }
}

// Get all models with their fields and relationships
export async function getAllModels() {
  if (!checkRole('admin')) {
    throw new Error('Unauthorized')
  }

  try {
    return {
      success: true,
      data: schema.models
    }
  } catch (error) {
    console.error('Error fetching models:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return {
      success: false,
      error: errorMessage
    }
  }
}

// Get the definition for a specific model
export async function getModelDefinition(modelName: string) {
  if (!checkRole('admin')) {
    throw new Error('Unauthorized')
  }

  try {
    const modelDef = getModelByName(modelName);
    
    if (!modelDef) {
      return {
        success: false,
        error: `Model '${modelName}' definition not found`
      }
    }

    return {
      success: true,
      data: modelDef
    }
  } catch (error) {
    console.error('Error fetching model definition:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return {
      success: false,
      error: errorMessage
    }
  }
}

// Get a specific model's data with pagination
export async function getModelData(modelName: string, page = 1, pageSize = 10, filters: Record<string, any> = {}) {
  if (!checkRole('admin')) {
    throw new Error('Unauthorized')
  }

  try {
    // Check if the model exists in our schema
    const modelDef = getModelByName(modelName);
    if (!modelDef) {
      return {
        success: false, 
        error: `Model '${modelName}' does not exist`
      }
    }

    // Check if the model exists in Prisma
    if (!(modelName in prisma)) {
      return {
        success: false, 
        error: `Model '${modelName}' not found in Prisma client`
      }
    }

    // Calculate pagination parameters
    const skip = (page - 1) * pageSize
    
    // Convert filter values to appropriate types
    const processedFilters: Record<string, any> = {}
    Object.entries(filters).forEach(([key, value]) => {
      const field = modelDef.fields.find(f => f.name === key);
      
      if (!field) return;
      
      // Convert value based on field type
      if (field.type === 'Boolean' && (value === 'true' || value === 'false')) {
        processedFilters[key] = value === 'true';
      } else if ((field.type === 'Int' || field.type === 'Float') && !isNaN(Number(value)) && value !== '') {
        processedFilters[key] = field.type === 'Int' ? parseInt(value as string) : parseFloat(value as string);
      } else if (field.type === 'DateTime' && value !== '') {
        try {
          processedFilters[key] = new Date(value as string);
        } catch (e) {
          // Skip if invalid date
        }
      } else {
        processedFilters[key] = value;
      }
    });

    // Fetch data with pagination
    const data = await (prisma[modelName as keyof typeof prisma] as any).findMany({
      where: processedFilters,
      skip,
      take: pageSize,
    })

    // Get total count for pagination
    const totalCount = await (prisma[modelName as keyof typeof prisma] as any).count({
      where: processedFilters,
    })

    return {
      success: true,
      data,
      count: data.length,
      totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize)
    }
  } catch (error) {
    console.error('Error fetching model data:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return {
      success: false,
      error: errorMessage
    }
  }
}

// Get a record by ID with related data
export async function getRecordById(modelName: string, id: string) {
  if (!checkRole('admin')) {
    throw new Error('Unauthorized')
  }

  try {
    // Check if the model exists in our schema
    const modelDef = getModelByName(modelName);
    if (!modelDef) {
      return {
        success: false, 
        error: `Model '${modelName}' definition not found`
      }
    }

    // Check if the model exists in Prisma
    if (!(modelName in prisma)) {
      return {
        success: false, 
        error: `Model '${modelName}' not found in Prisma client`
      }
    }

    // Build include object for belongsTo/hasOne relations
    const include: Record<string, boolean> = {}
    modelDef.relations
      .filter(relation => relation.type === 'belongsTo' || relation.type === 'hasOne')
      .forEach(relation => {
        include[relation.name] = true
      })

    // Get record with relations
    const record = await (prisma[modelName as keyof typeof prisma] as any).findUnique({
      where: { id },
      include: Object.keys(include).length > 0 ? include : undefined
    })

    if (!record) {
      return {
        success: false,
        error: `Record with ID '${id}' not found in ${modelName}`
      }
    }

    // Enrich response with schema metadata
    return {
      success: true,
      data: record,
      schema: {
        model: modelDef,
        relations: getRelatedModels(modelName)
      }
    }
  } catch (error) {
    console.error('Error fetching record by ID:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return {
      success: false,
      error: errorMessage
    }
  }
}

// Get related records
export async function getRelatedRecords(modelName: string, relationField: string, parentId: string, page = 1, pageSize = 10) {
  if (!checkRole('admin')) {
    throw new Error('Unauthorized')
  }

  try {
    // Check if the model exists in our schema
    const modelDef = getModelByName(modelName);
    if (!modelDef) {
      return {
        success: false, 
        error: `Model '${modelName}' definition not found`
      }
    }

    // Check if the model exists in Prisma
    if (!(modelName in prisma)) {
      return {
        success: false, 
        error: `Model '${modelName}' not found in Prisma client`
      }
    }
    
    // Calculate pagination parameters
    const skip = (page - 1) * pageSize
    
    // Create filter using the relation field
    const where: Record<string, any> = {
      [relationField]: parentId
    }

    // Fetch data with pagination
    const data = await (prisma[modelName as keyof typeof prisma] as any).findMany({
      where,
      skip,
      take: pageSize,
    })

    // Get total count for pagination
    const totalCount = await (prisma[modelName as keyof typeof prisma] as any).count({
      where,
    })

    return {
      success: true,
      data,
      count: data.length,
      totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
      schema: {
        model: modelDef
      }
    }
  } catch (error) {
    console.error('Error fetching related records:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return {
      success: false,
      error: errorMessage
    }
  }
}

// Get all relationships for a model
export async function getModelRelationships(modelName: string) {
  if (!checkRole('admin')) {
    throw new Error('Unauthorized')
  }

  try {
    const relationships = getRelatedModels(modelName);
    
    if (!relationships.length) {
      return {
        success: true,
        data: [],
        message: `No relationships found for model '${modelName}'`
      }
    }

    return {
      success: true,
      data: relationships
    }
  } catch (error) {
    console.error('Error fetching model relationships:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return {
      success: false,
      error: errorMessage
    }
  }
}

// Count records for each model
export async function getModelCounts() {
  if (!checkRole('admin')) {
    throw new Error('Unauthorized')
  }

  try {
    const counts = await Promise.all(
      modelNames.map(async (modelName) => {
        try {
          if (modelName in prisma) {
            const count = await (prisma[modelName as keyof typeof prisma] as any).count();
            return { modelName, count };
          }
          return { modelName, count: 0, error: 'Model not found in Prisma client' };
        } catch (error) {
          console.error(`Error counting ${modelName}:`, error);
          return { modelName, count: 0, error: (error as Error).message };
        }
      })
    );

    return {
      success: true,
      data: counts
    };
  } catch (error) {
    console.error('Error fetching model counts:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return {
      success: false,
      error: errorMessage
    }
  }
}
