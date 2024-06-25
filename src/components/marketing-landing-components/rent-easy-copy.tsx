export default function RentEasyCopy() {
  let blackLineStyle = "w-1/5 h-[2px] bg-black"
  return (
    <div className="flex w-full items-center justify-center py-8">
      <div className="flex w-[90%] space-x-4 items-center justify-between">
        <div className={blackLineStyle} />
        <div className="text-left pl-3  w-3/5  text-5xl font-semibold text-gray-800">
          <p>Renting shouldn&apos;t be so hard.</p>
          <p>Now, it doesn&apos;t have to be.</p>
        </div>
        <div className={blackLineStyle} />
      </div>
    </div>
  )
}