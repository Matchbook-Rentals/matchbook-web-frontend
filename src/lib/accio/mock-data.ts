/**
 * Mock XML data for Accio background check testing
 *
 * Available subjects:
 * - blackwood_dante: Criminal records (2) + eviction record (1)
 *
 * Commented out:
 * - doe_john: Clean record (clear)
 */

import type { MockSubject } from './config';

interface MockSubjectData {
  name: string;
  description: string;
  xml: string;
}

export const MOCK_SUBJECTS: Record<MockSubject, MockSubjectData> = {
  blackwood_dante: {
    name: 'Dante Blackwood',
    description: '2 criminal records + 1 eviction record',
    xml: `<?xml version="1.0" encoding="UTF-8"?>
<ScreeningResults>
  <login>
    <account>{{ORDER_ID}}</account>
    <username>{{ORDER_ID}}</username>
    <password>{{ORDER_ID}}</password>
  </login>
  <clientInfo>
    <username>tyler.bennett@matchbookrentals.com</username>
    <primaryuser_contact_fax/>
    <primaryuser_contact_address/>
    <account>matchbook</account>
    <primaryuser_contact_telephone>317-908-7302</primaryuser_contact_telephone>
    <primaryuser_contact_title/>
    <primaryuser_contact_name>Tyler Bennett</primaryuser_contact_name>
    <primaryuser_contact_city/>
    <primaryuser_contact_email>Tyler.Bennett@matchbookrentals.com</primaryuser_contact_email>
    <primaryuser_contact_zip/>
    <primaryuser_contact_state/>
    <report_format/>
    <packageset/>
  </clientInfo>
  <accountInfo>
    <primaryuser_contact_fax/>
    <primaryuser_contact_address>3024 N 1400 E</primaryuser_contact_address>
    <primaryuser_contact_telephone>317-908-7302</primaryuser_contact_telephone>
    <primaryuser_contact_name>Daniel Resner</primaryuser_contact_name>
    <packageset>matchbook</packageset>
    <primaryuser_contact_city>OGDEN</primaryuser_contact_city>
    <primaryuser_contact_email>daniel.resner@matchbookrentals.com</primaryuser_contact_email>
    <primaryuser_contact_zip>84414</primaryuser_contact_zip>
    <primaryuser_contact_state>UT</primaryuser_contact_state>
    <report_format/>
    <company_name>Matchbook Rentals</company_name>
  </accountInfo>
  <orderInfo>
    <packagename>Criminal and Evictions</packagename>
  </orderInfo>
  <completeOrder number="{{ORDER_ID}}" remote_number="MOCK-24776" isactive="Y" archived="N" reviewed="N" reference_number="">
    <status>hits</status>
    <time_filled>{{TIME_FILLED}}</time_filled>
    <time_ordered>{{TIME_ORDERED}}</time_ordered>
    <reportURL>
      <HTML>https://globalbackgroundscreening.bgsecured.com/c/d/show_order?order_number=MOCK</HTML>
      <PDF_Color>https://globalbackgroundscreening.bgsecured.com/c/d/show_order?order_number=MOCK&amp;pdf2=1</PDF_Color>
      <PDF_BW>https://globalbackgroundscreening.bgsecured.com/c/d/show_order?order_number=MOCK&amp;pdf2=1&amp;black=X</PDF_BW>
    </reportURL>
    <subject>
      <name_first>Dante</name_first>
      <name_last>Blackwood</name_last>
      <ssn>118829724</ssn>
      <dob>19940513</dob>
      <address>751 N Indian Creek DR</address>
      <city>Clarkston</city>
      <state>GA</state>
      <zip>30021</zip>
      <email>verification@matchbookrentals.com</email>
    </subject>
    <report_html_summary><![CDATA[
<p>The background check for Dante Blackwood is complete.</p>
<pre>
Component                                               - Status
--------------------------------------------------------------------------------
Criminal County History                                 - HITS
National Criminal History Search                        - CLEAR
Evictions and Property Damage Check                     - HITS
</pre>
]]></report_html_summary>
    <order_state>order completion</order_state>

    <!-- National Criminal - CLEAR -->
    <subOrder number="" remote_number="724800" description="National Criminal History Search" remote_order="MOCK-24776" remote_subOrder="724800" held_for_review="N" held_for_release_form="N" filledStatus="filled" filledCode="clear" type="National Criminal">
      <time_ordered>{{TIME_ORDERED}}</time_ordered>
      <time_filled>{{TIME_FILLED}}</time_filled>
    </subOrder>

    <!-- Evictions - HITS -->
    <subOrder number="" remote_number="724801" description="Evictions and Property Damage Check" remote_order="MOCK-24776" remote_subOrder="724801" held_for_review="N" held_for_release_form="N" filledStatus="filled" filledCode="hits" type="evictions_check">
      <time_ordered>{{TIME_ORDERED}}</time_ordered>
      <time_filled>{{TIME_FILLED}}</time_filled>
    </subOrder>
  </completeOrder>

  <!-- Second completeOrder with Criminal County History details -->
  <completeOrder number="" remote_number="MOCK-24804" isactive="Y" archived="N" reviewed="N" reference_number="{{ORDER_ID}}">
    <status>hits</status>
    <time_filled>{{TIME_FILLED}}</time_filled>
    <time_ordered>{{TIME_ORDERED}}</time_ordered>
    <reportURL>
      <HTML>https://globalbackgroundscreening.bgsecured.com/c/d/show_order?order_number=MOCK</HTML>
    </reportURL>
    <subject>
      <name_first>Dante</name_first>
      <name_last>Blackwood</name_last>
      <ssn>118829724</ssn>
      <dob>19940513</dob>
      <address>751 N Indian Creek DR</address>
      <city>Clarkston</city>
      <state>GA</state>
      <zip>30021</zip>
    </subject>
    <order_state>order completion</order_state>

    <!-- Criminal County History - HITS with case details -->
    <subOrder number="" remote_number="724979" description="Criminal County History " remote_order="MOCK-24804" remote_subOrder="724979" held_for_review="N" held_for_release_form="N" filledStatus="filled" filledCode="hits" type="County_criminal">
      <time_ordered>{{TIME_ORDERED}}</time_ordered>
      <time_filled>{{TIME_FILLED}}</time_filled>
      <county>COBB</county>
      <state>GA</state>
      <years_conviction>7</years_conviction>

      <!-- Case 1: THEFT OF SERVICES - Felony - PENDING with Active Warrant -->
      <case>
        <identified_by_name>Y</identified_by_name>
        <identified_by_dob>Y</identified_by_dob>
        <identified_by_ssn>N</identified_by_ssn>
        <case_number>123145</case_number>
        <filing_date>20200120</filing_date>
        <pending_date>20260120</pending_date>
        <jurisdiction>COBB</jurisdiction>
        <jurisdiction_state>GA</jurisdiction_state>
        <source>SUPERIOR COURT</source>
        <defendant>
          <name_first>Dante</name_first>
          <name_last>Blackwood</name_last>
          <dob>19940513</dob>
          <dobfreeform>5/13/1994</dobfreeform>
        </defendant>
        <chargeinfo>
          <sentence_comments>MOCK - FAILURE TO APPEAR - WARRANT ISSUED - ACTIVE</sentence_comments>
          <charge_number>1</charge_number>
          <crime_type>Felony</crime_type>
          <disposition>PENDING</disposition>
          <charge>THEFT OF SERVICES</charge>
        </chargeinfo>
      </case>

      <!-- Case 2: BATTERY - Misdemeanor - Guilty -->
      <case>
        <identified_by_name>Y</identified_by_name>
        <identified_by_dob>Y</identified_by_dob>
        <identified_by_ssn>N</identified_by_ssn>
        <case_number>56684</case_number>
        <filing_date>20200120</filing_date>
        <disposition_date>20210520</disposition_date>
        <jurisdiction>COBB</jurisdiction>
        <jurisdiction_state>GA</jurisdiction_state>
        <source>STATE COURT</source>
        <defendant>
          <name_first>Dante</name_first>
          <name_last>Blackwood</name_last>
          <dob>19940513</dob>
          <dobfreeform>5/13/1994</dobfreeform>
        </defendant>
        <chargeinfo>
          <sentence_comments>12 MONTHS PROBATION; 5,500 FINE</sentence_comments>
          <charge_number>1</charge_number>
          <crime_type>Misdemeanor</crime_type>
          <disposition>Guilty</disposition>
          <charge>BATTERY</charge>
        </chargeinfo>
      </case>
    </subOrder>
  </completeOrder>
</ScreeningResults>`,
  },

  // doe_john: {
  //   name: 'John Doe',
  //   description: 'Clean record',
  //   xml: `<?xml version="1.0" encoding="UTF-8"?>
  // <ScreeningResults>
  //   ...
  // </ScreeningResults>`,
  // },
};

/**
 * Get mock XML with placeholders replaced
 */
export const getMockXml = (subject: MockSubject, orderId: string): string => {
  let xml = MOCK_SUBJECTS[subject].xml;

  // Replace order ID placeholders
  xml = xml.replace(/\{\{ORDER_ID\}\}/g, orderId);

  // Replace timestamps with current time
  const now = new Date();
  const timeFormatted = now.toISOString().replace('T', ' ').slice(0, 19);
  const timeOrderedFormatted = new Date(now.getTime() - 60000).toISOString().replace('T', ' ').slice(0, 19);

  xml = xml.replace(/\{\{TIME_FILLED\}\}/g, timeFormatted);
  xml = xml.replace(/\{\{TIME_ORDERED\}\}/g, timeOrderedFormatted);

  return xml;
};
