"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { zodResolver } from "@hookform/resolvers/zod"
import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import Image from "next/image"
import { 
  verificationSchema, 
  type VerificationFormValues,
} from "./utils"
import StripeVerificationPayment from "@/components/stripe/stripe-verification-payment"
import { useUser } from "@clerk/nextjs"

export default function VerificationClient({ 
  paymentStatus,
  serverHasPurchase,
  reviewMode,
  sessionId,
  applicationData
}: { 
  paymentStatus?: string;
  serverHasPurchase?: boolean;
  reviewMode?: boolean;
  sessionId?: string;
  applicationData?: Partial<VerificationFormValues>;
}) {
  const [showForm, setShowForm] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<VerificationFormValues | null>(null)
  const [paymentComplete, setPaymentComplete] = useState<boolean>(paymentStatus === 'success')
  const [hasPurchase, setHasPurchase] = useState<boolean>(serverHasPurchase || false)
  const [approvalChecked, setApprovalChecked] = useState(false)
  const { user } = useUser()

  // Check URL params for payment success or review mode on component mount
  useEffect(() => {
    // Set form to show in review mode
    if (reviewMode) {
      setShowForm(true);
      setPaymentComplete(true);
      
      // If we have a session ID, verify it matches the one in localStorage
      if (sessionId) {
        const storedSessionId = localStorage.getItem('verificationSessionId');
        if (storedSessionId === sessionId) {
          console.log('Session ID verified');
        } else {
          console.warn('Session ID mismatch - stored:', storedSessionId, 'received:', sessionId);
        }
      }
      
      // Load form data regardless (server already verified session)
      try {
        const savedFormData = JSON.parse(localStorage.getItem('verificationFormData') || '{}');
        if (savedFormData && Object.keys(savedFormData).length > 0) {
          setFormData(savedFormData);
          form.reset(savedFormData);
        }
      } catch (error) {
        console.error('Error parsing saved form data:', error);
      }
    }
    // Legacy handling for payment success
    else if (paymentStatus === 'success') {
      setPaymentComplete(true);
      
      // Check if we have saved form data
      try {
        const savedFormData = JSON.parse(localStorage.getItem('verificationFormData') || '{}');
        if (savedFormData && Object.keys(savedFormData).length > 0) {
          setFormData(savedFormData);
          form.reset(savedFormData);
          setShowForm(true);
        }
      } catch (error) {
        console.error('Error parsing saved form data:', error);
      }
    }
    // Apply application data if available and no existing form data
    else if (applicationData && Object.keys(applicationData).some(key => !!applicationData[key as keyof typeof applicationData])) {
      // Log that we're prefilling with application data
      console.log('Prefilling form with application data');
    }
  }, [paymentStatus, reviewMode, sessionId, applicationData]);

  // Initialize from server-side purchase check and get form data if needed
  useEffect(() => {
    if (serverHasPurchase) {
      setHasPurchase(true);
      setShowForm(true);
      
      // Try to get form data from localStorage if we have a purchase
      try {
        const savedFormData = JSON.parse(localStorage.getItem('verificationFormData') || '{}');
        if (savedFormData && Object.keys(savedFormData).length > 0) {
          setFormData(savedFormData);
          form.reset(savedFormData);
        }
      } catch (error) {
        console.error('Error parsing saved form data:', error);
      }
    }
  }, [serverHasPurchase]);
  
  // Fallback client-side check in case the server check didn't work
  useEffect(() => {
    const checkPurchase = async () => {
      if (user?.id && !serverHasPurchase) {
        try {
          const response = await fetch(`/api/user/purchases?type=backgroundVerification&userId=${user.id}`);
          const data = await response.json();
          
          if (response.ok && data.purchases && data.purchases.length > 0) {
            // Find any unredeemed purchases
            const unredeemedPurchase = data.purchases.find((p: any) => p.isRedeemed === false);
            if (unredeemedPurchase) {
              setHasPurchase(true);
              setShowForm(true);
              
              // Try to get form data from localStorage if we have a purchase
              try {
                const savedFormData = JSON.parse(localStorage.getItem('verificationFormData') || '{}');
                if (savedFormData && Object.keys(savedFormData).length > 0) {
                  setFormData(savedFormData);
                  form.reset(savedFormData);
                }
              } catch (error) {
                console.error('Error parsing saved form data:', error);
              }
            }
          }
        } catch (error) {
          console.error('Error checking purchase status:', error);
        }
      }
    };

    checkPurchase();
  }, [user, serverHasPurchase]);

  const form = useForm<VerificationFormValues>({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      firstName: applicationData?.firstName || "",
      lastName: applicationData?.lastName || "",
      ssn: "", // Always blank for security reasons
      dob: applicationData?.dob || "",
      address: applicationData?.address || "",
      city: applicationData?.city || "",
      state: applicationData?.state || "",
      zip: applicationData?.zip || "",
    },
  })

  const [apiResponse, setApiResponse] = useState<{
    success: boolean;
    message: string;
    orderNumber: string;
    responseDetails?: string;
  } | null>(null);
  
  const [showResponseDetails, setShowResponseDetails] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [showErrorDetails, setShowErrorDetails] = useState(false);

  function validateForm(data: VerificationFormValues) {
    // Store form data for both local state and to potentially retrieve after payment redirect
    setFormData(data);
    localStorage.setItem('verificationFormData', JSON.stringify(data));
    // Show the payment form
    setShowPayment(true);
  }
  
  async function onSubmit(data: VerificationFormValues) {
    setIsSubmitting(true);
    setApiResponse(null);
    setErrorMessage(null);
    setErrorDetails(null);
    setShowErrorDetails(false);
    
    try {
      console.log("Submitting verification request...");
      
      // Mark the purchase as redeemed first
      if (user?.id && hasPurchase) {
        await fetch('/api/user/redeem-purchase', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'matchbookVerification',
            userId: user.id,
            sessionId: sessionId || localStorage.getItem('verificationSessionId') || undefined
          }),
        });
      }
      
      // Call the API endpoint
      const response = await fetch('/api/background-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      const result = await response.json();
      console.log("API Response:", result);
      
      if (!response.ok) {
        // Show detailed error from API
        setErrorMessage(result.error || 'Failed to submit verification request');
        // Store full details for debugging
        if (result.details) {
          setErrorDetails(result.details);
        }
        throw new Error(result.error || 'Failed to submit verification request');
      }
      
      // Store the API response
      setApiResponse(result);
      
      // Clear all saved verification data
      localStorage.removeItem('verificationFormData');
      localStorage.removeItem('verificationSessionId');
      setHasPurchase(false);
    } catch (error) {
      console.error("Error submitting verification request:", error);
      // Only set general error message if there isn't a specific API error
      if (!errorMessage) {
        setErrorMessage("There was an error submitting your verification request. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  // Handle start screening button click
  const handleStartScreening = () => {
    setShowForm(true)
    
    // Log when application data is available for prefill
    if (applicationData && Object.keys(applicationData).some(key => 
      key !== 'ssn' && !!applicationData[key as keyof typeof applicationData]
    )) {
      console.log('Using application data to prefill form fields')
    }
  }

  // Initial welcome screen
  if (!showForm) {
    return (
      <div className="grid md:grid-cols-2 gap-12 items-center max-w-3xl test mx-auto">
        {/* Village Illustration */}
        <div className="relative aspect-square max-w-md mx-auto">
          <Image
            src="/Verification-Village.png"
            alt="Verification Village"
            width={400}
            height={300}
            className="w-full h-auto"
          />
        </div>

        {/* Content */}
        <div className="text-center md:text-left space-y-6">
          <h1 className="text-2xl font-semibold">Get Matchbook Verification <span className="p-1 aspect-square border border-black rounded-full">?</span> </h1>
          <h1 className="text-2xl font-semibold text-blue-400">Set yourself Apart</h1>
          <div className="space-y-2">
            <p className="text-xl">
              One-time fee of only <span className="text-blue-400">$25.00</span>
            </p>
            <p className="text-lg">
              <span className="text-blue-400">One</span> Screening | <span className="text-blue-400">Unlimited</span>{" "}
              Applications
            </p>
            <p className="text-gray-400">Valid for up to 3 Months</p>
          </div>
          <Button 
            variant={'outline'}
            className="inline-block px-8 py-6 flex items-center justify-center text-lg border-2 border-blue-600 text-blue-600 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-700 rounded-md transition-colors"
            onClick={handleStartScreening}
          >
            Start Screening
          </Button>
        </div>
      </div>
    )
  }
  
  // Show payment form after user info is collected
  if (showPayment && formData) {
    return (
      <StripeVerificationPayment 
        formData={formData}
        onPaymentSuccess={() => {
          // After payment, don't submit immediately. We'll wait for webhook to create purchase
          setShowPayment(false);
        }}
        onCancel={() => {
          setShowPayment(false);
        }}
      />
    );
  }

  // Screening form
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => setShowForm(false)}
          className="text-blue-600"
        >
          ← Back
        </Button>
      </div>
      
      <h1 className="text-3xl font-bold mb-8 text-center">Complete Background Screening</h1>
      
      {paymentComplete || hasPurchase ? (
        <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-blue-800 mb-4">
            {paymentComplete ? "Payment Successful!" : "Previous Payment Found"}
          </h2>
          <p className="text-gray-600 mb-4">
            Please review your information below and click &quot;Submit Verification Request&quot; when you&apos;re ready.
            This information will be used for your background check.
          </p>
        </div>
      ) : (
        <>
          <p className="text-center mb-6 text-gray-600">
            This screening includes both National Criminal History Search and Evictions & Property Damage Check
          </p>
          {applicationData && Object.keys(applicationData).some(key => 
            key !== 'ssn' && !!applicationData[key as keyof typeof applicationData]
          ) && (
            <div className="mb-8 bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-gray-700">
                <span className="font-medium">Some fields have been pre-filled</span> with information from your application. 
                Please review and complete any missing information.
              </p>
            </div>
          )}
        </>
      )}
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(hasPurchase ? onSubmit : validateForm)} className="space-y-8">
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-md mb-6">
              <h3 className="font-medium mb-1">Error Submitting Request</h3>
              <p>{errorMessage}</p>
              
              {errorDetails && (
                <div className="mt-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowErrorDetails(!showErrorDetails)}
                    className="mb-2 text-red-700 border-red-300"
                  >
                    {showErrorDetails ? "Hide" : "Show"} Error Details
                  </Button>
                  
                  {showErrorDetails && (
                    <div className="bg-white p-3 rounded-md border border-red-200 overflow-auto max-h-60 mt-2">
                      <pre className="text-xs font-mono whitespace-pre-wrap break-words text-red-700">
                        {errorDetails}
                      </pre>
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex justify-between mt-3">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-red-600" 
                  onClick={() => {
                    setErrorMessage(null);
                    setErrorDetails(null);
                    setShowErrorDetails(false);
                  }}
                >
                  Dismiss
                </Button>
                
                {/* Add a retry button as a convenience */}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-red-300 text-red-700"
                  onClick={() => form.handleSubmit(onSubmit)()}
                >
                  Retry Submission
                </Button>
              </div>
            </div>
          )}

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6">Personal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name*</FormLabel>
                    <FormControl>
                      <Input placeholder="First Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name*</FormLabel>
                    <FormControl>
                      <Input placeholder="Last Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="ssn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Social Security Number*</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="123-45-6789"
                        type="text"
                        maxLength={11}
                        value={field.value ? field.value.replace(/(\d{3})(\d{2})(\d{0,4})/, (_, a, b, c) => c ? `${a}-${b}-${c}` : b ? `${a}-${b}` : a) : ''}
                        onChange={(e) => {
                          // Strip non-digits and store raw value
                          const rawValue = e.target.value.replace(/\D/g, '').slice(0, 9);
                          field.onChange(rawValue);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="dob"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Birth*</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <h2 className="text-xl font-semibold mb-6 mt-8">Residence Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Street Address*</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="123 Main St" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City*</FormLabel>
                    <FormControl>
                      <Input placeholder="City" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State*</FormLabel>
                    <FormControl>
                      <Select 
                        value={field.value} 
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select State" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AL">Alabama</SelectItem>
                          <SelectItem value="AK">Alaska</SelectItem>
                          <SelectItem value="AZ">Arizona</SelectItem>
                          <SelectItem value="AR">Arkansas</SelectItem>
                          <SelectItem value="CA">California</SelectItem>
                          <SelectItem value="CO">Colorado</SelectItem>
                          <SelectItem value="CT">Connecticut</SelectItem>
                          <SelectItem value="DE">Delaware</SelectItem>
                          <SelectItem value="FL">Florida</SelectItem>
                          <SelectItem value="GA">Georgia</SelectItem>
                          <SelectItem value="HI">Hawaii</SelectItem>
                          <SelectItem value="ID">Idaho</SelectItem>
                          <SelectItem value="IL">Illinois</SelectItem>
                          <SelectItem value="IN">Indiana</SelectItem>
                          <SelectItem value="IA">Iowa</SelectItem>
                          <SelectItem value="KS">Kansas</SelectItem>
                          <SelectItem value="KY">Kentucky</SelectItem>
                          <SelectItem value="LA">Louisiana</SelectItem>
                          <SelectItem value="ME">Maine</SelectItem>
                          <SelectItem value="MD">Maryland</SelectItem>
                          <SelectItem value="MA">Massachusetts</SelectItem>
                          <SelectItem value="MI">Michigan</SelectItem>
                          <SelectItem value="MN">Minnesota</SelectItem>
                          <SelectItem value="MS">Mississippi</SelectItem>
                          <SelectItem value="MO">Missouri</SelectItem>
                          <SelectItem value="MT">Montana</SelectItem>
                          <SelectItem value="NE">Nebraska</SelectItem>
                          <SelectItem value="NV">Nevada</SelectItem>
                          <SelectItem value="NH">New Hampshire</SelectItem>
                          <SelectItem value="NJ">New Jersey</SelectItem>
                          <SelectItem value="NM">New Mexico</SelectItem>
                          <SelectItem value="NY">New York</SelectItem>
                          <SelectItem value="NC">North Carolina</SelectItem>
                          <SelectItem value="ND">North Dakota</SelectItem>
                          <SelectItem value="OH">Ohio</SelectItem>
                          <SelectItem value="OK">Oklahoma</SelectItem>
                          <SelectItem value="OR">Oregon</SelectItem>
                          <SelectItem value="PA">Pennsylvania</SelectItem>
                          <SelectItem value="RI">Rhode Island</SelectItem>
                          <SelectItem value="SC">South Carolina</SelectItem>
                          <SelectItem value="SD">South Dakota</SelectItem>
                          <SelectItem value="TN">Tennessee</SelectItem>
                          <SelectItem value="TX">Texas</SelectItem>
                          <SelectItem value="UT">Utah</SelectItem>
                          <SelectItem value="VT">Vermont</SelectItem>
                          <SelectItem value="VA">Virginia</SelectItem>
                          <SelectItem value="WA">Washington</SelectItem>
                          <SelectItem value="WV">West Virginia</SelectItem>
                          <SelectItem value="WI">Wisconsin</SelectItem>
                          <SelectItem value="WY">Wyoming</SelectItem>
                          <SelectItem value="DC">District of Columbia</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="zip"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Zip Code*</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="12345" 
                        {...field} 
                        maxLength={10}
                        onInput={(e) => {
                          // Format as 12345 or 12345-6789
                          const target = e.target as HTMLInputElement;
                          let value = target.value.replace(/[^\d-]/g, '');
                          
                          // Handle formatting with hyphen
                          if (value.length > 5 && !value.includes('-')) {
                            value = value.substring(0, 5) + '-' + value.substring(5, 9);
                          }
                          
                          // Ensure format doesn't exceed 12345-6789
                          if (value.includes('-')) {
                            const [prefix, suffix] = value.split('-');
                            value = prefix.slice(0, 5) + '-' + (suffix || '').slice(0, 4);
                          } else {
                            value = value.slice(0, 5);
                          }
                          
                          target.value = value;
                          field.onChange(value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="mt-8 text-sm text-gray-600 border-t pt-4">
              <p>This screening includes:</p>
              <ul className="list-disc list-inside mt-2">
                <li>National Criminal History Search</li>
                <li>Evictions and Property Damage Check</li>
              </ul>
            </div>
          </Card>
          
          {apiResponse ? (
            <Card className="p-6 mt-8 bg-green-50 border-green-200">
              <h2 className="text-xl font-semibold text-green-800 mb-4">Verification Request Submitted</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium">Order Number:</h3>
                  <p className="font-mono bg-white p-2 rounded border">{apiResponse.orderNumber}</p>
                </div>
                <div>
                  <h3 className="font-medium">Status:</h3>
                  <p className="text-green-700">✓ {apiResponse.message}</p>
                </div>
                <p className="text-sm text-gray-600 pt-4 border-t">
                  You can view your background check status by logging into your Matchbook account.
                  The results will be processed automatically. You should receive results within 24-48 hours.
                </p>

                {apiResponse.responseDetails && (
                  <div className="mt-4 border-t pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowResponseDetails(!showResponseDetails)}
                      className="mb-2"
                    >
                      {showResponseDetails ? "Hide" : "Show"} API Response Details
                    </Button>

                    {showResponseDetails && (
                      <div className="bg-gray-100 p-3 rounded-md border overflow-auto max-h-60">
                        <pre className="text-xs font-mono whitespace-pre-wrap break-words">
                          {apiResponse.responseDetails}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="flex justify-between mt-4">
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => setShowForm(false)}
                  >
                    Return to Verification Home
                  </Button>
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => {
                      setApiResponse(null);
                      setShowResponseDetails(false);
                      form.reset();
                    }}
                  >
                    Submit Another Request
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <>
              {/* Authorization Terms Section */}
              <div className="mt-8 mb-6">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Credit Report and Background Check Authorization</h3>
                  
                  <div className="p-4 bg-gray-50 rounded-md max-h-96 overflow-y-auto text-xs">
                    <div className="space-y-3">
                      <div className="text-center font-bold">
                        CREDIT REPORT AND BACKGROUND CHECK AUTHORIZATION FORM
                      </div>
                      <div className="text-center text-gray-600">
                        Last Updated: June 17, 2025
                      </div>
                      
                      <p>By signing below, I voluntarily provide my informed consent to the following terms:</p>
                      
                      <div>
                        <h4 className="font-semibold mb-1">1. Authorization to Obtain Reports</h4>
                        <p className="mb-1">
                          I authorize MatchBook LLC and its designated agents and representatives, including third-party screening providers (such as Global Background Screening, iSoftpull), to obtain consumer reports about me, including a credit history and a background check (the &quot;Reports&quot;). I understand that my personal information, such as my date of birth and social security number, will be used for the purpose of obtaining these Reports. I understand that these Reports may include, but are not limited to, information related to the following from any governmental agency in any or all federal, state, or county jurisdiction:
                        </p>
                        <ul className="list-disc pl-4 space-y-0.5">
                          <li>Credit history and credit score;</li>
                          <li>Criminal history;</li>
                          <li>Eviction records;</li>
                          <li>Previous residences;</li>
                          <li>Employment and education history; and</li>
                          <li>Driving records and other public records.</li>
                        </ul>
                        <p className="mt-1">
                          This Authorization is valid for purposes of verifying information pursuant to leasing and any other lawful purpose covered under the Fair Credit Reporting Act.
                        </p>
                        <p>This Authorization shall be valid in original or copy form.</p>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold mb-1">2. Purpose of Screening</h4>
                        <p>
                          I understand that this information is collected for the sole purpose of evaluating my qualifications to rent a property listed on the Matchbook LLC platform. The results of this screening may impact whether I am matched with a host.
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold mb-1">3. Limited Sharing of Results</h4>
                        <p>
                          Matchbook LLC may share a general summary of my credit standing (e.g., &quot;Excellent,&quot; &quot;Good,&quot; &quot;Fair,&quot; &quot;Poor&quot;) with hosts to help them evaluate my application. My full report will not be shared with property owners or managers.
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold mb-1">4. Confidentiality</h4>
                        <p>
                          Matchbook LLC agrees to handle my information with care and in accordance with applicable privacy laws. My report will not be sold or disclosed to any third party except as explicitly stated in this consent or as required by law.
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold mb-1">5. Your Rights Under the Fair Credit Reporting Act (FCRA)</h4>
                        <p className="mb-1">I understand I have the right to:</p>
                        <ul className="list-disc pl-4 space-y-0.5">
                          <li>Obtain a free copy of my report from the screening agency used;</li>
                          <li>Dispute inaccurate or incomplete information directly with the consumer reporting agency; and</li>
                          <li>Request the name and contact information of the third-party agency used for screening.</li>
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold mb-1">6. Release of Liability</h4>
                        <p>
                          I release Matchbook LLC, its agents, its affiliates, its representatives, and any third parties providing the reports from liability related to the lawful collection and use of this information, except in cases where such liability arises from Matchbook LLC, its agents, its affiliates, or any third parties&apos; violation of the Fair Credit Reporting Act or other applicable law.
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold mb-1">7. Consent Period</h4>
                        <p>
                          I understand that this report is valid for up to 90 days and may be reused for additional applications submitted to Matchbook LLC during that time.
                        </p>
                      </div>
                      
                      <div className="border-t pt-3 mt-3">
                        <p className="font-medium">
                          By signing this form, I confirm that I have read and understand the above terms. I consent to the screening and limited sharing of my information as described. I consent to the release of liability as described.
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
              
              <div className="flex items-center justify-center space-x-2 mb-4">
                <Checkbox 
                  id="approval-checkbox"
                  checked={approvalChecked}
                  onCheckedChange={(checked) => setApprovalChecked(checked === true)}
                />
                <label 
                  htmlFor="approval-checkbox" 
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  I authorize MatchBook LLC to obtain credit reports and background checks as described in the Credit Report and Background Check Authorization Form
                </label>
              </div>
              
              <div className="flex justify-center">
                {hasPurchase ? (
                  <Button 
                    type="submit" 
                    className="px-8 py-6 text-lg bg-green-600 hover:bg-green-700 text-white"
                    disabled={isSubmitting || !approvalChecked}
                  >
                    {isSubmitting ? "Submitting..." : "Submit Verification Request"}
                  </Button>
                ) : (
                  <Button 
                    type="submit" 
                    className="px-8 py-6 text-lg bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={isSubmitting || !approvalChecked}
                  >
                    Continue to Payment - $25.00
                  </Button>
                )}
              </div>
              
              <div className="text-center text-sm text-gray-500 mt-4">
                <p>Your personal information is securely transmitted and processed according to industry standards.</p>
                <p>Background checks are performed by our trusted partner Accio Data, Inc.</p>
              </div>
            </>
          )}
        </form>
      </Form>
    </div>
  )
}
