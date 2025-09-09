'use client';

import { MatchWithRelations } from '@/types';

interface CompleteClientProps {
  match: MatchWithRelations;
  matchId: string;
  isAdminDev?: boolean;
}

export function CompleteClient({ match, matchId, isAdminDev = false }: CompleteClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [hidePaymentMethods, setHidePaymentMethods] = useState(false);
  const [selectedPaymentMethodType] = useState<string | undefined>(match.stripePaymentMethodId ? 'card' : undefined);

  const paymentDetails = calculatePayments({
    listing: match.listing,
    trip: match.trip,
    monthlyRentOverride: match.monthlyRent
  });

  const calculateProRatedRent = () => {
    const startDate = new Date(match.trip.startDate);
    const monthlyRent = paymentDetails.totalMonthlyRent;
    const daysInMonth = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0).getDate();
    const daysFromStart = daysInMonth - startDate.getDate() + 1;
    const proRatedAmount = (monthlyRent * daysFromStart) / daysInMonth;
    return Math.round(proRatedAmount * 100) / 100;
  };

  const getPaymentBreakdown = (paymentMethodType?: string) => {
    const proRatedRent = calculateProRatedRent();
    const securityDeposit = paymentDetails.totalDeposit;
    const subtotalBeforeFees = proRatedRent + securityDeposit;
    const applicationFee = Math.round(subtotalBeforeFees * 0.03 * 100) / 100;
    
    let processingFee = 0;
    let total = subtotalBeforeFees + applicationFee;
    
    if (paymentMethodType === 'card') {
      const subtotalWithAppFee = subtotalBeforeFees + applicationFee;
      const totalWithCardFee = ((subtotalWithAppFee + 0.30) / (1 - 0.029));
      processingFee = Math.round((totalWithCardFee - subtotalWithAppFee) * 100) / 100;
      total = Math.round(totalWithCardFee * 100) / 100;
    }
    
    return {
      proRatedRent,
      securityDeposit,
      applicationFee,
      processingFee,
      total
    };
  };

  const calculatePaymentAmount = (paymentMethodType?: string) => {
    return getPaymentBreakdown(paymentMethodType).total;
  };

  const generateRentPayments = (
    monthlyRent: number,
    startDate: Date,
    endDate: Date,
    actualPaymentAmount: number
  ) => {
    const payments: { amount: number; dueDate: Date; description: string }[] = [];
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    let currentDate = new Date(start.getFullYear(), start.getMonth(), 1);
    let isFirstPayment = true;
    
    // If booking starts after the 1st, add a pro-rated payment
    if (start.getDate() > 1) {
      const daysInMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
      const daysFromStart = daysInMonth - start.getDate() + 1;
      const proRatedAmount = Math.round((monthlyRent * daysFromStart) / daysInMonth);
      
      const finalAmount = Math.max(0, proRatedAmount - actualPaymentAmount);
      
      if (finalAmount > 0) {
        payments.push({
          amount: finalAmount,
          dueDate: start,
          description: `Pro-rated rent (${daysFromStart} days) - $${actualPaymentAmount.toFixed(2)} paid at booking`
        });
      }
      
      isFirstPayment = false;
      currentDate = new Date(start.getFullYear(), start.getMonth() + 1, 1);
    }
    
    // Generate monthly payments
    while (currentDate <= end) {
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      if (monthEnd > end && end.getDate() < monthEnd.getDate()) {
        const daysInMonth = monthEnd.getDate();
        const daysToEnd = end.getDate();
        const proRatedAmount = Math.round((monthlyRent * daysToEnd) / daysInMonth);
        
        payments.push({
          amount: proRatedAmount,
          dueDate: currentDate,
          description: `Pro-rated rent (${daysToEnd} days)`
        });
      } else {
        let paymentAmount = monthlyRent;
        let description = 'Monthly rent';
        
        if (isFirstPayment) {
          paymentAmount = Math.max(0, monthlyRent - actualPaymentAmount);
          description = `Monthly rent - $${actualPaymentAmount.toFixed(2)} paid at booking`;
          isFirstPayment = false;
        }
        
        if (paymentAmount > 0) {
          payments.push({
            amount: paymentAmount,
            dueDate: currentDate,
            description: description
          });
        }
      }
      
      currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    }
    
    return payments;
  };

  const handleViewLease = async () => {
    if (!match.leaseDocumentId) {
      toast({
        title: "Error",
        description: "Lease document not available",
        variant: "destructive",
      });
      return;
    }
    window.open(`/api/documents/${match.leaseDocumentId}/view`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-4 pb-24">
        {/* Step Progress Bar */}
        <div className="mb-8">
          <StepProgress 
            currentStep={3}
            totalSteps={3}
            labels={["Review and sign lease agreement", "Review and pay", "Confirmation"]}
            className='w-full max-w-2xl'
          />
        </div>

        {/* Admin Debug Panel */}
        {isAdminDev && (
          <div className="mb-6">
            <AdminDebugPanel 
              match={match}
              matchId={matchId}
              isAdminDev={isAdminDev}
              onHidePaymentMethods={() => setHidePaymentMethods(true)}
            />
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="w-5 h-5" />
                  Property Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900">{match.listing.locationString}</h3>
                  <p className="text-sm text-gray-600">{match.listing.propertyType}</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <span className="font-semibold">${paymentDetails.totalMonthlyRent}/month</span>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Check-in</p>
                    <p className="font-medium">{new Date(match.trip.startDate).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-red-600" />
                  <div>
                    <p className="text-sm text-gray-600">Check-out</p>
                    <p className="font-medium">{new Date(match.trip.endDate).toLocaleDateString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="space-y-6">
              {/* Completion Header */}
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Booking Complete!
                </h3>
                <p className="text-gray-600 mb-6">
                  Your lease has been signed and payment has been completed. Welcome to your new home!
                </p>
                <div className="flex gap-3 justify-center">
                  <Button 
                    onClick={handleViewLease}
                    variant="outline"
                    size="lg"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    View Lease
                  </Button>
                  <Button 
                    onClick={() => router.push('/app/dashboard')}
                    size="lg"
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Go to Dashboard
                  </Button>
                </div>
              </div>

              {/* Payment Receipt */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <h4 className="font-semibold text-green-900">Payment Receipt</h4>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-green-700">Pro-rated Rent</span>
                    <span className="font-medium text-green-900">${getPaymentBreakdown(selectedPaymentMethodType).proRatedRent.toFixed(2)}</span>
                  </div>
                  <div className="text-xs text-green-600 mt-1 ml-4">
                    * Partial payment for move-in month
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-green-700">Security Deposit</span>
                    <span className="font-medium text-green-900">${getPaymentBreakdown(selectedPaymentMethodType).securityDeposit.toFixed(2)}</span>
                  </div>
                  <div className="text-xs text-green-600 mt-1 ml-4">
                    * Refundable at lease end
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-green-700">Application Fee (3%)</span>
                    <span className="font-medium text-green-900">${getPaymentBreakdown(selectedPaymentMethodType).applicationFee.toFixed(2)}</span>
                  </div>
                  {selectedPaymentMethodType === 'card' && getPaymentBreakdown(selectedPaymentMethodType).processingFee > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm text-green-700">Processing Fee</span>
                      <span className="font-medium text-green-900">${getPaymentBreakdown(selectedPaymentMethodType).processingFee.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-green-300 pt-2 font-semibold">
                    <span className="text-green-900">Total Paid</span>
                    <span className="text-green-900">${calculatePaymentAmount(selectedPaymentMethodType).toFixed(2)}</span>
                  </div>
                  <div className="mt-4 pt-4 border-t border-green-300">
                    <p className="text-xs text-green-700">
                      Payment processed on {new Date().toLocaleDateString()} • Transaction ID: {match.stripePaymentMethodId || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Future Payments Schedule */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <h4 className="font-semibold text-blue-900">Your Rent Payment Schedule</h4>
                </div>
                {(() => {
                  const startDate = new Date(match.trip.startDate);
                  const endDate = new Date(match.trip.endDate);
                  const monthlyRent = paymentDetails.totalMonthlyRent;
                  
                  if (!monthlyRent || !startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                    return (
                      <div className="text-sm text-blue-700 py-2">
                        Payment schedule will be available after lease details are finalized.
                      </div>
                    );
                  }
                  
                  const payments = generateRentPayments(monthlyRent, startDate, endDate, calculateProRatedRent());
                  
                  if (payments.length === 0) {
                    return (
                      <div className="text-sm text-blue-700 py-2">
                        No additional rent payments scheduled.
                      </div>
                    );
                  }
                  
                  const totalRent = payments.reduce((sum, payment) => sum + payment.amount, 0);
                  
                  return (
                    <div className="space-y-3">
                      {payments.map((payment, index) => (
                        <div key={index} className="flex justify-between items-center py-3 px-4 bg-white rounded-lg border border-blue-200">
                          <div>
                            <p className="text-sm font-medium text-blue-900">{payment.description}</p>
                            <p className="text-xs text-blue-600">
                              Due: {payment.dueDate.toLocaleDateString()}
                            </p>
                          </div>
                          <span className="font-medium text-blue-900">
                            ${payment.amount.toLocaleString()}
                          </span>
                        </div>
                      ))}
                      <div className="mt-4 pt-4 border-t border-blue-300 bg-blue-100 rounded-lg px-4 py-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-semibold text-blue-900">Total Rent Due</span>
                          <span className="font-bold text-blue-900">${totalRent.toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-blue-700 mt-1">
                          {payments.length} payment{payments.length !== 1 ? 's' : ''} over {Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44))} months
                        </p>
                      </div>
                      <div className="mt-3 pt-3 border-t border-blue-300">
                        <p className="text-xs text-blue-700">
                          💳 These payments will be automatically charged to your saved payment method on the due dates above.
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Host Contact Information */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <User className="w-5 h-5 text-gray-600" />
                  <h4 className="font-semibold text-gray-900">Your Host Contact</h4>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">
                      {match.listing.user?.firstName} {match.listing.user?.lastName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{match.listing.user?.email}</span>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-300">
                    <p className="text-xs text-gray-500">
                      📞 Contact your host for any questions about the property, move-in instructions, or lease terms.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}