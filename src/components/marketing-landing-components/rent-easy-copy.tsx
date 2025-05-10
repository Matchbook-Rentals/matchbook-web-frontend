export default function RentEasyCopy() {
  // Decorative elements
  const decorativeDividerStyle = " w-[0%] sm:w-[15%] md:w-1/4 lg:w-2/5 h-[2px] bg-black"

  // Container styles
  const sectionContainerStyle = "flex w-[100vw] items-center justify-center py-0"
  const contentWrapperStyle = "flex w-full space-x-2 md:space-x-4 items-center justify-between"

  // Typography styles
  const headingTextStyle = "text-center md:pl-3 w-auto lg:w-3/5 text-[24px] lg:text-[32px] font-semibold font-lora text-black leading-normal"

  return (
    <div className={sectionContainerStyle}>
      <div className={contentWrapperStyle}>
        <div className={decorativeDividerStyle} />
        <div className={headingTextStyle}>
          <p>Renting shouldn&apos;t be so hard.</p>
          <p>Now, it doesn&apos;t have to be.</p>
        </div>
        <div className={decorativeDividerStyle} />
      </div>
    </div>
  )
}
