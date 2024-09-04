import React from 'react';
import { Button } from "@/components/ui/button";

interface UserTypeSelectorProps {
  userType: 'Landlord' | 'Tenant';
  setUserType: (type: 'Landlord' | 'Tenant') => void;
}

const UserTypeSelector: React.FC<UserTypeSelectorProps> = ({ userType, setUserType }) => (
  <div className="flex justify-center space-x-4 p-4">
    <Button
      variant={userType === 'Landlord' ? 'default' : 'outline'}
      onClick={() => setUserType('Landlord')}
    >
      Landlord
    </Button>
    <Button
      variant={userType === 'Tenant' ? 'default' : 'outline'}
      onClick={() => setUserType('Tenant')}
    >
      Tenant
    </Button>
  </div>
);

export default UserTypeSelector;