/**
 * Type definitions derived from schema.prisma
 * This file defines the structure and relationships of database models
 * for a type-safe SQL editor interface.
 */

export type FieldType = 'String' | 'Int' | 'Float' | 'Boolean' | 'DateTime' | 'Enum' | 'Json';

export type RelationType = 'hasOne' | 'hasMany' | 'belongsTo' | 'manyToMany';

export interface Field {
  name: string;
  type: FieldType | string; // Can be a scalar type or model name
  isRequired: boolean;
  isList: boolean;
  isId: boolean;
  isEnum: boolean;
}

export interface Relation {
  name: string;
  type: RelationType;
  model: string;
  foreignKey: string;
  field: string;
}

export interface Model {
  name: string;
  dbName?: string;
  fields: Field[];
  relations: Relation[];
}

export interface SchemaDefinition {
  models: Model[];
  enums: {
    name: string;
    values: string[];
  }[];
}

// Enum definitions derived from schema.prisma
const enums = [
  {
    name: 'TripStatus',
    values: ['searching', 'matching', 'finalizing', 'reserved', 'active', 'cancelled', 'completed']
  },
  {
    name: 'CreditBucket',
    values: ['Low', 'Fair', 'Good', 'Very_Good', 'VeryGood', 'Exceptional']
  },
  {
    name: 'ImageCategory',
    values: ['Income', 'Identification']
  }
];

// Model definitions derived from schema.prisma
export const schema: SchemaDefinition = {
  models: [
    {
      name: 'User',
      fields: [
        { name: 'id', type: 'String', isRequired: true, isList: false, isId: true, isEnum: false },
        { name: 'stripeAccountId', type: 'String', isRequired: false, isList: false, isId: false, isEnum: false },
        { name: 'firstName', type: 'String', isRequired: false, isList: false, isId: false, isEnum: false },
        { name: 'lastName', type: 'String', isRequired: false, isList: false, isId: false, isEnum: false },
        { name: 'fullName', type: 'String', isRequired: false, isList: false, isId: false, isEnum: false },
        { name: 'email', type: 'String', isRequired: false, isList: false, isId: false, isEnum: false },
        { name: 'emailVerified', type: 'DateTime', isRequired: false, isList: false, isId: false, isEnum: false },
        { name: 'imageUrl', type: 'String', isRequired: false, isList: false, isId: false, isEnum: false },
        { name: 'hashedPassword', type: 'String', isRequired: false, isList: false, isId: false, isEnum: false },
        { name: 'createdAt', type: 'DateTime', isRequired: true, isList: false, isId: false, isEnum: false },
        { name: 'updatedAt', type: 'DateTime', isRequired: true, isList: false, isId: false, isEnum: false },
        { name: 'lastLogin', type: 'DateTime', isRequired: false, isList: false, isId: false, isEnum: false },
        { name: 'verifiedAt', type: 'DateTime', isRequired: false, isList: false, isId: false, isEnum: false },
        { name: 'hallmarkHostAt', type: 'DateTime', isRequired: false, isList: false, isId: false, isEnum: false },
        { name: 'trailblazerAt', type: 'DateTime', isRequired: false, isList: false, isId: false, isEnum: false },
      ],
      relations: [
        { name: 'accounts', type: 'hasMany', model: 'Account', foreignKey: 'userId', field: 'accounts' },
        { name: 'listings', type: 'hasMany', model: 'Listing', foreignKey: 'userId', field: 'listings' },
        { name: 'bookings', type: 'hasMany', model: 'Booking', foreignKey: 'userId', field: 'bookings' },
        { name: 'notifications', type: 'hasMany', model: 'Notification', foreignKey: 'userId', field: 'notifications' },
        { name: 'housingRequests', type: 'hasMany', model: 'HousingRequest', foreignKey: 'userId', field: 'HousingRequest' },
        { name: 'trips', type: 'hasMany', model: 'Trip', foreignKey: 'userId', field: 'trips' },
        { name: 'applications', type: 'hasMany', model: 'Application', foreignKey: 'userId', field: 'applications' },
        { name: 'preferences', type: 'hasOne', model: 'UserPreferences', foreignKey: 'userId', field: 'preferences' },
        { name: 'participatingTrips', type: 'manyToMany', model: 'Trip', foreignKey: 'userId', field: 'participatingTrips' },
        { name: 'purchases', type: 'hasMany', model: 'Purchase', foreignKey: 'userId', field: 'purchases' },
        { name: 'personReports', type: 'hasOne', model: 'PersonReport', foreignKey: 'userId', field: 'personReports' },
        { name: 'creditReport', type: 'hasOne', model: 'CreditReport', foreignKey: 'userId', field: 'creditReport' },
        { name: 'conversations', type: 'hasMany', model: 'ConversationParticipant', foreignKey: 'userId', field: 'conversations' },
        { name: 'messageReads', type: 'hasMany', model: 'MessageRead', foreignKey: 'userId', field: 'messageReads' },
        { name: 'sentMessages', type: 'hasMany', model: 'Message', foreignKey: 'senderId', field: 'sentMessages' },
        { name: 'boldSignTemplates', type: 'hasMany', model: 'BoldSignTemplate', foreignKey: 'userId', field: 'boldSignTemplates' },
        { name: 'boldSignLeases', type: 'hasMany', model: 'BoldSignLease', foreignKey: 'landlordId', field: 'BoldSignLease' },
        { name: 'leases', type: 'hasMany', model: 'Lease', foreignKey: 'landlordId', field: 'Lease' },
      ]
    },
    {
      name: 'UserPreferences',
      dbName: 'user_preferences',
      fields: [
        { name: 'id', type: 'String', isRequired: true, isList: false, isId: true, isEnum: false },
        { name: 'userId', type: 'String', isRequired: true, isList: false, isId: false, isEnum: false },
        { name: 'createdAt', type: 'DateTime', isRequired: true, isList: false, isId: false, isEnum: false },
        { name: 'listingType', type: 'String', isRequired: true, isList: false, isId: false, isEnum: false },
        { name: 'bedroomCount', type: 'Int', isRequired: true, isList: false, isId: false, isEnum: false },
        { name: 'bathroomCount', type: 'Int', isRequired: true, isList: false, isId: false, isEnum: false },
        { name: 'furnished', type: 'Boolean', isRequired: true, isList: false, isId: false, isEnum: false },
        { name: 'airConditioner', type: 'Boolean', isRequired: true, isList: false, isId: false, isEnum: false },
        { name: 'laundryFacilites', type: 'Boolean', isRequired: true, isList: false, isId: false, isEnum: false },
        { name: 'inUnitWasher', type: 'Boolean', isRequired: true, isList: false, isId: false, isEnum: false },
        { name: 'inUnitDryer', type: 'Boolean', isRequired: true, isList: false, isId: false, isEnum: false },
        { name: 'fitnessCenter', type: 'Boolean', isRequired: true, isList: false, isId: false, isEnum: false },
        { name: 'pool', type: 'Boolean', isRequired: true, isList: false, isId: false, isEnum: false },
        { name: 'dishwasher', type: 'Boolean', isRequired: true, isList: false, isId: false, isEnum: false },
        { name: 'elevator', type: 'Boolean', isRequired: true, isList: false, isId: false, isEnum: false },
        { name: 'wheelchairAccess', type: 'Boolean', isRequired: true, isList: false, isId: false, isEnum: false },
        { name: 'doorman', type: 'Boolean', isRequired: true, isList: false, isId: false, isEnum: false },
        { name: 'parking', type: 'Boolean', isRequired: true, isList: false, isId: false, isEnum: false },
        { name: 'fireplace', type: 'Boolean', isRequired: true, isList: false, isId: false, isEnum: false },
        { name: 'wifi', type: 'Boolean', isRequired: true, isList: false, isId: false, isEnum: false },
        { name: 'kitchen', type: 'Boolean', isRequired: true, isList: false, isId: false, isEnum: false },
        { name: 'dedicatedWorkspace', type: 'Boolean', isRequired: true, isList: false, isId: false, isEnum: false },
        { name: 'television', type: 'Boolean', isRequired: true, isList: false, isId: false, isEnum: false },
        { name: 'hairDryer', type: 'Boolean', isRequired: true, isList: false, isId: false, isEnum: false },
        { name: 'iron', type: 'Boolean', isRequired: true, isList: false, isId: false, isEnum: false },
      ],
      relations: [
        { name: 'user', type: 'belongsTo', model: 'User', foreignKey: 'userId', field: 'user' },
      ]
    },
    {
      name: 'Account',
      fields: [
        { name: 'id', type: 'String', isRequired: true, isList: false, isId: true, isEnum: false },
        { name: 'userId', type: 'String', isRequired: true, isList: false, isId: false, isEnum: false },
        { name: 'type', type: 'String', isRequired: true, isList: false, isId: false, isEnum: false },
        { name: 'provider', type: 'String', isRequired: true, isList: false, isId: false, isEnum: false },
        { name: 'providerAccountId', type: 'String', isRequired: true, isList: false, isId: false, isEnum: false },
        { name: 'refresh_token', type: 'String', isRequired: false, isList: false, isId: false, isEnum: false },
        { name: 'access_token', type: 'String', isRequired: false, isList: false, isId: false, isEnum: false },
        { name: 'expires_at', type: 'Int', isRequired: false, isList: false, isId: false, isEnum: false },
        { name: 'token_type', type: 'String', isRequired: false, isList: false, isId: false, isEnum: false },
        { name: 'scope', type: 'String', isRequired: false, isList: false, isId: false, isEnum: false },
        { name: 'id_token', type: 'String', isRequired: false, isList: false, isId: false, isEnum: false },
        { name: 'session_state', type: 'String', isRequired: false, isList: false, isId: false, isEnum: false },
      ],
      relations: [
        { name: 'user', type: 'belongsTo', model: 'User', foreignKey: 'userId', field: 'user' },
      ]
    },
    // Add more models as needed, focusing on the most important ones first
    {
      name: 'Listing',
      fields: [
        { name: 'id', type: 'String', isRequired: true, isList: false, isId: true, isEnum: false },
        { name: 'isApproved', type: 'Boolean', isRequired: true, isList: false, isId: false, isEnum: false },
        { name: 'createdAt', type: 'DateTime', isRequired: true, isList: false, isId: false, isEnum: false },
        { name: 'lastModified', type: 'DateTime', isRequired: true, isList: false, isId: false, isEnum: false },
        { name: 'lastApprovalDecision', type: 'DateTime', isRequired: false, isList: false, isId: false, isEnum: false },
        { name: 'lastDecisionComment', type: 'String', isRequired: false, isList: false, isId: false, isEnum: false },
        { name: 'status', type: 'String', isRequired: true, isList: false, isId: false, isEnum: false },
        { name: 'title', type: 'String', isRequired: true, isList: false, isId: false, isEnum: false },
        { name: 'description', type: 'String', isRequired: true, isList: false, isId: false, isEnum: false },
        { name: 'imageSrc', type: 'String', isRequired: false, isList: false, isId: false, isEnum: false },
        { name: 'category', type: 'String', isRequired: false, isList: false, isId: false, isEnum: false },
        { name: 'roomCount', type: 'Int', isRequired: true, isList: false, isId: false, isEnum: false },
        { name: 'bathroomCount', type: 'Int', isRequired: true, isList: false, isId: false, isEnum: false },
        { name: 'guestCount', type: 'Int', isRequired: false, isList: false, isId: false, isEnum: false },
        { name: 'latitude', type: 'Float', isRequired: true, isList: false, isId: false, isEnum: false },
        { name: 'longitude', type: 'Float', isRequired: true, isList: false, isId: false, isEnum: false },
        { name: 'locationString', type: 'String', isRequired: false, isList: false, isId: false, isEnum: false },
        { name: 'city', type: 'String', isRequired: false, isList: false, isId: false, isEnum: false },
        { name: 'state', type: 'String', isRequired: false, isList: false, isId: false, isEnum: false },
        { name: 'streetAddress1', type: 'String', isRequired: false, isList: false, isId: false, isEnum: false },
        { name: 'streetAddress2', type: 'String', isRequired: false, isList: false, isId: false, isEnum: false },
        { name: 'postalCode', type: 'String', isRequired: false, isList: false, isId: false, isEnum: false },
        { name: 'userId', type: 'String', isRequired: true, isList: false, isId: false, isEnum: false },
        { name: 'squareFootage', type: 'Int', isRequired: true, isList: false, isId: false, isEnum: false },
        { name: 'depositSize', type: 'Int', isRequired: false, isList: false, isId: false, isEnum: false },
        { name: 'requireBackgroundCheck', type: 'Boolean', isRequired: true, isList: false, isId: false, isEnum: false },
        { name: 'shortestLeaseLength', type: 'Int', isRequired: true, isList: false, isId: false, isEnum: false },
        { name: 'longestLeaseLength', type: 'Int', isRequired: true, isList: false, isId: false, isEnum: false },
        { name: 'shortestLeasePrice', type: 'Int', isRequired: true, isList: false, isId: false, isEnum: false },
        { name: 'longestLeasePrice', type: 'Int', isRequired: true, isList: false, isId: false, isEnum: false },
        { name: 'furnished', type: 'Boolean', isRequired: true, isList: false, isId: false, isEnum: false },
        { name: 'utilitiesIncluded', type: 'Boolean', isRequired: true, isList: false, isId: false, isEnum: false },
        { name: 'petsAllowed', type: 'Boolean', isRequired: true, isList: false, isId: false, isEnum: false },
        { name: 'tripId', type: 'String', isRequired: false, isList: false, isId: false, isEnum: false },
        { name: 'boldSignTemplateId', type: 'String', isRequired: false, isList: false, isId: false, isEnum: false },
        // Omitting many boolean fields for amenities for brevity
      ],
      relations: [
        { name: 'user', type: 'belongsTo', model: 'User', foreignKey: 'userId', field: 'user' },
        { name: 'bookings', type: 'hasMany', model: 'Booking', foreignKey: 'listingId', field: 'bookings' },
        { name: 'housingRequests', type: 'hasMany', model: 'HousingRequest', foreignKey: 'listingId', field: 'housingRequests' },
        { name: 'trip', type: 'belongsTo', model: 'Trip', foreignKey: 'tripId', field: 'Trip' },
        { name: 'listingImages', type: 'hasMany', model: 'ListingImage', foreignKey: 'listingId', field: 'listingImages' },
        { name: 'bedrooms', type: 'hasMany', model: 'Bedroom', foreignKey: 'listingId', field: 'bedrooms' },
        { name: 'dislikes', type: 'hasMany', model: 'Dislike', foreignKey: 'listingId', field: 'dislikes' },
        { name: 'matches', type: 'hasMany', model: 'Match', foreignKey: 'listingId', field: 'matches' },
        { name: 'boldSignTemplate', type: 'belongsTo', model: 'BoldSignTemplate', foreignKey: 'boldSignTemplateId', field: 'boldSignTemplate' },
        { name: 'unavailablePeriods', type: 'hasMany', model: 'ListingUnavailability', foreignKey: 'listingId', field: 'unavailablePeriods' },
        { name: 'maybes', type: 'hasMany', model: 'Maybe', foreignKey: 'listingId', field: 'Maybe' },
      ]
    },
    {
      name: 'Trip',
      fields: [
        { name: 'id', type: 'String', isRequired: true, isList: false, isId: true, isEnum: false },
        { name: 'locationString', type: 'String', isRequired: true, isList: false, isId: false, isEnum: false },
        { name: 'latitude', type: 'Float', isRequired: true, isList: false, isId: false, isEnum: false },
        { name: 'longitude', type: 'Float', isRequired: true, isList: false, isId: false, isEnum: false },
        { name: 'city', type: 'String', isRequired: false, isList: false, isId: false, isEnum: false },
        { name: 'state', type: 'String', isRequired: false, isList: false, isId: false, isEnum: false },
        { name: 'postalCode', type: 'String', isRequired: false, isList: false, isId: false, isEnum: false },
        { name: 'createdAt', type: 'DateTime', isRequired: true, isList: false, isId: false, isEnum: false },
        { name: 'updatedAt', type: 'DateTime', isRequired: true, isList: false, isId: false, isEnum: false },
        { name: 'isSponsored', type: 'Boolean', isRequired: true, isList: false, isId: false, isEnum: false },
        { name: 'sponsorID', type: 'String', isRequired: false, isList: false, isId: false, isEnum: false },
        { name: 'startDate', type: 'DateTime', isRequired: false, isList: false, isId: false, isEnum: false },
        { name: 'endDate', type: 'DateTime', isRequired: false, isList: false, isId: false, isEnum: false },
        { name: 'numAdults', type: 'Int', isRequired: true, isList: false, isId: false, isEnum: false },
        { name: 'numPets', type: 'Int', isRequired: true, isList: false, isId: false, isEnum: false },
        { name: 'numChildren', type: 'Int', isRequired: true, isList: false, isId: false, isEnum: false },
        { name: 'userId', type: 'String', isRequired: true, isList: false, isId: false, isEnum: false },
        { name: 'tripStatus', type: 'TripStatus', isRequired: true, isList: false, isId: false, isEnum: true },
        { name: 'flexibleStart', type: 'Int', isRequired: true, isList: false, isId: false, isEnum: false },
        { name: 'flexibleEnd', type: 'Int', isRequired: true, isList: false, isId: false, isEnum: false },
        { name: 'minPrice', type: 'Int', isRequired: false, isList: false, isId: false, isEnum: false },
        { name: 'maxPrice', type: 'Int', isRequired: false, isList: false, isId: false, isEnum: false },
        { name: 'minBeds', type: 'Int', isRequired: false, isList: false, isId: false, isEnum: false },
        { name: 'minBedrooms', type: 'Int', isRequired: false, isList: false, isId: false, isEnum: false },
        { name: 'minBathrooms', type: 'Int', isRequired: false, isList: false, isId: false, isEnum: false },
        { name: 'searchRadius', type: 'Int', isRequired: false, isList: false, isId: false, isEnum: false },
        // Omitting filters for brevity
      ],
      relations: [
        { name: 'allParticipants', type: 'manyToMany', model: 'User', foreignKey: 'tripId', field: 'allParticipants' },
        { name: 'user', type: 'belongsTo', model: 'User', foreignKey: 'userId', field: 'user' },
        { name: 'listings', type: 'hasMany', model: 'Listing', foreignKey: 'tripId', field: 'listings' },
        { name: 'matches', type: 'hasMany', model: 'Match', foreignKey: 'tripId', field: 'matches' },
        { name: 'favorites', type: 'hasMany', model: 'Favorite', foreignKey: 'tripId', field: 'favorites' },
        { name: 'housingRequests', type: 'hasMany', model: 'HousingRequest', foreignKey: 'tripId', field: 'housingRequests' },
        { name: 'dislikes', type: 'hasMany', model: 'Dislike', foreignKey: 'tripId', field: 'dislikes' },
        { name: 'maybes', type: 'hasMany', model: 'Maybe', foreignKey: 'tripId', field: 'maybes' },
        { name: 'applications', type: 'hasMany', model: 'Application', foreignKey: 'tripId', field: 'applications' },
      ]
    },
    {
      name: 'Match',
      fields: [
        { name: 'id', type: 'String', isRequired: true, isList: false, isId: true, isEnum: false },
        { name: 'tripId', type: 'String', isRequired: true, isList: false, isId: false, isEnum: false },
        { name: 'listingId', type: 'String', isRequired: true, isList: false, isId: false, isEnum: false },
        { name: 'monthlyRent', type: 'Int', isRequired: false, isList: false, isId: false, isEnum: false },
      ],
      relations: [
        { name: 'trip', type: 'belongsTo', model: 'Trip', foreignKey: 'tripId', field: 'trip' },
        { name: 'listing', type: 'belongsTo', model: 'Listing', foreignKey: 'listingId', field: 'listing' },
        { name: 'booking', type: 'hasOne', model: 'Booking', foreignKey: 'matchId', field: 'booking' },
        { name: 'boldSignLease', type: 'hasOne', model: 'BoldSignLease', foreignKey: 'matchId', field: 'BoldSignLease' },
        { name: 'lease', type: 'hasOne', model: 'Lease', foreignKey: 'matchId', field: 'Lease' },
      ]
    },
    {
      name: 'Booking',
      fields: [
        { name: 'id', type: 'String', isRequired: true, isList: false, isId: true, isEnum: false },
        { name: 'userId', type: 'String', isRequired: true, isList: false, isId: false, isEnum: false },
        { name: 'listingId', type: 'String', isRequired: true, isList: false, isId: false, isEnum: false },
        { name: 'matchId', type: 'String', isRequired: true, isList: false, isId: false, isEnum: false },
        { name: 'startDate', type: 'DateTime', isRequired: true, isList: false, isId: false, isEnum: false },
        { name: 'endDate', type: 'DateTime', isRequired: true, isList: false, isId: false, isEnum: false },
        { name: 'totalPrice', type: 'Int', isRequired: false, isList: false, isId: false, isEnum: false },
        { name: 'monthlyRent', type: 'Int', isRequired: false, isList: false, isId: false, isEnum: false },
        { name: 'createdAt', type: 'DateTime', isRequired: true, isList: false, isId: false, isEnum: false },
        { name: 'status', type: 'String', isRequired: true, isList: false, isId: false, isEnum: false },
      ],
      relations: [
        { name: 'user', type: 'belongsTo', model: 'User', foreignKey: 'userId', field: 'user' },
        { name: 'listing', type: 'belongsTo', model: 'Listing', foreignKey: 'listingId', field: 'listing' },
        { name: 'match', type: 'belongsTo', model: 'Match', foreignKey: 'matchId', field: 'match' },
        { name: 'rentPayments', type: 'hasMany', model: 'RentPayment', foreignKey: 'bookingId', field: 'rentPayments' },
      ]
    }
  ],
  enums
};

// Helper function to get a model definition by name
export function getModelByName(name: string): Model | undefined {
  return schema.models.find(model => model.name === name);
}

// Helper function to get field definition from a model
export function getFieldByName(model: Model, fieldName: string): Field | undefined {
  return model.fields.find(field => field.name === fieldName);
}

// Helper function to get relation definition from a model
export function getRelationByName(model: Model, relationName: string): Relation | undefined {
  return model.relations.find(relation => relation.name === relationName);
}

// Helper function to get related models
export function getRelatedModels(modelName: string): { model: Model, relation: Relation }[] {
  const model = getModelByName(modelName);
  if (!model) return [];
  
  return model.relations.map(relation => {
    const relatedModel = getModelByName(relation.model);
    if (!relatedModel) return null;
    
    return { model: relatedModel, relation };
  }).filter(Boolean) as { model: Model, relation: Relation }[];
}

// Export a list of all model names for easy access
export const modelNames = schema.models.map(model => model.name);