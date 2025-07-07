import { SignUp } from "@clerk/nextjs";

const styles = {
  container: {
    minHeight: '100vh',
    margin: 0,
    padding: 0
  }
};

const clerkStyles = `
  html, body {
    margin: 0 !important;
    padding: 0 !important;
  }
  .cl-socialButtonsBlockButton {
    width: 95%;
    display: grid;
    grid-template-columns: 22px 1fr 22px;
  }
  .cl-socialButtonsBlockButton > span {
    display: contents;
  }
  .cl-socialButtonsBlockButton > span > span:has(img) {
    justify-self: start;
  }
  .cl-socialButtonsBlockButton > span > span:has(img) img {
    width: 22px;
  }
  .cl-socialButtonsBlockButtonText {
    justify-self: center;
    text-align: center;
    color: #281d1b;
  }
  .cl-socialButtonsBlockButton::after {
    content: "";
  }
  .cl-socialButtons {
    display: flex;
    flex-direction: column;
    row-gap: 25px;
    align-items: center;
  }
  .cl-card {
    padding: 5px;
    background: var(--background);
    border-bottom: none;
    box-shadow: none;
  }
  .cl-cardBox {
    background: white !important;
    opacity: 1 !important;
    backdrop-filter: none !important;
    background-color: white !important;
    box-shadow: 0px 4px 12px 0px rgba(0, 0, 0, 0.15) !important;
    border: none;
  }
  @media (min-width: 768px) {
    .cl-cardBox {
      padding: 24px !important;
    }
  }
  .cl-header {
    padding: 0 0px;
    width: fit-content;
    margin: 0 auto;
  }
  .cl-logoImage {
    height: 31px;
  }
  .cl-headerTitle {
    color: #281d1b;
    text-align: center;
    font-family: Poppins;
    font-size: 28px;
    font-style: normal;
    font-weight: 500;
    line-height: 32px;
    letter-spacing: -0.56px;
  }
  .cl-headerSubtitle {
    color: #281d1b;
    text-align: right;
    font-family: Poppins;
    font-size: 15px;
    font-style: normal;
    font-weight: 400;
    line-height: 20px;
    letter-spacing: -0.075px;
  }
  .cl-formButtonPrimary {
    border: none !important;
    border-radius: 8px;
    outline: none;
    background: #0B6E6E;
    margin: 0 auto;
    padding: 8px 16px;
    color: #ffffff !important;
    box-shadow: none !important;
  }
  .cl-formButtonPrimary:hover {
    background: #0B6E6Ecc;
  }
  .cl-formFieldInput {
    border-radius: 8px;
  }
  .cl-buttonArrowIcon {
    display: none;
  }
  .cl-footer {
    background: var(--background);
  }
  .cl-footerAction {
    background: var(--background);
    width: 100%;
    display: flex;
    justify-content: center;
  }
  .cl-footerActionText {
    background: var(--background);
  }
  .cl-footerActionLink {
    background: var(--background);
  }
  @media (max-width: 767px) {
    .cl-logoImage,
    .cl-logoBox {
      display: none !important;
    }
    .cl-cardBox {
      box-shadow: none !important;
    }
    body {
      background: white !important;
    }
  }
`;

export default function Page() {
  // Redirect to /terms after sign-up.
  // The /terms page should handle the agreement process
  // and then redirecting to the final destination (e.g., /platform/trips).

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: clerkStyles }} />
      <div className="relative w-full mx-auto overflow-y-auto" style={styles.container}>
      {/* Mobile image at very top */}
      <img className=" object-cover w-full h-[200px] object-bottom block md:hidden z-0" src="/auth/4.png" alt="Matchbook sign up" />
      
      {/* Form container */}
      <div className="flex justify-center items-center w-full relative z-10  pt-8">
        <SignUp />
      </div>
      
      {/* Background gradient for desktop only */}
      <div className="absolute w-[100vw] h-[65vh] bottom-0 left-0 pointer-events-none hidden md:block">
        <img 
          src="/auth/3.png" 
          alt="Background gradient" 
          className="w-full h-full object-cover object-top"
        />
      </div>
      </div>
    </>
  )
}
