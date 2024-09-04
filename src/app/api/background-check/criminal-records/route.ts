import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    // Authenticate the user
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch personReport from Prisma
    const personReport = await prisma.personReport.findUnique({
      where: { userId },
    });

    if (!personReport) {
      return NextResponse.json({ error: 'Person report not found' }, { status: 404 });
    }

    const requiredFields = ['firstName', 'lastName', 'city', 'state', 'dateOfBirth'];
    const missingFields = requiredFields.filter(field => !personReport[field]);

    if (missingFields.length > 0) {
      return NextResponse.json({ error: `Need ${missingFields.join(', ')}` }, { status: 400 });
    }

    // Prepare SearchBug API request
    const searchBugParams = new URLSearchParams({
      CO_CODE: process.env.SEARCHBUG_ACCOUNT_ID!,
      PASS: process.env.SEARCHBUG_PASSWORD! + '$z',
      TYPE: 'api_crm',
      FNAME: personReport.firstName,
      LNAME: personReport.lastName,
      CITY: personReport.city,
      STATE: personReport.state,
      DOB: personReport.dateOfBirth,
      FORMAT: 'JSON',
    });

    // Make request to SearchBug API
    // const searchBugResponse = await fetch(
    //   `https://data.searchbug.com/api/search.aspx?${searchBugParams.toString()}`
    // );

    // if (!searchBugResponse.ok) {
    //   throw new Error(`SearchBug API responded with status: ${searchBugResponse.status}`);
    // }

    //   const searchBugData = await searchBugResponse.json();
    // Return the SearchBug API response
    return NextResponse.json(extractOffenseDescriptions(sampleCriminal));
  } catch (error) {
    console.error('Error in criminal records check:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function extractOffenseDescriptions(criminalData: any): string[] {
  const descriptions: string[] = [];
  const crimeDetails = criminalData.criminals?.criminal?.crimeDetailsRecords?.crimeDetails;

  if (crimeDetails) {
    if (Array.isArray(crimeDetails)) {
      crimeDetails.forEach(detail => {
        if (detail.offenseDescription1) descriptions.push(detail.offenseDescription1);
        if (detail.offenseDescription2) descriptions.push(detail.offenseDescription2);
      });
    } else {
      if (crimeDetails.offenseDescription1) descriptions.push(crimeDetails.offenseDescription1);
      if (crimeDetails.offenseDescription2) descriptions.push(crimeDetails.offenseDescription2);
    }
  }

  return descriptions;
}

const sampleCriminal = {
  "meta": {
    "rows": "1",
    "errors": null
  },
  "criminals": {
    "criminal": {
      "suspect": {
        "AKAs": null,
        "DOB": "05/03/1995",
        "otherDOBs": null,
        "otherAddresses": null,
        "birthAddress": null,
        "birthPlace": null,
        "citizenship": null,
        "complexion": null,
        "build": null,
        "hair": "BROWN",
        "hairLength": null,
        "gender": "M",
        "scarsMarks": null,
        "skinTone": null,
        "height": "70",
        "weight": "180",
        "ethnicity": "WHITE",
        "eyes": "BLUE",
        "isSexOffender": "No",
        "militaryService": null,
        "maritalStatus": null,
        "employerAddress": null,
        "occupation": null,
        "businessName": null,
        "name": {
          "title": null,
          "firstName": "JOHN",
          "middleName": "X",
          "lastName": "DOE",
          "nameSuffix": null,
          "professionalSuffix": null,
          "firstDate": null,
          "lastDate": null
        },
        "address": null,
        "SSNRecord": null,
        "currentAge": "29",
        "businessToken": null,
        "reportToken": null,
        "firstDate": null,
        "lastDate": null
      },
      "arrestDetailsRecords": null,
      "crimeDetailsRecords": {
        "crimeDetails": {
          "sourceState": "OK",
          "caseNumber": "20SB-CR00117-01",
          "arrestingAgency": null,
          "county": null,
          "crimeCounty": null,
          "status": "ACTIVE",
          "statusDate": null,
          "conviction": null,
          "convictionDate": null,
          "convictionPlace": null,
          "warrant": null,
          "warrantDate": null,
          "warrantLocation": null,
          "supervision": null,
          "supervisionDate": null,
          "supervisionLocation": null,
          "commitment": null,
          "commitmentDate": null,
          "commitmentLocation": null,
          "arrest": null,
          "arrestLocation": null,
          "disposition": null,
          "dispositionLocation": null,
          "crimeType": "NOT CATEGORIZED",
          "category": null,
          "classification": null,
          "offenseCode": "21-843.5(C)",
          "gradeOfOffense": null,
          "degreeOfOffense": null,
          "NCICCode": null,
          "offenseDescription1": "PUBLIC INTOXICATION",
          "offenseDescription2": null,
          "counts": null,
          "caseType": null,
          "statute": null,
          "violation": null,
          "court": null,
          "courtCosts": null,
          "fines": null,
          "plea": null,
          "sentence": "SentenceBeginDate=20210715",
          "probation": "ProbationMaxYears=3",
          "violationDate": null,
          "registrationDate": null,
          "registrationEndDate": null,
          "predator": null,
          "victim": null,
          "victimGender": null,
          "victimAge": null,
          "victimIsMinor": null,
          "extraData": null
        }
      },
      "warrantDetailsRecords": null
    }
  }
}