'use client'
import React from "react";
import '@/app/utils/animaStyles.css'
import MatchbookHeader from "@/components/marketing-landing-components/matchbook-header";

const WebHomePage = () => {
  return (
    <MatchbookHeader />
    // <>
    //   <div className="web-home-page border-red-500 border-2">
    //     <div className="overlap">
    //       <img
    //         className="depositphotos "
    //         alt="Depositphotos"
    //         src="paul-weaver-hero.jpg"
    //       />
    //       <img className="group" alt="Group" src="group-7.png" />
    //       <div className="group-wrapper">
    //         <div className="img-wrapper">
    //           <img className="img" alt="Group" src="group-9.png" />
    //         </div>
    //       </div>
    //       <div className="rectangle" />
    //       <p className="find-your-place-all">
    //         <span className="text-wrapper">
    //           Find your place, all in one place in:
    //           <br />
    //         </span>
    //         <span className="span">
    //           <br />
    //         </span>
    //       </p>
    //       <div className="days-hours-min-sec">
    //         days&nbsp;&nbsp;&nbsp;&nbsp; hours&nbsp;&nbsp;&nbsp;&nbsp;min&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;sec
    //       </div>
    //       <p className="element">
    //         <span className="text-wrapper-2">
    //           228&nbsp;&nbsp;&nbsp;&nbsp;02&nbsp;&nbsp;&nbsp;&nbsp;28&nbsp;&nbsp;&nbsp;&nbsp;56
    //           <br />
    //         </span>
    //         <span className="text-wrapper-3">
    //           <br />
    //         </span>
    //       </p>
    //     </div>
    //     <div className="overlap-group">
    //       <img className="screenshot" alt="Screenshot" src="screenshot-2024-01-22-at-6-18-22-PM.png" />
    //       <p className="div">explore our rental marketplace, reimagined with you in mind.</p>
    //     </div>
    //     <MatchbookHeader />
    //     <div className="overlap-wrapper">
    //       <div className="overlap-2">
    //         <div className="rectangle-2" />
    //         <div className="text-wrapper-8">Looking to rent?</div>
    //       </div>
    //     </div>
    //     <div className="group-3">
    //       <div className="overlap-3">
    //         <p className="text-wrapper-9">Find a place, all in one place.</p>
    //         <p className="p">
    //           Sick of clicking through tabs? Us too. Here, you can find a place you love on a singular website, with
    //           verified landlords.
    //         </p>
    //       </div>
    //       <div className="overlap-group-wrapper">
    //         <div className="overlap-group-3">
    //           <div className="text-wrapper-10">1</div>
    //         </div>
    //       </div>
    //     </div>
    //     <div className="group-4">
    //       <div className="overlap-4">
    //         <p className="text-wrapper-9">Swipe to find your perfect match.</p>
    //         <p className="text-wrapper-11">
    //           Swipe through places that match your preferences, and match with landlords who like your renting history
    //           back! It’s like online dating, but without a fear of commitment.
    //         </p>
    //       </div>
    //       <div className="overlap-group-wrapper">
    //         <div className="overlap-group-3">
    //           <div className="text-wrapper-10">2</div>
    //         </div>
    //       </div>
    //     </div>
    //     <div className="group-5">
    //       <div className="overlap-5">
    //         <div className="text-wrapper-12">One application, unlimited options.</div>
    //         <p className="text-wrapper-11">
    //           No more paying $50 fees just to be rejected; unless you’re into that kind of thing? With Matchbook, you fill
    //           out one application, for FREE. That’s it.
    //         </p>
    //       </div>
    //       <div className="overlap-group-wrapper">
    //         <div className="overlap-group-3">
    //           <div className="text-wrapper-10">3</div>
    //         </div>
    //       </div>
    //     </div>
    //     <div className="group-6">
    //       <div className="overlap-5">
    //         <div className="text-wrapper-12">Transparent pricing.</div>
    //         <p className="text-wrapper-11">
    //           Unlike those other renting websites (dare us to @ them?), what you see on the listing, is what you pay.
    //           We’re not here to play games.
    //         </p>
    //       </div>
    //       <div className="overlap-group-wrapper">
    //         <div className="overlap-group-3">
    //           <div className="text-wrapper-10">4</div>
    //         </div>
    //       </div>
    //     </div>
    //     <div className="group-7">
    //       <div className="overlap-5">
    //         <div className="text-wrapper-12">Rate your landlord.</div>
    //         <p className="text-wrapper-11">
    //           Why do landlords get to call your references but you can’t call theirs? Ring ring! Welcome to the future.
    //           You finally get to see what other renters thought of their stay.
    //         </p>
    //       </div>
    //       <div className="overlap-group-wrapper">
    //         <div className="overlap-group-3">
    //           <div className="text-wrapper-10">5</div>
    //         </div>
    //       </div>
    //     </div>
    //     <div className="group-8">
    //       <div className="overlap-2">
    //         <div className="rectangle-3" />
    //         <div className="text-wrapper-8">Looking to list?</div>
    //       </div>
    //     </div>
    //     <div className="group-9">
    //       <div className="overlap-6">
    //         <p className="text-wrapper-12">Manage your place, all in one place.</p>
    //         <p className="text-wrapper-13">
    //           No more listing on 4 different sites with the hopes of finding a good tenant. On Matchbook, list your
    //           property, match with renters, view applications, and manage your place on a singular website.
    //         </p>
    //       </div>
    //       <div className="overlap-group-wrapper">
    //         <div className="overlap-group-4">
    //           <div className="text-wrapper-10">1</div>
    //         </div>
    //       </div>
    //     </div>
    //     <div className="group-10">
    //       <div className="overlap-4">
    //         <div className="text-wrapper-9">List for free.</div>
    //         <p className="text-wrapper-11">
    //           List your property for free and pay only after your first booking. The fee? Only 1.5% of the first month’s
    //           rent.
    //         </p>
    //       </div>
    //       <div className="overlap-group-wrapper">
    //         <div className="overlap-group-4">
    //           <div className="text-wrapper-10">2</div>
    //         </div>
    //       </div>
    //     </div>
    //     <div className="group-11">
    //       <p className="connect-with">
    //         <span className="text-wrapper-14">Connect with </span>
    //         <span className="text-wrapper-15">Matchbook Verified</span>
    //         <span className="text-wrapper-14"> Tenants</span>
    //       </p>
    //       <p className="matchbook-verified">
    //         <span className="text-wrapper-16">Matchbook Verified </span>
    //         <span className="text-wrapper-14">
    //           tenants are pre-screened and ready to match! Matching with unverified tenants? Don’t worry. Enjoy seamless
    //           in-app screening.
    //         </span>
    //       </p>
    //       <div className="overlap-group-wrapper">
    //         <div className="overlap-group-4">
    //           <div className="text-wrapper-10">3</div>
    //         </div>
    //       </div>
    //     </div>
    //     <div className="group-12">
    //       <div className="overlap-5">
    //         <div className="text-wrapper-12">Rent automatically collected.</div>
    //         <p className="text-wrapper-11">
    //           No more sending awkward texts. Rent is automatically collected each month from your tenant’s bank and
    //           transferred to yours, at no cost.
    //         </p>
    //       </div>
    //       <div className="overlap-group-wrapper">
    //         <div className="overlap-group-4">
    //           <div className="text-wrapper-10">4</div>
    //         </div>
    //       </div>
    //     </div>
    //     <div className="group-13">
    //       <div className="overlap-5">
    //         <div className="text-wrapper-12">Transform your business.</div>
    //         <p className="with-matchbook-you">
    //           <span className="text-wrapper-14">With Matchbook, you have access to data-driven </span>
    //           <span className="text-wrapper-15">Property Insights</span>
    //           <span className="text-wrapper-14">
    //             . See how your property is performing in your dedicated analytics dashboard.
    //           </span>
    //         </p>
    //       </div>
    //       <div className="overlap-group-wrapper">
    //         <div className="overlap-group-4">
    //           <div className="text-wrapper-10">5</div>
    //         </div>
    //       </div>
    //     </div>
    //     <p className="renting-shouldn-t-be">
    //       Renting shouldn’t be so hard.
    //       <br />
    //       Now, it doesn’t have to be.
    //     </p>
    //   </div>
    // </>
  );
};

export default WebHomePage;