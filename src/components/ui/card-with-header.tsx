import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import clsx from 'clsx';

interface ComponentProps {
  title: string;
  content: React.ReactNode;
  className?: string;
}

export default function Component({ title, content, className }: ComponentProps) {
  return (
    <Card className={clsx("w-full max-w-[100%] mx-auto shadow-lg", className)}>
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-gray-800">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md p-4 shadow-sm">
          {content}
        </div>
      </CardContent>
    </Card>
  )
}