export default function RentEasyCopy() {
  let blackLineStyle = "w-2/5 h-[2px] bg-black"
  return (
    <div className="flex w-[100vw] my-10 items-center justify-center py-8">
      <div className="flex w-full space-x-4 items-center justify-between">
        <div className={blackLineStyle} />
        <div className="text-center pl-3 w-3/5 text-[32px] font-semibold font-lora text-black leading-normal">
          <p>Renting shouldn&apos;t be so hard.</p>
          <p>Now, it doesn&apos;t have to be.</p>
        </div>
        <div className={blackLineStyle} />
      </div>
    </div>
  )
}
