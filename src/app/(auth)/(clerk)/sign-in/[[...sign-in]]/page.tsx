import { SignIn } from "@clerk/nextjs";
import Image from "next/image";

const styles = {
  authContainer: {
    height: '100vh',
    margin: 0,
    padding: 0,
    overflow: 'hidden'
  }
};

const clerkStyles = `
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
    border: none;
    box-shadow: none;
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
    body {
      overflow: hidden;
    }
  }
`;

export default function Page() {

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: clerkStyles }} />
      <div className="flex flex-col md:flex-row w-full mx-auto" style={styles.authContainer}>
      <div className="w-full md:w-0 lg:w-1/2 relative z-0 ">
        <Image 
          className="object-contain w-full max-h-[300px] md:h-screen object-bottom block md:hidden" 
          src="/auth/2.png" 
          alt="Matchbook sign in" 
          width={600}
          height={300}
          priority
        />
        <Image 
          className="object-cover w-full h-56 md:h-screen object-[80%] hidden md:block" 
          src="/auth/1.jpg" 
          alt="Matchbook sign in"
          width={800}
          height={600}
          priority
        />
      </div>
      <div className="flex justify-center items-center w-full lg:w-1/2  relative z-10 pt-6 md:mt-0">
        <SignIn />
      </div>
      </div>
    </>
  )
}
