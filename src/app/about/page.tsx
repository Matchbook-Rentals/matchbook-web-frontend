import { PAGE_MARGIN } from '@/constants/styles';
import Image from 'next/image';
import MatchbookHeader from '@/components/marketing-landing-components/matchbook-header';
import Footer from '@/components/marketing-landing-components/footer';
import SocialLinks from '@/components/SocialLinks';
import { Montserrat } from 'next/font/google';
const montserrat = Montserrat({ subsets: ["latin"], variable: '--font-montserrat' });

export default function AboutPage() {
  return (
    <>
      <MatchbookHeader />
      <main className={`${PAGE_MARGIN} mx-auto px-4 py-8`}>
        <div className="">
          {/* Page Title */}
          <h1 className='text-[32px] md:text-[48px] text-left mb-4 md:mb-8 font-normal'> About Us </h1>
          <div className='flex justify-between items-end px-1'>
            <h3 className={`${montserrat.className}`}>October 28, 2024</h3>
            <SocialLinks className='' />
          </div>

          {/* Hero Image */}
          <Image
            src={"/article-images/contact.png"}
            alt={"Blog article image"}
            width={1515}
            height={337}
            className="w-[95%] mx-auto mt-1 md:w-full aspect-[1500/800] md:aspect-[1515/375] rounded-lg object-cover"
            priority={true}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1515px"
          />

          {/* Our Journey Section */}
          <div className='space-y-8'>
            <section className=' mt-4 '>
              <h2 className="text-xl font-bold mb-4">Our Journey</h2>
              <p className="text-gray-700">
                Ever tried finding a place to live that fits your not-so-typical schedule? We did, and it was a bad time. When Isabelle and I left Active Duty Air force to attend school, we discovered that trying to find a flexible rental property was like like finding a missing sock in a pile of laundry. We thought, "There has to be a better way!" And just like that, the idea for MatchBook was born. 3 years later and with the help of an amazing team, we have created a platform that makes connecting housing providers with guests a breeze for all types and schedules.
              </p>
            </section>

            {/* Mission Statement Section */}
            <section>
              <h2 className="text-xl font-bold mb-4">Mission Statement</h2>
              <p className="text-gray-700">
                Our mission at MatchBook is to make finding and offering flexible housing straightforward and stress-free. We value honesty, integrity, and delivering real value upfront. We're dedicated to building lasting relationships rather than chasing quick wins. By focusing on what's best for our customers and team, we aim to create a fair, and dare we say, enjoyable experience for everyone involved.
              </p>
            </section>

            {/* What Makes Us Different Section */}
            <section>
              <h2 className="text-xl font-bold mb-4">What Makes Us Different</h2>
              <p className="text-gray-700">
                We stand out by offering a complete solution to common rental challenges. Unlike others who leave you to figure out the complexities on your own charge you an arm and a leg for their help, MatchBook integrates essential features like calendar management, tenant screening, and application management into one platform accessible for all budgets.
              </p>
            </section>

            {/* Looking Ahead Section */}
            <section>
              <h2 className="text-xl font-bold mb-4">Looking Ahead</h2>
              <p className="text-gray-700">
                We're gearing up for our big debut and have been chatting with loads of awesome people to make sure we're on the right track. Their stories, laughs, and nuggets of wisdom have been the secret sauce in shaping MatchBook. We're beyond excited to launch a platform that doesn't just meet your needs but makes you wonder how you ever lived without it.
              </p>
            </section>
          </div>

          {/* Signature */}
          <div className='flex flex-col mt-8 items-end'>
            <h4 className='font-medium text-[36px]'> Daniel Resner </h4>
            <h5 className='text-[20px] font-normal'> Co-Founder &amp; CEO </h5>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
