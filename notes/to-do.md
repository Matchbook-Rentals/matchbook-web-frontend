# TO DOs

##10FEB24
- [ ] finish application sent to DB
- [ ] finish application mobile view
- [x] listing view outside of trips
- [ ] sign up sign in pages
- [x] fix share button
  - [ ] test on mobile

Credit Card APIS for paywall
EVICTION AND CRIMINAL BACKGROUND CHECKS

ACH PLAID API

## 4Feb
- [x] New compnents in trip edit search bar
- [x] Map button on mobile
- [ ] Pop up to signify like or dislike
- [ ] finish application
- [ ] change card hover behcaior (map zoom level) add cards to map
- [ ] Listing links (one for sub-trip route, one for not part of a trip, although probably just grab teh trip, when authing the user if not part of trip then we redirect to new platform/listing/[listingID] route)
- [ ] deal with the stupid god damn overview village at mobile ( AHHHHHH)


- [x]Deselect laundry
- [x] kill tiles move to text and icon in single file (needs dialog)
- [x] FIX SEARCH CONTAINER DIFF COLORS ON HOME PAGE
- [ ] Mobile view
- [ ] Overview tab working
- [ ] Begin work on new matchmaker
- [ ] Tall dialog breaks on mobile
- [ ] Radio buttons
- [ ] Remove trips from breadcrumbs
- [ ] Navigation sizes as subheader for source of truth
- [ ] Four different forms approach
- [ ] only 5 applications out
- [ ] text size on cards
- [x] Open free maps
- [ ] applicaiton page
- [x] matchmaker mobile view



scale of village footer expanding in to search bar
fitler is dead on mobile
set one month minimuj on calendar
help widget to hamburger menu on platform routes
add gesture suppor to mbile caledar (swipe to next)
TONIGHT --- remove test from mobiile calender
expand to full page on
mirror bottom padding on matchbook header
trip delete, lanuage change edit button to populate trashcans
new serach button opens full screen serach modal, differetn from desktop behaviour
skeleton adjustment,


- [ ] MYMOO
- [ ] mobile popover
- [ ] pretty up the control bar on home page (it allows for edge clicks that do nothing, clicking off doesn't remove the popover)
- [ ] calendars
- [X] Search page
- [x] Filters
- [ ] min adults 1
- [ ] Double check all icon sizing in detials tiles and filter tiles
- [ ] Maps over to free maps
- [x] bed bath
- [ ] tab selector carousel? arrows? two layers?

- [x]  dialog finish, control active state for property type selection
- [ ] Adults 1 minimum and defualt start
- [ ] go through FIGMA text sizes and weights
- [ ] Reset default text to 404040 instead of black
- [ ] Number of properties to show on filters
- [ ] Actually filter by properties
- [x] Matchmaker blocks and separation
- [ ] Search page
- [x] Default tab matchmaker
- [ ] Reset platform navbar to be narrow on trips page.
- [x] Delete green scrollbar
- [ ] Seed db to 10000 listings
- [ ] REDO prop availability section
- [x]  Gap in carousel + beteween columns on match desktop
- [x]  Move bedroom bathroom count to below listing title
- [ ]  Popover for mobile view
- [ ]  Tab selector mboile view
- [ ] Highlight display for single family

##02DEC24- [X] Credit Intelligence Filtering
- [x] Maybes
- [X] Get rid of X
- [ ] carousel circle behind chevron and updated chevron
- [ ] hide alerts
- [x] Images for trips page
- [ ] Hamburger menu update for platform Navbar (not normal navbar due to brevo dialog)
- [ ] Button control Box safari attempt
- [ ] Apply button behavior and details on list view (table)
- [ ] Sharepoint
- [ ] Unlock search container on beta user, send to new york regardless
- [X] redo split point on listingdetails
- [X] deeper scroll point on button box, probalby as percent of display height
- [ ] see more button on desktop image carousel
- [x] fix height on control bar siblings
- [ ] Isabelle icon updates from figma
- [ ] Create flowchart

##13NOV24
- [X] Credit Intelligence Filtering
- [X] save to creditBucket on user
- [ ] consume Ticket
- [ ] Add Dialog to confirm data
- [ ] Create flowchart

##05NOV24
- [x] paddles
-[ ] pandadoc
-[ ] changed error messages on comingSoon
-[ ] Change stripe behaviour
-[ ] Stripe 2 payment structure
-[ ] Integrate branches
-[ ] Lease gets Rent - guest fee (but leave in cost of host fee)

##08OCT24
- [] Fix deployment issues
- [x] Create fake lease with all of trip details
- [x] Create template on AirSlate
- [x] Use template to doc gen with details
- [] add steps
- [] assign fields to steps
- [] Kick off workflow
- [] Get both siggies
- [] fix start conversation
- [x] finish resend
- [] send-lease needs URL param of housingRequest
- [] send POST to sendTEmplate endpoint, save docId to prisma.boldsignlease.create
DOCUSIGN SDK


- [x] create template
- [x] create document
- [x] send document
- [x] embed doc sign - landlord
- [x] create lease and match from client side event
- [x] watch for webhook saying person signed, add siggy to db lease
- [x] embed doc sign - tenant
- [] set housingRequest status to approved, handle this in applications logic
- [] setup second webhook for live site, please try to keep them separate (env vars for dev testing)
- [] Go through flow and change hardcoded usernames to correct username (PENDING API APPROVAL)

## 01OCT24
- [X] On booking set unavailable
- [X] On getTrip adjust query to strip out booked/unavailable
- [X] Add ability to block off without a trip
- [X] Add unavailablePeriods to bookings tab

## 24SEP24
- [X]  Change flow to choose lease at housingRequest approval
- [x] Store doc Id in match
- [x] Embed on Guest Side
- [x] Use doc Id to pull Sign embed page
- [ ] Worry about auth... somehow? email?
- [ ] Get all applicants from housingRequest, add to lease in db (ensure emails are correct for auth)

## 18SEP24
- [ ]  EMAIL TESTING
- [X] add outbound to query params, read query params to check for user profile, prompt signup if no user profile, prompt login if found, also maybe clerk to see if already signed in
- [ ] fix tab selector eating other query params
- [ ] build trip specific page
- [ ] add invited trips to current searches
- [ ] implement permissions for searches and affect UI
- [ ] add bold sign template to listing
- [ ] implement bold sign signing side

## 10SEP24
- [ ]  Stripe Connect Integration

## 7 SEP 24
- [ ]  STRIPE PLATFORM PAYMENT
 - [ ]  fix sse server 504 erron on deployed app
   -- 504 is a gateway timeout, likely due to the server not responding in time
   -- this is due to vercel serverless function timeout, which is 10 seconds
   -- possible solutions
      - build server using VPS via linode and GO
      - PUSHER for realtime messaging
      - batch requests
      - use websockets

## 5SEP24
- [x] Add profile photo, last message preview and timestamp to conversation list
- [x] photo upload support for message interface
- [ ] add status to housingRequest (pending, accepted, rejected)

#27AUG24
MOCK SEARCHBUG RESULTS
BUILD FRONTEND AROUND THAT
WHEN HAPPY WITH THAT, GET REAL DATA
REPEAT FOR BACKGROUND CHECKS

##25AUG24
get auth to webhook
OPEN API ACCOUNTS


## 21AUG24
OPEN UP STRIPE CLI (one to listen and one to trigger)
add Order to DB (include service type, status, isRedeemed)
npx prisma db push
update webhook to save order to db
Success page needs to check for Order (type: backgroundCheck, isRedeemed: false)
if no order, redirect to please pay, if found proceed with apis

## 20AUG24
STRIPE FROM APPLICATION
STRIPE RECEIPT, DB TRANSACTIONS
Get tile for listing, store image in db, display in match rather than map


## 13AUG24
padding on bottom or footer, prob footer
dialog X for search deletion is FUGLY
finish dialog (filter options, calendar, X to the left, one x, icon import)
 -- Ask Daniel about calendar
carousel (fix height, fix arrows)
ALGO
 -- do feature score
reset carousel api to 0.

[X] 1. Finish application summary

[ ] 2. MAP VIEW
        Kick up coordinates

[ ] 3. New Dashboard
        control bar, populate old data, use popovers, create double calendar, save new dates to trip via handlesave, adults counter,
        fix infinite scroll
        Matchbook
        hearts on map view listings

[] 4. Add other users&application to housingRequest

[ ] 5. Errors for client side validation

## Algorithm
U score = Sum of All Scores where Score is (Value/MaxValue * Coeffecient)

store in db, fetch on host side

Check for trip specific application
        Check for default application
If application load to application tab
If no leave blank

## Matching (Trip View)

[x] 1. Photo display left, 4x4 grid on right - New component
   - [ ] Grid needs special handling for 1, 2, 3, 4+ images - New component, child of carousel (tabled for now)

[ ] 2. Layout other details below carousel
        - [x] Almost there need tiles
        - [ ] Replace Amenities
        - [ ] Add whitespace to lower layout

[X] 3. Like/Dislike - Pass to Properties you love
   - [x] Create housingRequest (needs new name, maybe heart, maybe favorites)

   - [x] shown listings does not include matches

   - [x] Handle backing up by removing from relevant array

[ ] 4. Trip Editor

[ ] 5. Trip location Properties update (state, city, etc..) via locationIq at tripCreation/trip View

[ ] 6. Create rating property in listing model, Decimal (4.9) or string (?.?)

[ ] 7. Update listing card to allow onclick and button label, rename to TripListingCard

[ ] 8. Add notification on apply, add circle to userMenu, when click notification send to property dashboard, implemennt params routing to go right to applications

[ ] 9. Update Sets to Maps to allow for sorting by created at
## Coming Soon (marketing page)

[x] 0. Tab view for marketing branch (main/comingSoon)

[x] 1. Overlay for inputs

[ ] 2. Framer motion padding shrink for header and heart

[ ] 3. SVG fix for apartmentIcon (looking to rent Icon)

## Calendar

[ ] 1. Circle Icons

[ ] 2. Color darkening

## Image Upload

1. Better Drag and Drop

2. Image compression/sharpening

3. Image Cropping

## Test Listings

[x] 1. Get it working

[x] 2. Fix Image allocation

[x] 3. Fix State

[x] 4. Lower resolution of test photos

[ ] 5. Finish match view
        Fix height issue between carousel and lead image on diff screen sizes (Kill me)

## Refactors

[ ] 1. Move amenities to their own model


## Host View

[ ] 1. Add listing preview

[ ] 2. Utilities Included

[ ] 3. House Rules

[ ] 4. Counters in Add property bathroom or bedroom count quare footabe 50


## Third Part

[ ] 1. Retool

[ ] 2. Bold Desk


## Auth

1. Create user in platform layout page load

## ROUTING ERROR
Error: Clerk: The "/platform/trips/e0366d74-2974-403a-bc35-d453a073b94e" route is not a catch-all route. It is recommended to convert this route to a catch-all route, eg: "/platform/trips/e0366d74-2974-403a-bc35-d453a073b94e/[[...rest]]/page.tsx". Alternatively, update the SignIn component to use hash-based routing by setting the "routing" prop to "hash".
