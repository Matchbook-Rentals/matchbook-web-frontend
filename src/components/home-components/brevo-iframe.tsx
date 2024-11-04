import React, { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const SubscriptionForm = () => {
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    countryCode: '+1',
    interest: ''
  });

  const [status, setStatus] = useState({
    message: '',
    type: '' // 'success' or 'error'
  });

  const validateEmail = (email) => {
    return email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  };

  const validatePhone = (phone) => {
    return phone.match(/^\d{10}$/);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!validateEmail(formData.email)) {
      setStatus({
        message: 'Please enter a valid email address',
        type: 'error'
      });
      return;
    }

    if (formData.phone && !validatePhone(formData.phone)) {
      setStatus({
        message: 'Please enter a valid 10-digit phone number',
        type: 'error'
      });
      return;
    }

    if (!formData.interest) {
      setStatus({
        message: 'Please select an interest option',
        type: 'error'
      });
      return;
    }

    try {
      const response = await fetch('/api/brevo/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const responseData = await response.json();
      console.log(responseData)
      if (!response.ok) throw new Error(responseData.error?.message || 'Subscription failed');

      setStatus({
        message: 'Successfully subscribed! We\'ll keep you updated.',
        type: 'success'
      });

      // Reset form
      setFormData({
        email: '',
        phone: '',
        countryCode: '+1',
        interest: ''
      });

      // iS this the correct way to log an error
    } catch (error: any) {
      setStatus({
        message: `Something went wrong: ${error}`,
        type: 'error'
      });
    }
  };

  return (
    <div className="w-full mx-auto rounded-lg">
      <h2 className="text-xl font-semibold mb-6">Sign up to stay up to date on launch details.</h2>

      {/* Status Message Above Form */}
      {status.message && (
        <Alert className={`${status.type === 'error' ? 'bg-red-50' : 'bg-green-50'} mb-6`}>
          <AlertDescription>
            {status.message}
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email Subscription */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Subscribe for email updates<span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            className="w-full px-3 py-2 border rounded-md"
            placeholder="e.g abc@xyz.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
        </div>

        {/* Text Subscription */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Subscribe for text updates
          </label>
          <div className="flex gap-2">
            <select
              className="w-20 px-2 py-2 border rounded-md"
              value={formData.countryCode}
              onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
            >
              <option value="+1">+1</option>
              <option value="+44">+44</option>
              <option value="+61">+61</option>
            </select>
            <input
              type="tel"
              className="flex-1 px-3 py-2 border rounded-md"
              placeholder="Phone number"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
        </div>

        {/* Interest Selection */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Which are you interested in?<span className="text-red-500">*</span>
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="interest"
                value="renting"
                checked={formData.interest === 'renting'}
                onChange={(e) => setFormData({ ...formData, interest: e.target.value })}
                className="mr-2"
              />
              Renting
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="interest"
                value="hosting"
                checked={formData.interest === 'hosting'}
                onChange={(e) => setFormData({ ...formData, interest: e.target.value })}
                className="mr-2"
              />
              Hosting
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="interest"
                value="both"
                checked={formData.interest === 'both'}
                onChange={(e) => setFormData({ ...formData, interest: e.target.value })}
                className="mr-2"
              />
              Both
            </label>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-center">
          <button
            type="submit"
            className="w-1/2 bg-primaryBrand/80 text-white py-2 px-4 rounded-md hover:bg-primaryBrand transition-colors"
          >
            SUBSCRIBE
          </button>
        </div>

        {/* Status Message */}
        {status.message && (
          <Alert className={status.type === 'error' ? 'bg-red-50' : 'bg-green-50'}>
            <AlertDescription>
              {status.message}
            </AlertDescription>
          </Alert>
        )}
      </form>
    </div>
  );
};

export default SubscriptionForm;
