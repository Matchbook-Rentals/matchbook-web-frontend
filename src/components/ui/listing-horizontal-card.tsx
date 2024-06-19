import { Badge } from "@/components/ui/badge"

interface ListingHorizontalCardProps {
  imgSrc: string;
  title: string;
  status: string;
  address: string;
}

export default function ListingHorizontalCard({ imgSrc, title, status, address }: ListingHorizontalCardProps) {
  return (
    <div className="flex max-w-[675px] max-h-[135px] border-2 border-gray-300 rounded-md overflow-hidden">
      <img src={imgSrc} alt="House" className="w-1/2 object-cover" />
      <div className="flex flex-col justify-center p-4 w-1/2">
        <h2 className="text-3xl text-center ">{address.slice(0, address.indexOf(','))}</h2>
        {/* <p className="mt-2 text-center">{address}</p> */}
        <div className="mt-4 flex justify-end">
          <Badge className="bg-primaryBrand text-black text-md font-bold rounded-none px-2 py-1">{status.toUpperCase()}</Badge>
        </div>
      </div>
    </div>
  )
}