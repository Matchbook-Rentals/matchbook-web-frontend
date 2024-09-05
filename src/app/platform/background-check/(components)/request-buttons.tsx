'use client'
import { useState, useEffect } from "react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useUser } from "@clerk/nextjs"
import { getPersonReports } from "@/app/actions/person-reports"

export function ApiRequestButtons() {
  const { user } = useUser()
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    middleName: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    dob: "",
    phoneNumber: "",
    email: "",
  })
  const [personReport, setPersonReport] = useState(null)
  const [criminalData, setCriminalData] = useState(null)

  useEffect(() => {
    if (user) {
      fetchPersonReport()
    }
  }, [user])

  const fetchPersonReport = async () => {
    if (user) {
      const report = await getPersonReports(user.id)
      setPersonReport(report)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleBackgroundCheck = async (type: string) => {
    try {
      let endpoint = '';
      switch (type) {
        case 'Criminal':
          endpoint = '/api/background-check/criminal-records';
          break;
        case 'Bankruptcy':
          endpoint = '/api/background-check/people-search';
          break;
        default:
          alert(`${type} check not implemented yet`);
          return;
      }

      const response = await fetch(endpoint, {
        method: type === 'Criminal' ? 'GET' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: type === 'Criminal' ? undefined : JSON.stringify(formData),
      });
      const data = await response.json();

      if (type === 'Criminal') {
        setCriminalData(data);
      } else {
        console.log(data); // Handle other responses as needed
      }
    } catch (error) {
      console.error('Error:', error);
      alert(`Failed to perform ${type.toLowerCase()} check`);
    }
  };

  const handleCriminal = async () => {
    try {
      const response = await fetch('/api/background-check/criminal-records', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      console.log('PARSED RESPONSE', data)
      console.log('RESPONSE', response)
      setCriminalData(data);
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to perform criminal check');
    }
  };

  const handleBankruptcy = async () => {
    try {
      const response = await fetch('/api/background-check/people-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      setPersonReport(data); // Save the response to personReport state
      console.log('People Search Endpoint', data); // Optional: keep this for debugging if needed
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to perform bankruptcy check');
    }
  };

  const handleCredit = () => {
    alert('Credit check not implemented yet');
  };

  return (
    <div className="space-y-4">
      <p className="text-center text-lg font-medium">
        Fill out the form and click each button to complete the verification process
      </p>
      <form className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              required
            />
          </div>
          <div>
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              required
            />
          </div>
          <div>
            <Label htmlFor="middleName">Middle Name</Label>
            <Input
              id="middleName"
              name="middleName"
              value={formData.middleName}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              name="city"
              value={formData.city}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <Label htmlFor="state">State</Label>
            <Input
              id="state"
              name="state"
              value={formData.state}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <Label htmlFor="zip">ZIP Code</Label>
            <Input
              id="zip"
              name="zip"
              value={formData.zip}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <Label htmlFor="dob">Date of Birth</Label>
            <Input
              id="dob"
              name="dob"
              type="date"
              value={formData.dob}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Input
              id="phoneNumber"
              name="phoneNumber"
              type="tel"
              value={formData.phoneNumber}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
            />
          </div>
        </div>
      </form>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-xl font-semibold text-center">Credit Check</h3>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={handleCredit}>
              Get Credit
            </Button>
          </CardFooter>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-xl font-semibold text-center">Criminal Check</h3>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={handleCriminal}>
              Get Criminal
            </Button>
          </CardFooter>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-xl font-semibold text-center">Bankruptcy Check</h3>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={handleBankruptcy}>
              Get Bankruptcy
            </Button>
          </CardFooter>
        </Card>
      </div>
      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Person Report</h2>
        {personReport ? (
          <div className="border p-4 rounded-md">
            <p><strong>Name:</strong> {personReport.firstName} {personReport.lastName}</p>
            {personReport.dateOfBirth && <p><strong>Date of Birth:</strong> {personReport.dateOfBirth}</p>}
            {personReport.reportToken && <p><strong>Report Token:</strong> {personReport.reportToken}</p>}
            <p><strong>Bankruptcies:</strong> {personReport.bankruptcies ?? 'N/A'}</p>
            <p><strong>Judgements:</strong> {personReport.judgements ?? 'N/A'}</p>
            <p><strong>Liens:</strong> {personReport.liens ?? 'N/A'}</p>
            {personReport.isSexOffender !== undefined && (
              <p><strong>Sex Offender:</strong> {personReport.isSexOffender ? 'Yes' : 'No'}</p>
            )}
            {personReport.city && <p><strong>City:</strong> {personReport.city}</p>}
            {personReport.state && <p><strong>State:</strong> {personReport.state}</p>}
          </div>
        ) : (
          <p>No report found.</p>
        )}
      </div>
      {criminalData && (
        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-4">Criminal Check Results</h2>
          <div className="border p-4 rounded-md">
            <pre>{JSON.stringify(criminalData, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  )
}
