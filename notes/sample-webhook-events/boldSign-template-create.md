curl -X POST http://localhost:3000/api/leases/template/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event": {
      "id": "d423b942-150c-47e4-be3c-50ab4c97dc30",
      "created": 1726803368,
      "eventType": "TemplateCreated",
      "clientId": null,
      "environment": "Test"
    },
    "data": {
      "object": "template",
      "templateId": "72305193-58ec-4b37-bb03-dc12c0030150",
      "allowNewFiles": true,
      "allowModifyFiles": true,
      "senderDetail": {
        "name": "Tyler Bennett",
        "emailAddress": "tyler.bennett52@gmail.com",
        "userId": "9f5b76ce-fd2a-4164-bd24-9eb07ae207d3"
      },
      "ccDetails": [],
      "createdDate": 1726803368,
      "activityDate": null,
      "activityBy": null,
      "messageTitle": "Match 3",
      "status": "Completed",
      "signerDetails": [
        {
          "signerName": "Alex Gayle",
          "signerRole": "HR",
          "signerEmail": "alexgayle@cubeflakes.com",
          "phoneNumber": null,
          "enableAccessCode": false,
          "enableEmailOTP": true,
          "status": "NotCompleted",
          "userId": null,
          "order": 1,
          "signerType": "Signer",
          "hostEmail": null,
          "hostName": null,
          "hostUserId": null,
          "imposeAuthentication": "EmailOTP",
          "allowFieldConfiguration": false
        }
      ],
      "enableSigningOrder": true,
      "templateName": "Match 3",
      "templateDescription": "Match 3 Description",
      "errorMessage": null,
      "isTemplate": true,
      "BrandId": null,
      "onBehalfOf": null,
      "labels": null,
      "templateLabels": null
    },
    "document": null
  }'
