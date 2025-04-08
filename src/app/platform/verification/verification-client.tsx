"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { useForm } from "react-hook-form"
import Image from "next/image"
import { 
  verificationSchema, 
  type VerificationFormValues,
} from "./utils"

export default function VerificationClient() {
  const [showForm, setShowForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<VerificationFormValues>({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      ssn: "",
      dob: "",
      address: "",
      city: "",
      state: "",
      zip: "",
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

  async function onSubmit(data: VerificationFormValues) {
    setIsSubmitting(true);
    setApiResponse(null);
    setErrorMessage(null);
    setErrorDetails(null);
    setShowErrorDetails(false);
    
    try {
      console.log("Submitting verification request...");
      
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
  }

  // Initial welcome screen
  if (!showForm) {
    return (
      <div className="grid md:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
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
      <p className="text-center mb-6 text-gray-600">
        This screening includes both National Criminal History Search and Evictions & Property Damage Check
      </p>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
                        placeholder="123456789" 
                        type="password" 
                        {...field} 
                        maxLength={9}
                        onInput={(e) => {
                          // Force numbers only
                          const target = e.target as HTMLInputElement;
                          target.value = target.value.replace(/\D/g, '').slice(0, 9);
                          field.onChange(target.value);
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
                
                {/* Developer testing section - would be removed in production */}
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
              <div className="flex justify-center mt-8">
                <Button 
                  type="submit" 
                  className="px-8 py-6 text-lg bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Processing..." : "Submit Verification Request - $25.00"}
                </Button>
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