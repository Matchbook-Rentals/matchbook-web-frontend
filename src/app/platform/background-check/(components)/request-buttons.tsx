'use client'
import { useState, useEffect } from "react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useUser } from "@clerk/nextjs"
import { getPersonReports } from "@/app/actions/person-reports"

interface ApiRequestButtonsProps {
  creditBucket: string | null;
  creditTime?: Date;
}

export function ApiRequestButtons({ creditBucket, creditTime }: ApiRequestButtonsProps) {
  const { user } = useUser()
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    ssn: "",
    date_of_birth: "",
  })
  const [personReport, setPersonReport] = useState(null)
  const [criminalData, setCriminalData] = useState(null)
  const [creditScoreBucket, setCreditScoreBucket] = useState(creditBucket);
  const [creditUpdatedAt, setCreditUpdatedAt] = useState<string | null>(creditTime ? creditTime.toLocaleString() : null);

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

  const handleCredit = async () => {
    try {
      const response = await fetch('/api/background-check/credit-score/isoftpull', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      const { name, result } = data.creditData.intelligence
      if (name && result === 'passed') {
        setCreditScoreBucket(name);
        setCreditUpdatedAt(new Date().toLocaleString());
      }
      console.log('Credit Score Data:', data);
      // You may want to add state to display the credit score results
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get credit score');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to perform credit check');
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-center text-lg font-medium">
        Fill out the form and click each button to complete the verification process
      </p>
      <form className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="first_name">First Name</Label>
            <Input
              id="first_name"
              name="first_name"
              value={formData.first_name}
              onChange={handleInputChange}
              required
            />
          </div>
          <div>
            <Label htmlFor="last_name">Last Name</Label>
            <Input
              id="last_name"
              name="last_name"
              value={formData.last_name}
              onChange={handleInputChange}
              required
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
            <Label htmlFor="date_of_birth">Date of Birth</Label>
            <Input
              id="date_of_birth"
              name="date_of_birth"
              type="date"
              value={formData.date_of_birth}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <Label htmlFor="ssn">SSN</Label>
            <Input
              id="ssn"
              name="ssn"
              value={formData.ssn}
              onChange={handleInputChange}
            />
          </div>
        </div>
      </form>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-xl font-semibold text-center">Credit Check</h3>
            {creditScoreBucket && (
              <>
                <p className="text-center mt-2">{creditScoreBucket.replace('_', ' ')}</p>
                <p className="text-center mt-2">{creditUpdatedAt}</p>
              </>
            )}
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
