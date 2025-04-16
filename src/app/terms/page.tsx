import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";
import { getAgreedToTerms, agreeToTerms } from "../actions/user";
import { auth } from "@clerk/nextjs/server";

export default async function TermsPage() {
  const { userId } = auth();
  
  if (!userId) {
    return redirect("/sign-in");
  }
  
  // Check if user has already agreed to terms
  const agreedToTerms = await getAgreedToTerms();
  
  if (agreedToTerms) {
    // User already agreed to terms, redirect to home
    return redirect("/");
  }
  
  const handleAgree = async () => {
    "use server";
    await agreeToTerms();
    return redirect("/");
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <h1 className="text-3xl font-bold mb-6">Terms and Conditions</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md mb-8 max-h-[70vh] overflow-y-auto">
        <p className="mb-4 text-sm text-gray-600">Last Updated: February 23, 2024</p>
        
        <h2 className="text-xl font-semibold mb-4">Executive Summary</h2>
        <p className="mb-6">
          These Terms of Use govern the access and use of the MatchBook LLC website and mobile application (the &quot;Service&quot;). 
          By using the Service, users agree to a legally binding agreement with MatchBook LLC (&quot;The Platform&quot;). Key provisions 
          outline user responsibilities, including compliance with all applicable laws and maintenance of account security. 
          MatchBook LLC operates as a platform connecting landlords/property managers (&quot;Hosts&quot;) with potential renters (&quot;Renters&quot;), 
          but is not a party to any rental agreements made through the platform. The Terms of Use include limitations of liability, 
          data use policies, acceptable content guidelines, and dispute resolution procedures. Users are responsible for ensuring 
          the accuracy of their listings and compliance with fair housing laws. The Platform reserves the right to modify the 
          Terms of Use at any time.
        </p>

        <p className="mb-6">
          MatchBook LLC and its affiliates (&quot;we,&quot; &quot;us,&quot; &quot;our,&quot; or &quot;The Platform&quot;) operate this website and the MatchBook mobile 
          application (the &quot;Service&quot; or &quot;Website&quot;).
        </p>

        <p className="mb-6">
          By using or accessing this Site, including any subdomain, mobile application, or other website operated by us where 
          these Terms of Use are posted (collectively, the &quot;Site&quot;), you agree to be bound by these Terms of Use, as well as our 
          Privacy Policy (collectively, the &quot;Terms&quot;). If you do not agree to these Terms, you are not authorized to access or 
          use the Site. &quot;Use&quot; or &quot;access&quot; of the Site includes any direct or indirect access or use of the Site or any cached 
          version of the Site, and any direct or indirect access or use of any information or content on the Site, regardless 
          of how obtained. The term &quot;Site&quot; includes, without limitation, any cached version.
        </p>

        <p className="mb-6">
          You should read these Terms carefully. They constitute a legally binding agreement between you and The Platform. You 
          must be at least 18 years old and able to enter into legally binding contracts to use this Site. We do not knowingly 
          collect information from individuals under the age of 18.
        </p>

        <p className="mb-6">
          These Terms govern your use of this Site, regardless of how you accessed it.
        </p>

        <h2 className="text-xl font-semibold mb-4">1. The Site is a Platform and We are Not a Party to any Rental Agreement or other Transaction Between Users of the Site.</h2>
        <p className="mb-6">
          We do not own, manage, or have the authority to contract for any rental property listed on the Site. The Site provides 
          a platform where landlords, property managers, and property owners (each, a &quot;Host&quot;) can offer rental properties to 
          potential renters (&quot;Renters,&quot; and collectively with Hosts, &quot;Users&quot;) in various pricing formats. This includes users 
          who originally advertised their properties elsewhere and whose listings have been redistributed on the Site. We may 
          also offer tools for online Leasing or other services that allow Users to communicate, send maintenance requests, notices, 
          and payments, and enter into rental agreements or other transactions. Users use these tools at their own discretion and 
          risk. We are not responsible for any misuse of these tools or wrongful dealings between Users.
        </p>

        <p className="mb-6">
          We are not a party to any rental or other agreement between Users. Users are solely responsible for the liability and 
          enforcement of such agreements, even if the Site facilitates connections, screenings, lease creation, or provides other 
          related tools, services, or products. We do not review notices, listings, or related documents for legal compliance. 
          Users should seek independent legal advice before entering into any agreement.
        </p>

        <p className="mb-6">
          You acknowledge that you may be required to agree to separate agreements, waivers, or terms and conditions prior to 
          entering into a Leasing or purchasing a product or service.
        </p>

        <h2 className="text-xl font-semibold mb-4">2. User Responsibilities.</h2>
        <p className="mb-6">
          Users are responsible for complying with all applicable laws, rules, and regulations when using the Site, any tool, 
          service, or product offered on the Site, and any transaction they enter into on or related to the Site. This includes, 
          but is not limited to, the Fair Housing Act and other anti-discrimination laws, laws related to credit card and payment 
          processing, licensure requirements, and privacy laws. Specifically, Users agree not to discriminate based on race, color, 
          national origin, religion, sex, familial status (including families with children under 18), or disability, as prohibited 
          by the Fair Housing Act and other anti-discrimination laws. This includes refusing to rent, setting different rental terms, 
          or making discriminatory statements or advertisements. Users are responsible for understanding and complying with all 
          applicable Fair Housing laws.
        </p>

        <p className="mb-6">
          You agree to: (i) keep your password and online ID for both your account with us and your email account secure and 
          strictly confidential, providing them only to authorized users of your accounts; (ii) instruct anyone you give your 
          online ID and password to not disclose it to any unauthorized person; (iii) notify us immediately and select a new 
          online ID and password if you believe your password for either your account with us or your email account has been 
          compromised; and (iv) notify us immediately if you are contacted by anyone requesting your online ID and password. 
          If we suspect unauthorized access to your account, you agree to promptly change your ID and password and take any other 
          steps we reasonably request. If we disable your account, you will not create another account without our permission.
        </p>

        <p className="mb-6">
          We do not tolerate spam or unsolicited commercial electronic communications. You are not licensed to add any Site user 
          to any mailing list (email or physical mail) without their express consent, even if they have rented a property from you 
          or to you. You may not use any tool or service on the Site to send spam or unsolicited commercial electronic communications 
          or in any other way that violates these Terms. You are responsible for all content you provide to the Site.
        </p>

        <p className="mb-6">
          Hosts who are property managers and other Hosts who use our online leasing tools agree to use commercially reasonable 
          efforts to respond to all leasing requests from Renters within 24 hours of receipt and to process all Renter payments 
          within 24 hours of Renter authorization.
        </p>

        <p className="mb-6">
          Each Host agrees to promptly provide proof of personal identification, property ownership, and authority to list the 
          property as we may request. Acceptable forms of proof include a copy of the deed, property tax statement, or management 
          agreement. We reserve the right to independently verify this information. We may also require Hosts to provide a valid 
          phone number and/or email address and may contact you for business-related purposes. Each Host represents and warrants 
          that: (i) they own or have all necessary rights and authority to offer and rent the property listed; (ii) they will not 
          wrongfully withhold a rental deposit in breach of the rental agreement or our policies; (iii) they will accurately describe 
          the property and disclose any material defects or information, and will regularly review the listing to ensure it is accurate 
          and not misleading; (iv) they will not wrongfully deny access to the property; and (v) they will provide refunds when due 
          according to the cancellation policy or rental agreement. Upon our request, each Host agrees to promptly provide proof of 
          personal identification, that the property&apos;s condition, location, and amenities are accurately described, property ownership, 
          and authority to list the property. If you are listing a home, condominium, or apartment, please check your rental contract 
          or lease, or contact your landlord, to determine if there are restrictions that would limit your ability to list the property. 
          Listing your home may violate your lease or contract and could result in legal action, including eviction.
        </p>

        <p className="mb-6">
          By submitting a photograph, the Host represents and warrants that (a) (i) they hold all intellectual property rights to the 
          photograph, or (ii) they have secured all necessary rights from the copyright holder for its use in an online advertisement; 
          (b) any people in the photograph have given permission to display their likeness on the Site; (c) the photograph accurately 
          represents the subject and has not been altered in any misleading way; and (d) they will indemnify and hold harmless the Site 
          and The Platform from any claims arising from any misrepresentation regarding the photographs.
        </p>

        <p className="mb-6">
          The Host is responsible for obtaining reproduction permission for all photographic and other material used in their listings. 
          The Host warrants that they own the copyright to such material or are authorized to grant us the rights contained therein and 
          agrees to provide proof of such rights upon request. Each Host agrees that we may reproduce photographic material in the 
          promotion of their property or the Site. As part of the Services, we will provide Hosts with notification of and access to 
          Renter applications. Hosts accept all responsibility, liability, and obligations for the safekeeping and confidentiality of 
          these applications and agree to indemnify us and hold us harmless from any claims resulting from their access.
        </p>

        <p className="mb-6">
          You shall not:
          <ul className="list-disc pl-8 mt-2 space-y-1">
            <li>upload, post, transmit, share or otherwise make available any unsolicited or unauthorized advertising, solicitations, promotional materials, &quot;junk mail,&quot; &quot;spam,&quot; &quot;chain letters,&quot; &quot;pyramid schemes,&quot; or any other form of solicitation;</li>
            <li>solicit personal information from anyone under the age of eighteen (18) or solicit passwords or personally identifying information for commercial or unlawful purposes;</li>
            <li>upload, post, transmit, share or otherwise make available any material that contains software viruses or any other computer code, files or programs designed to interrupt, destroy or limit the functionality of any computer software or hardware or telecommunications equipment;</li>
            <li>intimidate or harass another individual, including your Renter(s) or landlord whether on-site or offline;</li>
            <li>upload, post, transmit, share, store or otherwise make available content that would constitute, encourage or provide instructions for a criminal offense, violate the rights of any party, or that would otherwise create liability or violate any local, state, national or international law;</li>
            <li>use or attempt to use another&apos;s account, service or system without authorization from Us, or create a false identity on the Sites;</li>
            <li>upload, post, transmit, share, store or otherwise make available content that, in our sole judgment, is objectionable or which restricts or inhibits any other person from using or enjoying the Sites, or which may expose us or our users to any harm or liability of any type;</li>
            <li>circumvent or modify, attempt to circumvent or modify, or encourage or assist any other person in circumventing or modifying any security technology or software that is part of the Sites;</li>
            <li>cover or obscure the advertisements on any Sites page via HTML/CSS or any other means;</li>
            <li>make use of any automated use of the system, such as, but not limited to, using scripts to inappropriately add or take away information to your account or any other profile of another user or send comments or messages;</li>
            <li>interfering with, disrupting, or creating an undue burden on the Sites or the networks or services connected to the Sites;</li>
            <li>use the account, username, or password of another user at any time or disclosing your password to any third party or permitting any third party to access your account;</li>
            <li>sell or otherwise transfer your account; and</li>
            <li>display an unauthorized commercial advertisement on your account.</li>
          </ul>
        </p>

        <h2 className="text-xl font-semibold mb-4">3. Limited License to Use the Site; Warranty; Limitation of Liability.</h2>
        <p className="mb-6">
          Users are granted a limited, revocable, non-exclusive license to access the Service and Site and the content and services 
          provided on the Site solely for the purpose of advertising a rental property, searching for a property, purchasing or 
          researching (for the purpose of inquiring about purchasing) any of the products or services offered on any Site, participating 
          in an interactive area hosted on any Site or for any other purpose clearly stated on a Site, all in accordance with the Terms. 
          Any use of the Site that is not for one of these purposes or otherwise in accordance with the Terms or as otherwise authorized 
          by us in writing is expressly prohibited. This license is subject to your compliance with these Terms.
        </p>

        <p className="mb-6">
          Use of the Service does not give you ownership of any intellectual property rights in the Service or any content posted on 
          the Service. You own what you post on the Service (unless you copied it from someone else) but you grant us a license to copy, 
          host, display, create derivative works from, publish, publicly perform, display, and distribute, and otherwise make use of in 
          connection with providing the Service, all information and content you post so long as you have an active account. If you are 
          a landlord and authorize us (by checking the appropriate box or boxes on our site) to syndicate your rental listing on 
          third-party sites, you further agree that we may grant sublicenses to applicable third parties as necessary to facilitate 
          such syndication. As part of the rental inquiry process, for your own personal, non-commercial use and not for further 
          distribution, you may download, display, and/or print one copy of any portion of the Site. You may not modify the same, and 
          you must reproduce our copyright notice in the form displayed on the relevant portion(s) of the Site that you desire to 
          download, display or print.
        </p>

        <p className="mb-6">
          You shall not (i) sell, resell, distribute, host, lease, rent, license or sublicense, in whole or in part, the Services or 
          any Site; (ii) copy, decipher, decompile, disassemble, reverse assemble, modify, translate, reverse engineer or otherwise 
          attempt to derive source code, algorithms, tags, specifications, architecture, structure or other elements of the Services 
          or any Site, in whole or in part, for competitive purposes or otherwise; (iii) allow access to, provide, divulge or make 
          available the Service or Site to any user other than those who have licenses to access them; (iv) write or develop any 
          derivative works based upon the Services or Sites; (v) modify, adapt, translate or otherwise make any changes to the Services 
          or Sites or any part thereof; (vi) otherwise use or copy the Services or Sites except as expressly permitted herein; or (ix) 
          remove from any Services or Sites any identification, patent, copyright, trademark or other notices or circumvent or disable 
          any security devices functionality or features.
        </p>

        <p className="mb-6">
          THE SERVICE IS PROVIDED &quot;AS-IS&quot; WITHOUT PROMISES OF ANY KIND. NEITHER WE NOR OUR SUPPLIERS/THIRD PARTY VENDORS WARRANT OR 
          GUARANTEE UPTIME OR AVAILABILITY OF THE SERVICE, THAT THE SERVICE WILL MEET OR CONTINUE IN THE FUTURE TO MEET YOUR NEEDS, 
          OR THAT WE WILL CONTINUE TO PROVIDE THE SERVICE OR ANY ASPECT OF THE SERVICE IN THE FUTURE. TO THE MAXIMUM EXTENT PERMITTED 
          BY LAW, WE DISCLAIM ALL WARRANTIES FOR THE SERVICE, INCLUDING WITHOUT LIMITATION THE IMPLIED WARRANTIES OF MERCHANTABILITY, 
          FITNESS FOR A PARTICULAR PURPOSE, SEAWORTHINESS, AND NON-INFRINGEMENT. To the extent that warranties cannot be disclaimed 
          under applicable law, we limit the duration and remedies of such warranties to the fullest extent permissible under those laws.
        </p>

        <p className="mb-6">
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE WILL NOT BE LIABLE RESPONSIBLE FOR LOST INFORMATION, PROFITS, REVENUES, OR DATA, 
          FINANCIAL LOSSES, OR INDIRECT, SPECIAL, CONSEQUENTIAL, INCIDENTAL, EXEMPLARY, OR PUNITIVE DAMAGES.
        </p>

        <p className="mb-6">
          IF YOU ARE DISSATISFIED WITH THE SITE, YOU DO NOT AGREE WITH ANY PART OF THE TERMS, OR HAVE ANY OTHER DISPUTE OR CLAIM WITH 
          OR AGAINST US, ANY THIRD PARTY PROVIDER OR ANY USER OF THE SITE WITH RESPECT TO THESE TERMS OR THE SITE, THEN YOUR SOLE AND 
          EXCLUSIVE REMEDY AGAINST US IS TO DISCONTINUE USING THE SITE. IN ALL EVENTS, OUR LIABILITY, AND THE LIABILITY OF THE PLATFORM, 
          TO YOU OR ANY THIRD PARTY IN ANY CIRCUMSTANCE ARISING OUT OF OR IN CONNECTION WITH THE SITE IS LIMITED TO THE GREATER OF (A) 
          THE AMOUNT OF FEES YOU PAY TO US FOR THE DURATION OF THE BOOKING RELATED TO THE ACTION GIVING RISE TO LIABILITY OR (B) $100.00 
          IN THE AGGREGATE FOR ALL CLAIMS.
        </p>

        <h2 className="text-xl font-semibold mb-4">4. User Warranties.</h2>
        <p className="mb-6">
          You represent, warrant, and covenant that all content you provide (&quot;User-Contributed Content&quot;), including, but not limited to, 
          information about your rental property(ies), is true and accurate to the best of your knowledge. You may not post, transmit, 
          or share User-Contributed Content that you did not create or do not have permission to post. You assume full responsibility 
          for, and agree to indemnify us against any liability arising from User-Contributed Content that you post on the Services or 
          the Site, as well as any material or information that you transmit to other users of the Sites or for your interactions with 
          other users.
        </p>

        <h2 className="text-xl font-semibold mb-4">5. Data Collected by You from the Services and Sites.</h2>
        <p className="mb-6">
          If you obtain another user&apos;s personal information directly or indirectly through the Services or Site, you agree that the 
          limited license we grant you allows you to use such information only for: (a) using services offered through the Site, and 
          (b) inquiring about or facilitating a financial transaction with that user related to the Site&apos;s purpose (such as inquiring 
          about or Leasing an online Leasing or processing a payment). Any other use or disclosure requires the user&apos;s express permission. 
          You may not use the information for any unlawful purpose or with any unlawful intent.
        </p>

        <h2 className="text-xl font-semibold mb-4">6. User-contributed Content; Participation in Interactive Forums.</h2>
        <p className="mb-6">
          We reserve the right to decline to permit the posting on the Site or to remove from the Site any User-Contributed Content for 
          any reason, including if it fails to meet our Content Guidelines, any other guidelines posted on the Site, or violates these 
          Terms, as determined in our sole discretion. We will exercise this right reasonably and in good faith. Reasons for removing 
          content may include, but are not limited to, content that is unlawful, infringing, harmful, or violates these Terms. We reserve 
          the right, but do not assume the obligation, to edit a Host&apos;s content or User-Contributed Content in a non-substantive manner 
          to ensure compliance with our content guidelines or formatting requirements or to provide services to Hosts to create or improve 
          listings (such as translation services), based on information we have about the property listed. Users are responsible for 
          reviewing their User-Contributed Content to ensure it is accurate and not misleading.
        </p>

        <h2 className="text-xl font-semibold mb-4">7. Notification of Infringement; DMCA Policy.</h2>
        <p className="mb-6">
          We respect the intellectual property rights of others. The Platform does not permit, condone, or tolerate the posting of any 
          content on the Site that infringes any person&apos;s copyright. In appropriate circumstances, The Platform will terminate any Host 
          or Renter who repeatedly infringes copyright. If you become aware of or suspect any copyright infringement on this Site, please 
          notify us at Support@MatchBookRentals.com
        </p>

        <h2 className="text-xl font-semibold mb-4">8. Feedback.</h2>
        <p className="mb-6">
          Users may submit unsolicited ideas or suggestions related to the platform, such as ideas for new or improved products or 
          technologies, website or tool enhancements, processes, materials, marketing plans, or new product names. We are under no 
          obligation to review or consider them, nor are we required to treat them as confidential. If you choose to submit any ideas, 
          original creative artwork, suggestions, or other works (&quot;Feedback&quot;) to us, the following terms apply: By providing Feedback 
          to us, you agree that: (1) the Feedback and its contents automatically become our property, without any compensation to you; 
          and (2) we may use or redistribute any Feedback and its contents for any purpose and in any way.
        </p>

        <h2 className="text-xl font-semibold mb-4">9. United States Export Controls.</h2>
        <p className="mb-6">
          The Site is subject to United States export controls. No Software available on the Site or software available any other site 
          operated by us may be downloaded or otherwise exported or re-exported (a) into (or to a resident of) Cuba, Iraq, Russia, Belarus, 
          Libya, North Korea, Iran, Syria or any other country to which the United States has embargoed goods, or (b) anyone on the United 
          States Treasury Department&apos;s list of Specially Designated Nationals or the United States Commerce Department&apos;s Table of Deny Orders. 
          By using the Site, you represent and warrant that you are not located in, under the control of, or a national or resident of any 
          such country or on any such list.
        </p>

        <h2 className="text-xl font-semibold mb-4">10. Links to Third Party Sites.</h2>
        <p className="mb-6">
          This Site may contain links and pointers to other Internet sites, resources, and sponsors. Links to and from the Site to 
          third-party sites maintained by third parties do not constitute our endorsement of any third parties, their sites, or their 
          content. We may also provide tools that allow interaction between the Site and a third-party site, such as a Social Media Site. 
          We are not responsible for those third-party sites or resources, and your use of them is not governed by these Terms.
        </p>

        <h2 className="text-xl font-semibold mb-4">11. Release; Indemnification.</h2>
        <p className="mb-6">
          If you have a dispute with one or more other users of the Site (including any dispute regarding any transaction or User-Contributed 
          Content) or any third-party provider or website that may be linked to or interacting with the Site, including any Social Media Site, 
          you agree to release, remise, and forever discharge The Platform, and each of their respective agents, directors, officers, employees, 
          and all other related persons or entities, from any and all rights, claims, complaints, demands, causes of action, proceedings, 
          liabilities, obligations, legal fees, costs, and disbursements of any nature whatsoever, whether known or unknown, that now or 
          hereafter arise from, relate to, or are connected with such dispute and/or your use of the Site.
        </p>

        <h2 className="text-xl font-semibold mb-4">12. Jurisdiction; Choice of Law and Forum; Limitation of Action.</h2>
        <p className="mb-6">
          All services and rights of use under these Terms are performed in the State of Utah, United States of America. You irrevocably 
          agree that any cause of action relating to your use of the Site or these Terms must be filed in the state or federal courts in 
          Salt Lake County, Utah, which you acknowledge and agree will be the exclusive forum and venue for any legal dispute between you 
          and us. Any dispute between you and us will be governed by the laws of the State of Utah, without regard to conflict of laws 
          principles. Any cause of action or litigation relating to the Service and these Terms may only be maintained on an individual 
          basis, and you agree not to consolidate claims or raise claims on behalf of a class.
        </p>

        <h2 className="text-xl font-semibold mb-4">13. Insurance.</h2>
        <p className="mb-6">
          We do not provide liability insurance protection for owners, property managers, or Renters, regardless of whether a user obtains 
          insurance coverage through one of our third-party providers. Users are solely responsible for obtaining sufficient insurance 
          coverage to protect their properties and themselves, as applicable. Hosts agree that they have or will obtain appropriate insurance 
          coverage to cover the rental of properties managed on the Site before a Renter&apos;s arrival and will maintain adequate coverage through 
          the Renter&apos;s departure. Upon request, Hosts will provide us with copies of relevant proof of coverage.
        </p>

        <h2 className="text-xl font-semibold mb-4">14. General</h2>
        <p className="mb-6">
          <strong>a. Independent Contractors:</strong> Our relationship is that of independent contractors. Nothing in these Terms or your use 
          of the Site creates any agency, partnership, joint venture, employee-employer, or franchisor-franchisee relationship between us.
        </p>

        <p className="mb-6">
          <strong>b. Notices:</strong> Unless explicitly stated otherwise, any notices to us must be sent by postal mail to the address listed 
          in the Contact Us section. When we need to send you a notice, we will send it to the email or physical address you provided during 
          registration or subsequently updated in your account. Email notices are deemed given upon receipt or 24 hours after sending, unless 
          we receive notice that the email address is invalid. Notices sent by certified mail, postage prepaid and return receipt requested, 
          are deemed given three days after mailing to a physical address and one day after mailing to an electronic address.
        </p>

        <p className="mb-6">
          <strong>c. Changes to the Site, Terms and Conditions:</strong> We may change, suspend, or discontinue any aspect of the Site at any 
          time, including the availability of any Site features, database, or content. We may also impose limits on certain features or services 
          or restrict your access to parts or the entire Site without notice or liability. These Terms are effective as of the Last Updated date 
          stated above. We reserve the right to amend these Terms at any time in our sole discretion. We will post notification of amendments 
          on the Site by indicating the Last Updated date at the top of these Terms, and amendments will be effective immediately upon posting. 
          Your continued use of the Site after the posting of amended Terms constitutes your agreement to the amendments. If you do not agree 
          to the amended Terms, you must discontinue your use of the Site.
        </p>

        <p className="mb-6">
          <strong>d. Termination for Cause:</strong> We may immediately terminate any user&apos;s access to or use of the Site if the user breaches 
          these Terms or engages in any unauthorized use of the Site. However, we do not guarantee that we will take action against all breaches 
          of these Terms.
        </p>

        <p className="mb-6">
          <strong>e. Entire Agreement, Conflict, Headings, and Severability:</strong> These Terms constitute the entire agreement between you 
          and us regarding your use of the Site and supersede any prior agreements. Headings in these Terms are for reference only and do not 
          limit the scope or extent of any section. If there is any conflict between these Terms and any other terms applicable to a product, 
          tool, or service offered on our Site, these Terms will prevail. If any part of these Terms is found to be invalid or unenforceable by 
          a court of competent jurisdiction, the remaining provisions will remain in full force and effect. Any provision held invalid or 
          unenforceable in part will remain in effect to the extent it is not invalid or unenforceable.
        </p>

        <p className="mb-6">
          <strong>f. Assignment:</strong> We may assign these Terms in our sole discretion. Users must obtain our prior written consent to 
          assign these Terms, which may be granted or withheld by us in our sole discretion.
        </p>

        <p className="mb-6">
          <strong>g. Marks:</strong> You may only use our trademarks or logos with our specific prior written authorization. You may refer to 
          The Platform or the name of one of our affiliate websites in a descriptive manner, such as &quot;Check out my rental on The Website,&quot; or 
          &quot;I list properties on The Website.&quot; However, you may not refer to The Platform or any of our affiliates in any way that suggests your 
          company or site is sponsored by, affiliated with, or endorsed by us.
        </p>

        <p className="mb-6">
          <strong>h. Payments:</strong> When you book a Listing, you agree to pay all charges for your booking, including the Listing price, 
          applicable fees like MatchBook&apos;s service fee, taxes, and any other items identified during checkout. We will process payments, deduct 
          applicable fees, and transfer the remaining funds to the designated bank account(s).
        </p>

        <p className="mb-6">
          <strong>i. Reservations:</strong> A Reservation is a limited license to enter, occupy, and use the accommodation. The Host retains the 
          right to re-enter the property during your stay to the extent (i) reasonably necessary, (ii) permitted by your rental agreement with 
          the Host, and (iii) permitted by applicable law.
        </p>

        <p className="mb-6">
          <strong>j. Overstay & Unapproved Renters Penalties:</strong> If a Renter overstays their reservation, their account will be removed, 
          and they will be banned from using MatchBook services. If more persons or pets are residing at the location than what was provided to 
          the Host at the time of application, all Renters associated with the reservation will have their accounts removed and will be banned 
          from using MatchBook services.
        </p>

        <p className="mb-6">
          <strong>k. Booking Modification:</strong> Renters and Hosts are responsible for any booking modifications they agree to make via the 
          MatchBook Platform or through MatchBook customer service (&quot;Booking Modifications&quot;) and agree to pay any additional amounts, fees, or 
          taxes associated with those Booking Modifications.
        </p>

        <p className="mb-6">
          <strong>l. Other things to be aware of:</strong> Regardless of whether a reservation is covered by this Policy, Hosts can cancel for 
          certain valid reasons, such as major damage to a listing, without fees or other adverse consequences.
        </p>

        <p className="mb-6">
          <strong>m. Refunds:</strong> Renters are eligible for a full refund via MatchBook only if they cancel within 24 hours of booking. If 
          a Renter cancels after that 24-hour period but before the first day of the reservation, they will forfeit their deposit and the 
          MatchBook service fee but will receive a refund for the first month&apos;s rent. Cancellation requests after the reservation has begun must 
          be submitted to the Host and are subject to the Host&apos;s discretion and the terms of the rental agreement. If a Host cancels a reservation 
          prior to move-in, the Renter will automatically receive a full refund.
        </p>

        <p className="mb-6">
          <strong>n. Transfer of Listing to a Third Party:</strong> No listing may be transferred to another party. In the event of a property 
          sale or change in property management, we will provide guidance on options for creating a new listing.
        </p>

        <p className="mb-6">
          <strong>o. Fees:</strong> The Platform charges a service fee only when a reservation is made. We charge a percentage of the total price 
          of the rental agreement to the Renter(s). This fee is charged during each monthly rental payment and is included in the overall monthly 
          price listed by the Host for transparency.
        </p>

        <p className="mb-6">
          <strong>p. Transaction Limits:</strong> The amount of money you can send from your account per transaction is limited and varies based 
          on your account type. Personal accounts are limited to $5,000.00 per transaction. Business, non-profit, and government accounts are 
          limited to sending $10,000.00 per transaction.
        </p>

        <p className="mb-6">
          <strong>q. Transaction Reversal:</strong> If a transaction is reversed or rejected (including due to disputes, chargebacks, failed 
          payments, or prefunded payments), we will require immediate payment and may attempt to debit your bank account(s) or charge a 
          debit/credit card on file, suspend your account, and/or initiate collection efforts.
        </p>

        <p className="mb-6">
          <strong>r. Account Errors:</strong> Contact us immediately if you believe that: (a) your account has been accessed without your 
          authorization; (b) a transaction you did not authorize has occurred; (c) a transaction has been processed incorrectly to or from 
          your account; or (d) your account statement contains an error regarding your transaction history (each, an &quot;Error&quot;).
        </p>

        <p className="mb-6">
          <strong>s. Force majeure:</strong> If we are unable to perform our obligations under these Terms due to circumstances beyond our 
          reasonable control and not our fault, including acts of God, fire, casualty, flood, earthquake, war, strike, lockout, epidemic, 
          destruction of production facilities, riot, insurrection, or material unavailability, our performance will be excused, and the time 
          for performance will be extended for the duration of the delay.
        </p>

        <p className="mb-6">
          <strong>t. Waiver; Severability:</strong> Our failure to enforce any provision of these Terms will not be considered a waiver of 
          future enforcement. The provisions of these Terms are severable. If any provision is found to be invalid or unenforceable in any 
          jurisdiction, the remaining provisions will remain in full force and effect.
        </p>

        <p className="mb-6">
          <strong>u. Purchases of Third-Party Products and Services:</strong> Users may utilize products such as template legal notices, 
          agreements, rental agreements, lease contracts, and other legal documents. These products are offered &quot;AS IS,&quot; and only the original 
          service provider or manufacturer&apos;s warranty may apply.
        </p>

        <p className="mb-6">
          <strong>v. Identity Verification:</strong> To ensure the safety and protection of our customers, we require identity verification 
          before allowing access to certain features of the Service, either directly with us or through third-party identification verification 
          services.
        </p>

        <p className="mb-6">
          <strong>y. Credit Checks and Background Reporting:</strong> We have partnered with third-party credit and background reporting 
          agencies as part of the Service. When a landlord requests a credit report from a prospective Renter, we give the Renter the option 
          to order a credit report to be shared with the requesting landlord.
        </p>

        <h2 className="text-xl font-semibold mb-4">Contact Us</h2>
        <p className="mb-6">
          If you have any questions or requests regarding this Privacy Policy or your Personal Information, please contact us at:
          <br /><br />
          MatchBook<br />
          Attn: MatchBook Customer Support<br />
          E-mail address: support@MatchBookRentals.com
        </p>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <form action={handleAgree}>
          <Button 
            type="submit"
            className="w-full sm:w-auto"
          >
            I Agree to the Terms and Conditions
          </Button>
        </form>
      </div>
    </div>
  );
}
