import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, Car, Wifi, FileText, Calendar, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function DemoMoveInInstructionsPage() {
  const instructions = [
    {
      icon: Home,
      title: "Property Access",
      content: "The front door has a smart lock. Your access code is 1234#. To enter, press the code followed by the # key. The lock will beep twice and the light will turn green. If you have any issues, there's a spare key in the lockbox on the back porch - the lockbox code is 5678.\n\nGarage access: Use the keypad on the right side of the garage door. Your code is the same as the front door (1234#)."
    },
    {
      icon: Car,
      title: "Parking",
      content: "You have two assigned parking spaces in the driveway - the two spots closest to the house. Street parking is also available if you have additional vehicles.\n\nPlease do not park in front of the neighbor's driveway (the house with the red door). They're very particular about it!\n\nIf you need to park a trailer or RV, please use the extended parking area on the left side of the property."
    },
    {
      icon: Wifi,
      title: "WiFi",
      content: "Network Name: HomeAway_Guest_5G\nPassword: WelcomeHome2025!\n\nFor best performance, connect to the 5G network. The router is located in the living room closet if you need to restart it.\n\nWe have high-speed fiber internet (1 Gbps) so feel free to stream, work remotely, or game without any worries about bandwidth."
    },
    {
      icon: FileText,
      title: "Other Notes",
      content: "Welcome to your home away from home! Here are a few things to know:\n\n• Trash pickup is every Tuesday morning - please put bins out Monday night\n• The thermostat is a Nest - feel free to adjust to your comfort\n• All linens and towels are provided in the hallway closet\n• Coffee maker, pots/pans, and dishes are fully stocked in the kitchen\n• Check-out time is 11 AM - please start the dishwasher before you leave\n\nLocal recommendations:\n• Best coffee: Blue Bottle Coffee (5 min drive)\n• Groceries: Whole Foods (10 min drive)\n• Emergency contacts are on the fridge\n\nEnjoy your stay!"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[800px] mx-auto px-6 py-8">
        {/* Back Button */}
        <Link href="/newnew/demo">
          <Button
            variant="outline"
            className="mb-6 border-teal-600 text-teal-600 hover:bg-teal-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Demo
          </Button>
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">
            Move-In Instructions
          </h1>
          <p className="text-gray-600">
            Everything you need to know for your move-in
          </p>
        </div>

        {/* Property Info Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl">Property Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Home className="w-5 h-5 text-gray-600 mt-0.5" />
              <div>
                <div className="font-medium text-gray-900">Luxury Home with Golden Gate Bridge View</div>
                <div className="text-gray-600 text-sm">3024 N 1400 E North Ogden, UT 84414</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gray-600 mt-0.5" />
              <div>
                <div className="font-medium text-gray-900">Move-In Date</div>
                <div className="text-gray-600 text-sm">Thursday, June 12, 2025</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-gray-600 mt-0.5" />
              <div>
                <div className="font-medium text-gray-900">Host Contact</div>
                <div className="text-gray-600 text-sm">Daniel Resner</div>
                <div className="text-gray-600 text-sm">(555) 123-4567</div>
                <div className="text-gray-600 text-sm">daniel@example.com</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instructions Cards */}
        <div className="space-y-6">
          {instructions.map((instruction, index) => {
            const Icon = instruction.icon;
            return (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Icon className="w-5 h-5 text-teal-600" />
                    {instruction.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {instruction.content}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Contact Host CTA */}
        <Card className="mt-6 bg-teal-50 border-teal-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-gray-700 mb-4">
                Have questions about your move-in?
              </p>
              <a href="mailto:daniel@example.com">
                <Button className="bg-teal-600 hover:bg-teal-700 text-white">
                  Contact Daniel Resner
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
