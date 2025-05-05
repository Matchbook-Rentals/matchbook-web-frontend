# Application Model Migration Documentation

## Overview
This document outlines the changes made to the Application model in our schema.prisma file to better handle user information, identification documents, and security-sensitive data.

## Changes Made

### Application Model
1. **Added Personal Information Fields**:
   - `middleName` (String?) - Optional middle name
   - `noMiddleName` (Boolean?) - Flag indicating user has no middle name
   - `dateOfBirth` (DateTime?) - User's date of birth
   - `ssn` (String?) - Encrypted Social Security Number

2. **Maintained Relationship with Identification**:
   - Kept the existing one-to-many relationship for backward compatibility
   - Added functionality to mark one identification as primary using isPrimary flag

### Identification Model
1. **Added isPrimary Flag**:
   - Added `isPrimary` (Boolean) field to mark the primary identification document
   - Default value is false

2. **Added IDPhoto Relationship**:
   - Created new one-to-many relationship with IDPhoto model
   - Each identification can have multiple photos

### New IDPhoto Model
Created a new model to store identification document photos:
```prisma
model IDPhoto {
  id               String         @id @default(cuid())
  url              String
  identification   Identification @relation(fields: [identificationId], references: [id], onDelete: Cascade)
  identificationId String
  isPrimary        Boolean        @default(false)
  createdAt        DateTime       @default(now())

  @@index([identificationId])
}
```

## Implementation Notes

### SSN Encryption
- The SSN field should ONLY store encrypted values
- Implement proper encryption/decryption logic in the application layer
- Never transmit or display the raw SSN value in logs or user interfaces

### ID Photo Requirements
- At least one photo must be attached to each identification record
- One photo must be marked as primary (isPrimary = true)
- Implement validation logic to enforce these requirements

### Migration Strategy
1. Create a Prisma migration using `npx prisma migrate dev`
2. Run a data migration script to ensure each application has at least one identification marked as primary:
   ```javascript
   // Example migration script
   async function migrateIdentifications() {
     const applications = await prisma.application.findMany({
       include: { identifications: true }
     });
     
     for (const app of applications) {
       if (app.identifications.length > 0) {
         // Set the first identification as primary if none are marked
         const hasPrimary = app.identifications.some(id => id.isPrimary);
         if (!hasPrimary) {
           await prisma.identification.update({
             where: { id: app.identifications[0].id },
             data: { isPrimary: true }
           });
         }
       }
     }
   }
   ```
3. Update related frontend components that handle application forms
4. Modify API endpoints to handle the new fields and relationships
5. Implement SSN encryption logic
6. Update validation rules to enforce required fields and relationships

## Frontend Component Updates

### Required Updates to application-store.ts:

1. **Update PersonalInfo Interface:**
   ```typescript
   interface PersonalInfo {
     firstName: string;
     lastName: string;
     middleName?: string;
     noMiddleName?: boolean;
     dateOfBirth?: Date | string;
     ssn?: string;
   }
   ```

2. **Update Identification Interface:**
   ```typescript
   interface Identification {
     id: string;
     idType: string;
     idNumber: string;
     isPrimary: boolean;
     photos?: IDPhoto[];
   }
   ```

3. **Add IDPhoto Interface:**
   ```typescript
   interface IDPhoto {
     id?: string;
     url: string;
     isPrimary: boolean;
   }
   ```

4. **Update initialState:**
   ```typescript
   export const initialState = {
     personalInfo: {
       firstName: '',
       lastName: '',
       middleName: '',
       noMiddleName: false,
       dateOfBirth: '',
       ssn: ''
     },
     ids: [{ id: '', idType: '', idNumber: '', isPrimary: true, photos: [] }],
     // Rest of the state remains the same
   };
   ```

5. **Update initializeFromApplication method:**
   ```typescript
   initializeFromApplication: (application) => {
     if (!application) return;
     
     // Existing code...
     
     const newData = {
       personalInfo: {
         firstName: application.firstName || '',
         lastName: application.lastName || '',
         middleName: application.middleName || '',
         noMiddleName: application.noMiddleName || false,
         dateOfBirth: application.dateOfBirth || '',
         ssn: application.ssn || ''
       },
       ids: application.identifications?.map((id: any) => ({
         id: id.id || '',
         idType: id.idType || '',
         idNumber: id.idNumber || '',
         isPrimary: id.isPrimary || false,
         photos: id.idPhotos || []
       })) || [{ id: '', idType: '', idNumber: '', isPrimary: true, photos: [] }],
       
       // Rest of the data mapping
     };
     
     // Rest of the method
   }
   ```

### Updates to the application form components:

1. **Update PersonalInfo Component:**
   - Add fields for middleName, noMiddleName checkbox, and dateOfBirth
   - Add SSN input with proper masking and security considerations

2. **Update Identification Component:**
   - Add support for marking an ID as primary
   - Implement photo upload functionality for IDs
   - Allow selecting a primary photo

3. **Update the application validation:**
   ```typescript
   // In application-validation.ts
   export const validatePersonalInfo = (info: PersonalInfo) => {
     const errors: Record<string, string> = {};
     
     // Existing validations
     if (!info.firstName) errors.firstName = 'First name is required';
     if (!info.lastName) errors.lastName = 'Last name is required';
     
     // New validations
     if (!info.noMiddleName && !info.middleName) {
       errors.middleName = 'Middle name is required unless "No Middle Name" is checked';
     }
     
     if (!info.dateOfBirth) {
       errors.dateOfBirth = 'Date of birth is required';
     }
     
     // SSN validation (if required)
     // Only validate format if provided - SSN might be optional
     if (info.ssn && !/^\d{3}-\d{2}-\d{4}$/.test(info.ssn.replace(/\D/g, ''))) {
       errors.ssn = 'SSN must be in format XXX-XX-XXXX';
     }
     
     return errors;
   };
   
   export const validateIdentification = (ids: Identification[]) => {
     const errors: Record<string, string> = {};
     
     // Check if at least one ID is provided
     if (!ids.length) {
       errors.idType = 'At least one form of identification is required';
       return errors;
     }
     
     // Check if at least one ID is marked as primary
     if (!ids.some(id => id.isPrimary)) {
       errors.isPrimary = 'At least one identification must be marked as primary';
     }
     
     // Existing validations
     if (!ids[0].idType) errors.idType = 'ID type is required';
     if (!ids[0].idNumber) errors.idNumber = 'ID number is required';
     
     // New validations for photos
     if (!ids[0].photos || ids[0].photos.length === 0) {
       errors.photos = 'At least one photo is required for identification';
     } else if (!ids[0].photos.some(photo => photo.isPrimary)) {
       errors.primaryPhoto = 'One photo must be marked as primary';
     }
     
     return errors;
   };
   ```

4. **Update handleSubmit in application/page.tsx:**
   ```typescript
   const handleSubmit = async () => {
     const applicationData = {
       ...personalInfo,
       ...answers,
       incomes,
       identifications: ids.map(id => ({
         id: id.id,
         idType: id.idType,
         idNumber: id.idNumber,
         isPrimary: id.isPrimary,
         photos: id.photos?.map(photo => ({
           url: photo.url,
           isPrimary: photo.isPrimary
         }))
       })),
       residentialHistories: residentialHistory,
     };
     
     // Rest of the submit logic
   };
   ```

## API Updates

Update actions/applications.ts to handle the new fields and relationships:

1. **Update upsertApplication function:**
   - Add support for middleName, noMiddleName, dateOfBirth, and ssn
   - Implement encryption for SSN
   - Handle updating ID photos and their primary status

2. **Add function to handle ID photo uploads:**
   - Create a separate endpoint for uploading ID photos
   - Associate photos with the correct identification record
   - Manage isPrimary flag for photos

## Data Migration Plan

1. **Schema Migration:**
   - Run Prisma migration to add new fields
   - Verify database schema updates

2. **Data Normalization:**
   - Update existing records to have at least one primary identification
   - Set default values for new required fields

3. **Gradual Rollout:**
   - Deploy frontend updates in phases:
     1. First deploy read-only support for new fields
     2. Then deploy form updates that allow editing new fields
   - Monitor for any issues with data integrity

## Future Migration Path
Once all data is migrated properly and the application is consistently using the primary identification:

1. Add a unique constraint on (applicationId, isPrimary) to ensure only one primary ID per application
2. Further refine toward a true one-to-one relationship between Application and primary Identification

## Security Considerations
1. SSN values must be encrypted at rest
2. Implement proper access controls for viewing and modifying sensitive information
3. Ensure proper data retention and deletion policies for PII
4. Add audit logging for any access to sensitive fields

