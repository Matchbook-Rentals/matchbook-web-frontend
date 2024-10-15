export default function RentEasyCopy() {
  let blackLineStyle = "w-1/5 h-[2px] bg-black hidden sm:block"
  return (
    <div className="flex w-full my-5 sm:my-10 items-center justify-center py-4 sm:py-8">
      <div className="flex w-full sm:w-[90%] px-4 sm:px-0 space-x-0 sm:space-x-4 items-center justify-between">
        <div className={blackLineStyle} />
        <div className="text-center w-full sm:w-3/5 text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold text-gray-800">
          <p>Renting shouldn&apos;t be so hard.</p>
          <p>Now, it doesn&apos;t have to be.</p>
        </div>
        <div className={blackLineStyle} />
      </div>
    </div>
  )
}
