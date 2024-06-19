import { Badge } from "@/components/ui/badge"

interface ListingHorizontalCardProps {
  imgSrc: string;
  title: string;
  status: string;
  address: string;
}

export default function ListingHorizontalCard({ imgSrc, title, status, address }: ListingHorizontalCardProps) {
  return (
    <div className="flex max-w-[750px] max-h-[200px] border-2 border-gray-500 rounded-md overflow-hidden">
      <img src={imgSrc} alt="House" className="w-1/2 object-cover" />
      <div className="flex flex-col justify-center p-4 w-1/2">
        <h2 className="text-2xl font-bold">{title}</h2>
        <p className="mt-2">{address}</p>
        <div className="mt-4">
          <Badge className="bg-gray-200 text-gray-800 px-4 py-2">{status}</Badge>
        </div>
      </div>
    </div>
  )
}